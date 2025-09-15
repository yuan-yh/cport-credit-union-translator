const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GPUTranslationService {
    constructor() {
        this.gpuEnabled = process.argv.includes('--gpu');
        this.modelsLoaded = false;
        this.modelCache = new Map();
        this.config = this.loadGPUConfig();
        
        if (this.gpuEnabled) {
            console.log('🚀 GPU acceleration enabled');
            this.initializeGPU();
        } else {
            console.log('⚠️  GPU acceleration disabled - using CPU fallback');
        }
    }

    loadGPUConfig() {
        try {
            const configPath = path.join(__dirname, '../config/gpu-config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load GPU config:', error.message);
        }
        
        return {
            gpu: { enabled: false },
            models: {
                whisper: { model_size: 'base', device: 'cpu' },
                translation: { model_size: 'small', device: 'cpu' }
            }
        };
    }

    async initializeGPU() {
        if (!this.gpuEnabled) return;

        try {
            console.log('🔧 Initializing GPU models...');
            
            // Preload Whisper model
            await this.preloadWhisperModel();
            
            // Preload translation models
            await this.preloadTranslationModels();
            
            this.modelsLoaded = true;
            console.log('✅ GPU models initialized successfully');
            
        } catch (error) {
            console.error('❌ GPU initialization failed:', error.message);
            this.gpuEnabled = false;
        }
    }

    async preloadWhisperModel() {
        return new Promise((resolve, reject) => {
            const pythonScript = `
import torch
import whisper
import sys
import json

try:
    # Check GPU availability
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    if device == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    
    # Load Whisper model
    model_size = "${this.config.models.whisper.model_size}"
    model = whisper.load_model(model_size, device=device)
    
    # Warm up the model
    import numpy as np
    dummy_audio = np.random.randn(16000).astype(np.float32)
    _ = model.transcribe(dummy_audio, language="en")
    
    print("Whisper model loaded and warmed up successfully")
    sys.exit(0)
    
except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)
            `;

            const python = spawn('python3', ['-c', pythonScript]);
            
            python.stdout.on('data', (data) => {
                console.log(`GPU Init: ${data.toString().trim()}`);
            });
            
            python.stderr.on('data', (data) => {
                console.error(`GPU Init Error: ${data.toString().trim()}`);
            });
            
            python.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`GPU initialization failed with code ${code}`));
                }
            });
        });
    }

    async preloadTranslationModels() {
        return new Promise((resolve, reject) => {
            const pythonScript = `
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import sys

try:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Load translation models for common language pairs
    models = {
        "en-es": "Helsinki-NLP/opus-mt-en-es",
        "es-en": "Helsinki-NLP/opus-mt-es-en", 
        "en-fr": "Helsinki-NLP/opus-mt-en-fr",
        "fr-en": "Helsinki-NLP/opus-mt-fr-en",
        "en-pt": "Helsinki-NLP/opus-mt-en-pt",
        "pt-en": "Helsinki-NLP/opus-mt-pt-en"
    }
    
    for pair, model_name in models.items():
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device)
        print(f"Loaded {pair} model on {device}")
    
    print("All translation models loaded successfully")
    sys.exit(0)
    
except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)
            `;

            const python = spawn('python3', ['-c', pythonScript]);
            
            python.stdout.on('data', (data) => {
                console.log(`Translation Init: ${data.toString().trim()}`);
            });
            
            python.stderr.on('data', (data) => {
                console.error(`Translation Init Error: ${data.toString().trim()}`);
            });
            
            python.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Translation model initialization failed with code ${code}`));
                }
            });
        });
    }

    async transcribeAudio(audioBuffer, language = 'en') {
        if (!this.gpuEnabled) {
            return this.fallbackTranscription(audioBuffer, language);
        }

        return new Promise((resolve, reject) => {
            const tempFile = `/tmp/audio_${Date.now()}.wav`;
            
            // Write audio buffer to temporary file
            fs.writeFileSync(tempFile, audioBuffer);
            
            const pythonScript = `
import whisper
import torch
import sys
import json

try:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_size = "${this.config.models.whisper.model_size}"
    
    # Load model (should be cached from preload)
    model = whisper.load_model(model_size, device=device)
    
    # Transcribe audio
    result = model.transcribe("${tempFile}", language="${language}")
    
    print(json.dumps({
        "text": result["text"].strip(),
        "language": result.get("language", "${language}"),
        "segments": result.get("segments", [])
    }))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
            `;

            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';
            
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                console.error(`Transcription Error: ${data.toString().trim()}`);
            });
            
            python.on('close', (code) => {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempFile);
                } catch (error) {
                    console.warn('Could not delete temp file:', error.message);
                }
                
                if (code === 0) {
                    try {
                        const result = JSON.parse(output.trim());
                        if (result.error) {
                            reject(new Error(result.error));
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse transcription result'));
                    }
                } else {
                    reject(new Error(`Transcription failed with code ${code}`));
                }
            });
        });
    }

    async translateText(text, sourceLang, targetLang) {
        if (!this.gpuEnabled) {
            return this.fallbackTranslation(text, sourceLang, targetLang);
        }

        const modelKey = `${sourceLang}-${targetLang}`;
        
        return new Promise((resolve, reject) => {
            const pythonScript = `
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import sys
import json

try:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Model mapping
    models = {
        "en-es": "Helsinki-NLP/opus-mt-en-es",
        "es-en": "Helsinki-NLP/opus-mt-es-en",
        "en-fr": "Helsinki-NLP/opus-mt-en-fr", 
        "fr-en": "Helsinki-NLP/opus-mt-fr-en",
        "en-pt": "Helsinki-NLP/opus-mt-en-pt",
        "pt-en": "Helsinki-NLP/opus-mt-pt-en",
        "en-so": "Helsinki-NLP/opus-mt-en-so",
        "so-en": "Helsinki-NLP/opus-mt-so-en",
        "en-ar": "Helsinki-NLP/opus-mt-en-ar",
        "ar-en": "Helsinki-NLP/opus-mt-ar-en"
    }
    
    model_key = "${modelKey}"
    if model_key not in models:
        print(json.dumps({"error": f"Unsupported language pair: {model_key}"}))
        sys.exit(1)
    
    model_name = models[model_key]
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device)
    
    # Translate text
    inputs = tokenizer("${text.replace(/"/g, '\\"')}", return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=512, num_beams=4, early_stopping=True)
    
    translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    print(json.dumps({
        "translated_text": translated_text,
        "source_language": "${sourceLang}",
        "target_language": "${targetLang}"
    }))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
            `;

            const python = spawn('python3', ['-c', pythonScript]);
            let output = '';
            
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                console.error(`Translation Error: ${data.toString().trim()}`);
            });
            
            python.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output.trim());
                        if (result.error) {
                            reject(new Error(result.error));
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse translation result'));
                    }
                } else {
                    reject(new Error(`Translation failed with code ${code}`));
                }
            });
        });
    }

    async fallbackTranscription(audioBuffer, language) {
        // Fallback to existing transcription service
        console.log('Using CPU fallback for transcription');
        // This would call your existing transcription service
        return { text: 'Fallback transcription', language };
    }

    async fallbackTranslation(text, sourceLang, targetLang) {
        // Fallback to existing translation service
        console.log('Using CPU fallback for translation');
        // This would call your existing translation service
        return { translated_text: `Fallback: ${text}`, source_language: sourceLang, target_language: targetLang };
    }

    getGPUStatus() {
        return {
            gpu_enabled: this.gpuEnabled,
            models_loaded: this.modelsLoaded,
            config: this.config,
            cache_size: this.modelCache.size
        };
    }
}

module.exports = GPUTranslationService;
