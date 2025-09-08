#!/usr/bin/env python3
"""
Persistent Faster Whisper Server for Credit Union Translator
Keeps model loaded in memory for ultra-fast transcription
"""

import os
import sys
import json
import tempfile
import time
from faster_whisper import WhisperModel
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# Fix OpenMP library conflict on macOS/Anaconda
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FasterWhisperServer:
    def __init__(self):
        # Configuration from environment variables
        self.model_size = os.getenv('FASTER_WHISPER_MODEL', 'tiny')
        self.device = os.getenv('FASTER_WHISPER_DEVICE', 'cpu')
        self.compute_type = os.getenv('FASTER_WHISPER_COMPUTE_TYPE', 'int8')
        self.beam_size = int(os.getenv('FASTER_WHISPER_BEAM_SIZE', '1'))
        self.vad_filter = os.getenv('FASTER_WHISPER_VAD_FILTER', 'true').lower() == 'true'
        self.word_timestamps = os.getenv('FASTER_WHISPER_WORD_TIMESTAMPS', 'false').lower() == 'true'
        
        # Model will be loaded on first request
        self.model = None
        self.model_loaded = False
        self.load_time = 0
    
    def _ensure_model_loaded(self):
        """Ensure model is loaded (only load once)"""
        if not self.model_loaded:
            try:
                logger.info(f"Loading faster-whisper model: {self.model_size}")
                start_time = time.time()
                
                self.model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type
                )
                
                self.load_time = time.time() - start_time
                self.model_loaded = True
                logger.info(f"Faster-whisper model loaded successfully in {self.load_time:.2f}s")
            except Exception as e:
                logger.error(f"Failed to load faster-whisper model: {e}")
                raise
    
    def transcribe_audio(self, audio_file_path, language=None):
        """Transcribe audio file using faster-whisper"""
        try:
            # Ensure model is loaded
            self._ensure_model_loaded()
            
            # Prepare transcription parameters (optimized for CPU)
            transcribe_params = {
                'beam_size': self.beam_size,
                'vad_filter': self.vad_filter,
                'word_timestamps': self.word_timestamps,
                'condition_on_previous_text': False,
                'compression_ratio_threshold': 2.4,
                'log_prob_threshold': -1.0,
                'no_speech_threshold': 0.6
            }
            
            if language:
                transcribe_params['language'] = language
            
            # Add banking context
            if language:
                transcribe_params['initial_prompt'] = self._get_banking_prompt(language)
            
            # Perform transcription
            start_time = time.time()
            segments, info = self.model.transcribe(audio_file_path, **transcribe_params)
            segments_list = list(segments)
            transcription_time = time.time() - start_time
            
            # Extract text and metadata
            full_text = " ".join([segment.text.strip() for segment in segments_list])
            
            # Prepare result
            result = {
                'success': True,
                'text': full_text,
                'language': info.language,
                'language_probability': info.language_probability,
                'duration': info.duration,
                'segments': [
                    {
                        'start': segment.start,
                        'end': segment.end,
                        'text': segment.text.strip()
                    }
                    for segment in segments_list
                ],
                'word_timestamps': [],
                'transcription_time': transcription_time,
                'model_load_time': self.load_time
            }
            
            logger.info(f"Transcription completed in {transcription_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'language': None,
                'language_probability': 0.0,
                'duration': 0.0,
                'segments': [],
                'word_timestamps': [],
                'transcription_time': 0,
                'model_load_time': self.load_time
            }
    
    def _get_banking_prompt(self, language):
        """Get banking-specific prompt for better transcription accuracy"""
        prompts = {
            'en': 'Banking conversation about accounts, transactions, loans, deposits, withdrawals, credit cards, and financial services.',
            'es': 'Conversación bancaria sobre cuentas, transacciones, préstamos, depósitos, retiros, tarjetas de crédito y servicios financieros.',
            'pt': 'Conversa bancária sobre contas, transações, empréstimos, depósitos, saques, cartões de crédito e serviços financeiros.',
            'fr': 'Conversation bancaire sur les comptes, transactions, prêts, dépôts, retraits, cartes de crédit et services financiers.',
            'ar': 'محادثة مصرفية حول الحسابات والمعاملات والقروض والودائع والسحوبات وبطاقات الائتمان والخدمات المالية.',
            'so': 'Wadahadal bangiga ah oo ku saabsan koontada, macaamil, deyn, dhigaal, lacag-bixinta, kaarka deynta, iyo adeegyada dhaqaalaha.'
        }
        return prompts.get(language, prompts['en'])

# Global server instance
whisper_server = FasterWhisperServer()

class WhisperRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/transcribe':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                audio_file_path = data.get('audio_file_path')
                language = data.get('language')
                
                if not audio_file_path:
                    self.send_error_response('Missing audio_file_path')
                    return
                
                # Transcribe audio
                result = whisper_server.transcribe_audio(audio_file_path, language)
                
                # Send response
                self.send_success_response(result)
                
            except Exception as e:
                logger.error(f"Request handling error: {e}")
                self.send_error_response(str(e))
        else:
            self.send_error_response('Invalid endpoint')
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, message):
        self.send_response(400)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        error_response = {'success': False, 'error': message}
        self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def log_message(self, format, *args):
        # Suppress default HTTP logging
        pass

def start_server(port=8999):
    """Start the persistent whisper server"""
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, WhisperRequestHandler)
    logger.info(f"Faster-whisper server starting on port {port}")
    logger.info("Model will be loaded on first transcription request")
    httpd.serve_forever()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8999
    start_server(port)
