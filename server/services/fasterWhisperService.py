#!/usr/bin/env python3
"""
Faster Whisper Service for Credit Union Translator
Provides up to 4x faster speech-to-text transcription using CTranslate2
"""

import os
import sys
import json
import tempfile
from faster_whisper import WhisperModel
import logging

# Fix OpenMP library conflict on macOS/Anaconda
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FasterWhisperService:
    def __init__(self):
        # Configuration from environment variables
        self.model_size = os.getenv('FASTER_WHISPER_MODEL', 'tiny')  # Optimized for CPU speed
        self.device = os.getenv('FASTER_WHISPER_DEVICE', 'cpu')  # cpu or cuda
        self.compute_type = os.getenv('FASTER_WHISPER_COMPUTE_TYPE', 'int8')  # float16, int8, int8_float16
        self.beam_size = int(os.getenv('FASTER_WHISPER_BEAM_SIZE', '1'))  # Optimized for speed
        self.vad_filter = os.getenv('FASTER_WHISPER_VAD_FILTER', 'true').lower() == 'true'
        self.word_timestamps = os.getenv('FASTER_WHISPER_WORD_TIMESTAMPS', 'false').lower() == 'true'
        
        # Additional performance optimizations
        self.cpu_threads = int(os.getenv('FASTER_WHISPER_CPU_THREADS', '4'))  # CPU threads
        self.batch_size = int(os.getenv('FASTER_WHISPER_BATCH_SIZE', '1'))  # Batch size
        
        # Initialize model (lazy loading to avoid startup delay)
        self.model = None
        self.model_loaded = False
    
    def _ensure_model_loaded(self):
        """Ensure model is loaded (lazy loading)"""
        if not self.model_loaded:
            try:
                logger.info(f"Loading faster-whisper model: {self.model_size}")
                logger.info(f"Device: {self.device}, Compute type: {self.compute_type}")
                
                self.model = WhisperModel(
                    self.model_size,
                    device=self.device,
                    compute_type=self.compute_type,
                    cpu_threads=self.cpu_threads
                )
                self.model_loaded = True
                logger.info("Faster-whisper model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load faster-whisper model: {e}")
                raise
    
    def transcribe_audio(self, audio_file_path, language=None, banking_context=True):
        """
        Transcribe audio file using faster-whisper
        
        Args:
            audio_file_path: Path to audio file
            language: Target language code (optional)
            banking_context: Whether to use banking-specific prompts
            
        Returns:
            dict: Transcription result with text, segments, and metadata
        """
        try:
            logger.info(f"Transcribing audio: {audio_file_path}")
            
            # Ensure model is loaded
            self._ensure_model_loaded()
            
            # Prepare transcription parameters (ultra-optimized for CPU)
            transcribe_params = {
                'beam_size': self.beam_size,
                'vad_filter': self.vad_filter,
                'word_timestamps': self.word_timestamps,
                'condition_on_previous_text': False,  # Faster for CPU
                'compression_ratio_threshold': 2.4,   # Optimized threshold
                'log_prob_threshold': -1.0,          # Optimized threshold
                'no_speech_threshold': 0.6,          # Optimized threshold
                'temperature': 0.0,                  # Deterministic output
                'best_of': 1,                        # Single best result
                'patience': 1.0,                     # Faster decoding
                'length_penalty': 1.0,               # Balanced length
                'repetition_penalty': 1.0,           # No repetition penalty
                'no_repeat_ngram_size': 0            # No n-gram repetition
            }
            
            if language:
                transcribe_params['language'] = language
            
            # Add banking context if needed
            if banking_context and language:
                transcribe_params['initial_prompt'] = self._get_banking_prompt(language)
            
            # Perform transcription
            segments, info = self.model.transcribe(audio_file_path, **transcribe_params)
            
            # Convert segments to list (this triggers the actual transcription)
            segments_list = list(segments)
            
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
                'word_timestamps': []
            }
            
            # Add word-level timestamps if enabled
            if self.word_timestamps:
                for segment in segments_list:
                    if hasattr(segment, 'words') and segment.words:
                        for word in segment.words:
                            result['word_timestamps'].append({
                                'start': word.start,
                                'end': word.end,
                                'word': word.word,
                                'probability': getattr(word, 'probability', None)
                            })
            
            logger.info(f"Transcription completed. Text length: {len(full_text)} chars")
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
                'word_timestamps': []
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

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python fasterWhisperService.py <audio_file> [language]")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(audio_file):
        print(f"Error: Audio file '{audio_file}' not found")
        sys.exit(1)
    
    # Initialize service
    service = FasterWhisperService()
    
    # Transcribe audio
    result = service.transcribe_audio(audio_file, language)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
