# backend/main.py
import asyncio
import base64
import json
import os
import tempfile
from typing import Dict
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from faster_whisper import WhisperModel
from TTS.api import TTS

app = FastAPI()

# Mount static files from the current directory
app.mount("/static", StaticFiles(directory="."), name="static")

# Root endpoint to serve the HTML file
@app.get("/")
async def read_root():
    return FileResponse("index.html")

# Load models once (adjust model sizes for latency/accuracy)
ASR_MODEL_NAME = os.environ.get("ASR_MODEL", "small")    # tiny/base/small/medium/large-v3
TTS_MODEL_NAME = os.environ.get("TTS_MODEL", "tts_models/multilingual/multi-dataset/your_tts")
# Translation behavior configuration (hardcoded):
# - Always auto-translate non-English input to English
TRANSLATION_MODE = "auto_to_en"
TARGET_LANG = "en"

print("Loading ASR model:", ASR_MODEL_NAME)
asr_model = WhisperModel(ASR_MODEL_NAME, device="cuda" if (os.environ.get("USE_CUDA") == "1") else "cpu")

print("Loading TTS model:", TTS_MODEL_NAME)
tts = TTS(model_name=TTS_MODEL_NAME)

# Simple per-connection buffer to accumulate audio frames
class Connection:
    def __init__(self, ws: WebSocket):
        self.ws = ws
        self.buffer = []  # list of float32 numpy arrays
        self.sr = 16000
        self.last_recv = asyncio.get_event_loop().time()
        self.vad_silence_timeout = 0.6  # seconds of silence to consider "utterance end"
        # Streaming helpers
        self._transcribe_lock = asyncio.Lock()
        self._last_partial_text = ""
        self._last_partial_ts = 0.0

    async def append_frame(self, data: bytes):
        # client sends Float32 PCM little-endian (web code below)
        arr = np.frombuffer(data, dtype=np.float32)
        self.buffer.append(arr)
        self.last_recv = asyncio.get_event_loop().time()

    async def flush_and_transcribe(self):
        if not self.buffer:
            return None, None, None
        
        wav = np.concatenate(self.buffer, axis=0)
        self.buffer = []
        
        # Write wav to temp file and run whisper
        tmp = tempfile.mktemp(suffix=".wav")
        sf.write(tmp, wav, self.sr, subtype="PCM_16")
        
        # Transcribe with language detection
        segments, info = asr_model.transcribe(tmp, beam_size=1)
        original_text = "".join(seg.text for seg in segments).strip()
        detected_language = info.language
        
        # Decide translation behavior
        final_text = original_text
        final_lang = detected_language
        try:
            if original_text:
                if TRANSLATION_MODE == "off":
                    # keep as-is
                    pass
                elif TRANSLATION_MODE == "auto_to_en":
                    if detected_language != "en":
                        print(f"Translating from {detected_language} -> en via Whisper: {original_text}")
                        segments_en, _ = asr_model.transcribe(tmp, beam_size=1, task="translate")
                        translated = "".join(seg.text for seg in segments_en).strip()
                        if translated:
                            final_text = translated
                            final_lang = "en"
                elif TRANSLATION_MODE == "force_to_target":
                    # Faster-Whisper only supports translate->English reliably.
                    if TARGET_LANG == "en" and detected_language != "en":
                        print(f"Translating (forced) {detected_language} -> en via Whisper: {original_text}")
                        segments_en, _ = asr_model.transcribe(tmp, beam_size=1, task="translate")
                        translated = "".join(seg.text for seg in segments_en).strip()
                        if translated:
                            final_text = translated
                            final_lang = "en"
                    else:
                        # Unsupported target for translation; keep original
                        pass
        except Exception as e:
            print(f"Translation decision/processing failed: {e}")
            final_text = original_text
            final_lang = detected_language
        
        # Remove temp file after all processing
        os.remove(tmp)
        
        return final_text, detected_language, final_lang

    async def transcribe_partial(self):
        # Do not clear buffer; provide interim transcript
        if not self.buffer:
            return None, None, None
        # Throttle partials to ~1/sec
        now = asyncio.get_event_loop().time()
        if (now - self._last_partial_ts) < 0.8:
            return None, None, None
        if self._transcribe_lock.locked():
            return None, None, None
        async with self._transcribe_lock:
            wav = np.concatenate(self.buffer, axis=0)
            if wav.size < int(0.5 * self.sr):
                return None, None, None
            tmp = tempfile.mktemp(suffix=".wav")
            sf.write(tmp, wav, self.sr, subtype="PCM_16")
            try:
                segments, info = asr_model.transcribe(tmp, beam_size=1)
                original_text = "".join(seg.text for seg in segments).strip()
                detected_language = info.language
                final_text = original_text
                final_lang = detected_language
                if TRANSLATION_MODE == "auto_to_en" and detected_language != "en" and original_text:
                    try:
                        segments_en, _ = asr_model.transcribe(tmp, beam_size=1, task="translate")
                        translated = "".join(seg.text for seg in segments_en).strip()
                        if translated:
                            final_text = translated
                            final_lang = "en"
                    except Exception:
                        pass
                if final_text and final_text != self._last_partial_text:
                    self._last_partial_text = final_text
                    self._last_partial_ts = now
                    payload = {
                        "type": "transcript",
                        "text": final_text,
                        "original_language": detected_language,
                        "final_language": final_lang,
                        "is_translated": detected_language != final_lang,
                        "is_partial": True
                    }
                    await self.ws.send_text(json.dumps(payload))
                return final_text, detected_language, final_lang
            finally:
                try:
                    os.remove(tmp)
                except Exception:
                    pass

    async def synthesize_and_send(self, text, lang="en"):
        if not text:
            return
        tmp_out = tempfile.mktemp(suffix=".wav")
        # TTS API: tts.tts_to_file
        tts.tts_to_file(text=text, file_path=tmp_out, language=lang)
        data, sr = sf.read(tmp_out, dtype="float32")
        # Downmix to mono if necessary for consistent client playback
        if hasattr(data, "ndim") and data.ndim == 2:
            data = data.mean(axis=1)
        os.remove(tmp_out)

        b64 = base64.b64encode(data.tobytes()).decode("ascii")
        payload = {"type": "audio", "sr": sr, "format": "float32", "data_b64": b64}
        await self.ws.send_text(json.dumps(payload))

