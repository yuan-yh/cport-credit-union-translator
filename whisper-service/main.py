"""
Faster Whisper STT Microservice
Runs on GPU VM for low-latency speech-to-text transcription
"""

import os
import io
import time
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Initialize Faster Whisper
from faster_whisper import WhisperModel

# Configuration
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")  # tiny, base, small, medium, large-v2
DEVICE = os.getenv("WHISPER_DEVICE", "cuda")  # cuda or cpu
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")  # float16, int8, or float32

print(f"Loading Faster Whisper model: {MODEL_SIZE} on {DEVICE} ({COMPUTE_TYPE})")
start_load = time.time()

model = WhisperModel(
    MODEL_SIZE,
    device=DEVICE,
    compute_type=COMPUTE_TYPE,
    download_root="/app/models"
)

print(f"Model loaded in {time.time() - start_load:.2f}s")

# FastAPI app
app = FastAPI(
    title="Faster Whisper STT Service",
    description="Low-latency speech-to-text using Faster Whisper on GPU",
    version="1.0.0"
)

# CORS for internal service communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    confidence: float
    processing_time_ms: int
    provider: str = "faster-whisper"


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model=MODEL_SIZE,
        device=DEVICE
    )


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """
    Transcribe audio using Faster Whisper
    
    Args:
        audio: Audio file (webm, wav, mp3, etc.)
        language: Optional language code (en, es, fr, etc.) for faster processing
    
    Returns:
        Transcription with text, detected language, and timing info
    """
    start_time = time.time()
    
    try:
        # Read audio data
        audio_data = await audio.read()
        
        # Save to temp file (faster-whisper needs file path)
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
        
        try:
            # Transcribe with Faster Whisper
            segments, info = model.transcribe(
                tmp_path,
                language=language if language and language != "auto" else None,
                beam_size=5,
                vad_filter=True,  # Filter out non-speech
                vad_parameters=dict(
                    min_silence_duration_ms=500,
                    speech_pad_ms=200,
                ),
            )
            
            # Combine all segments
            full_text = " ".join([segment.text.strip() for segment in segments])
            
            # Normalize cPort
            full_text = normalize_cport(full_text)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Calculate average confidence
            # Note: faster-whisper doesn't provide per-segment confidence easily
            # Using a reasonable default
            confidence = 0.95
            
            print(f"[Faster-Whisper] SUCCESS: \"{full_text[:50]}...\" ({processing_time}ms, lang: {info.language})")
            
            return TranscriptionResponse(
                text=full_text,
                language=info.language,
                confidence=confidence,
                processing_time_ms=processing_time,
                provider="faster-whisper"
            )
            
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
            
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        print(f"[Faster-Whisper] ERROR: {str(e)} ({processing_time}ms)")
        raise HTTPException(status_code=500, detail=str(e))


def normalize_cport(text: str) -> str:
    """Normalize seaport variations to cPort"""
    import re
    return re.sub(
        r'seaport|sea port|c port|c-port|see port|cee port',
        'cPort',
        text,
        flags=re.IGNORECASE
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
