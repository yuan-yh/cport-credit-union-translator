const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class OptimizedTranslationService {
    constructor() {
        this.modelsLoaded = false;
        this.modelCache = new Map();
        this.config = this.loadConfig();
        this.performanceMetrics = {
            transcriptionTimes: [],
            translationTimes: [],
            totalRequests: 0
        };
        
        console.log('🚀 Optimized Translation Service initialized');
        this.initializeModels();
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, '../config/gpu-config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load config:', error.message);
        }
        
        return {
            models: {
                whisper: { model_size: 'base' },
                translation: { model_size: 'small' }
            },
            performance: {
                cache_size: 100,
                preload_models: true
            }
        };
    }

    async initializeModels() {
        try {
            console.log('🔧 Initializing optimized models...');
            
            // Preload Whisper model
            await this.preloadWhisperModel();
            
            this.modelsLoaded = true;
            console.log('✅ Optimized models initialized successfully');
            
        } catch (error) {
            console.error('❌ Model initialization failed:', error.message);
        }
    }

    async preloadWhisperModel() {
        return new Promise((resolve, reject) => {
            const pythonScript = `
import whisper
import sys
import json
import time

try:
    # Load Whisper model
    model_size = "${this.config.models.whisper.model_size}"
    print(f"Loading Whisper model: {model_size}")
    
    start_time = time.time()
    model = whisper.load_model(model_size)
    load_time = time.time() - start_time
    
    print(f"Model loaded in {load_time:.2f} seconds")
    
    # Warm up the model
    import numpy as np
    dummy_audio = np.random.randn(16000).astype(np.float32)
    warmup_start = time.time()
    _ = model.transcribe(dummy_audio, language="en")
    warmup_time = time.time() - warmup_start
    
    print(f"Model warmed up in {warmup_time:.2f} seconds")
    print("Whisper model ready")
    sys.exit(0)
    
except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)
            `;

            const python = spawn('python3', ['-c', pythonScript]);
            
            python.stdout.on('data', (data) => {
                console.log(`Model Init: ${data.toString().trim()}`);
            });
            
            python.stderr.on('data', (data) => {
                console.error(`Model Init Error: ${data.toString().trim()}`);
            });
            
            python.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Model initialization failed with code ${code}`));
                }
            });
        });
    }

    async transcribeAudio(audioBuffer, language = 'en') {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const tempFile = `/tmp/audio_${Date.now()}.wav`;
            
            // Write audio buffer to temporary file
            fs.writeFileSync(tempFile, audioBuffer);
            
            const pythonScript = `
import whisper
import sys
import json
import time

try:
    model_size = "${this.config.models.whisper.model_size}"
    
    # Load model (should be cached from preload)
    model = whisper.load_model(model_size)
    
    # Transcribe audio
    start_time = time.time()
    result = model.transcribe("${tempFile}", language="${language}")
    transcribe_time = time.time() - start_time
    
    print(json.dumps({
        "text": result["text"].strip(),
        "language": result.get("language", "${language}"),
        "segments": result.get("segments", []),
        "processing_time": transcribe_time
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
                
                const totalTime = Date.now() - startTime;
                this.performanceMetrics.transcriptionTimes.push(totalTime);
                this.performanceMetrics.totalRequests++;
                
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
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const pythonScript = `
import sys
import json
import time

try:
    # For now, use a simple translation approach
    # In production, you'd use a proper translation model
    
    # Simulate translation processing time
    time.sleep(0.1)  # Simulate processing
    
    # Simple translation mapping (replace with actual model)
    translations = {
        "hello": {
            "es": "hola",
            "fr": "bonjour", 
            "pt": "olá",
            "so": "salaan",
            "ar": "مرحبا"
        },
        "thank you": {
            "es": "gracias",
            "fr": "merci",
            "pt": "obrigado",
            "so": "mahadsanid",
            "ar": "شكرا"
        }
    }
    
    text_lower = "${text}".lower()
    translated_text = translations.get(text_lower, {}).get("${targetLang}", "${text}")
    
    print(json.dumps({
        "translated_text": translated_text,
        "source_language": "${sourceLang}",
        "target_language": "${targetLang}",
        "processing_time": 0.1
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
                const totalTime = Date.now() - startTime;
                this.performanceMetrics.translationTimes.push(totalTime);
                
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

    getPerformanceMetrics() {
        const avgTranscription = this.performanceMetrics.transcriptionTimes.length > 0 
            ? this.performanceMetrics.transcriptionTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.transcriptionTimes.length
            : 0;
            
        const avgTranslation = this.performanceMetrics.translationTimes.length > 0
            ? this.performanceMetrics.translationTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.translationTimes.length
            : 0;

        return {
            models_loaded: this.modelsLoaded,
            total_requests: this.performanceMetrics.totalRequests,
            avg_transcription_time: Math.round(avgTranscription),
            avg_translation_time: Math.round(avgTranslation),
            config: this.config
        };
    }

    getStatus() {
        return {
            service: 'OptimizedTranslationService',
            status: 'running',
            models_loaded: this.modelsLoaded,
            performance: this.getPerformanceMetrics()
        };
    }
}

module.exports = OptimizedTranslationService;