connections: Dict[str, Connection] = {}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    print(f"WebSocket connection request from client: {client_id}")
    await websocket.accept()
    print(f"WebSocket accepted for client: {client_id}")
    
    conn = Connection(websocket)
    connections[client_id] = conn
    print(f"Client connected: {client_id}")

    try:
        # Start a background task to check silence timeouts
        async def monitor_silence():
            while True:
                await asyncio.sleep(0.15)
                now = asyncio.get_event_loop().time()
                # if time since last frame exceeds timeout and buffer has data -> finalize utterance
                if conn.buffer and (now - conn.last_recv) > conn.vad_silence_timeout:
                    print(f"Silence timeout reached for client {client_id}, processing buffer...")
                    result = await conn.flush_and_transcribe()
                    if result and result[0]:  # Check if we have text
                        final_text, detected_language, final_lang = result
                        print(f"Transcribed text for client {client_id}: {final_text} (from {detected_language} -> {final_lang})")

                        # Send transcript to client with language info
                        transcript_payload = {
                            "type": "transcript",
                            "text": final_text,
                            "original_language": detected_language,
                            "final_language": final_lang,
                            "is_translated": detected_language != final_lang,
                            "is_partial": False
                        }
                        await websocket.send_text(json.dumps(transcript_payload))

                        # synthesize and send audio in final language
                        await conn.synthesize_and_send(final_text, final_lang or "en")
                else:
                    # While speaking, attempt partial transcripts
                    try:
                        await conn.transcribe_partial()
                    except Exception as e:
                        print(f"Partial transcription error for client {client_id}: {e}")
        monitor_task = asyncio.create_task(monitor_silence())

        while True:
            try:
                msg = await websocket.receive()
                print(f"Client {client_id} - Received message type: {type(msg)}")
                
                # Handle binary audio data
                if isinstance(msg, bytes):
                    print(f"Client {client_id} - Received binary audio data: {len(msg)} bytes")
                    await conn.append_frame(msg)
                    
                # Handle text messages (JSON)
                elif isinstance(msg, str):
                    print(f"Client {client_id} - Received text message: {msg}")
                    try:
                        data = json.loads(msg)
                        if data.get("cmd") == "flush":
                            print(f"Client {client_id} - Flush command received")
                            result = await conn.flush_and_transcribe()
                            if result and result[0]:  # Check if we have text
                                final_text, detected_language, final_lang = result
                                print(f"Client {client_id} - Flush transcribed: {final_text} (from {detected_language} -> {final_lang})")

                                # Send transcript to client with language info
                                transcript_payload = {
                                    "type": "transcript",
                                    "text": final_text,
                                    "original_language": detected_language,
                                    "final_language": final_lang,
                                    "is_translated": detected_language != final_lang
                                }
                                await websocket.send_text(json.dumps(transcript_payload))
                                await conn.synthesize_and_send(final_text, final_lang or "en")
                        elif data.get("cmd") == "ping":
                            print(f"Client {client_id} - Ping received, sending pong")
                            await websocket.send_text(json.dumps({"type": "pong"}))
                    except json.JSONDecodeError:
                        print(f"Client {client_id} - Invalid JSON message: {msg}")
                        
                # Handle WebSocket message dict (FastAPI format)
                elif isinstance(msg, dict):
                    print(f"Client {client_id} - Received WebSocket message: {msg}")
                    if msg.get("type") == "websocket.receive":
                        data = msg.get("bytes")
                        text_msg = msg.get("text")
                        if data:
                            print(f"Client {client_id} - Received binary audio data: {len(data)} bytes")
                            await conn.append_frame(data)
                        elif text_msg:
                            print(f"Client {client_id} - Received text message: {text_msg}")
                            try:
                                m = json.loads(text_msg)
                                if m.get("cmd") == "flush":
                                    print(f"Client {client_id} - Flush command received")
                                    result = await conn.flush_and_transcribe()
                                    if result and result[0]:  # Check if we have text
                                        final_text, detected_language, final_lang = result
                                        print(f"Client {client_id} - Flush transcribed: {final_text} (from {detected_language} -> {final_lang})")

                                        # Send transcript to client with language info
                                        transcript_payload = {
                                            "type": "transcript",
                                            "text": final_text,
                                            "original_language": detected_language,
                                            "final_language": final_lang,
                                            "is_translated": detected_language != final_lang
                                        }
                                        await websocket.send_text(json.dumps(transcript_payload))
                                        await conn.synthesize_and_send(final_text, final_lang or "en")
                            except json.JSONDecodeError:
                                print(f"Client {client_id} - Invalid JSON in text message: {text_msg}")
                else:
                    print(f"Client {client_id} - Unknown message type: {type(msg)}")
                    
            except Exception as e:
                print(f"Client {client_id} - Error processing message: {e}")
                break
                
    except WebSocketDisconnect:
        print(f"Client {client_id} - WebSocket disconnected")
    finally:
        print(f"Client {client_id} - Cleaning up connection")
        monitor_task.cancel()
        del connections[client_id]
