const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GoogleSTTService {
    constructor() {
        this.isEnabled = process.env.GOOGLE_STT_ENABLED === 'true';
        this.model = process.env.GOOGLE_STT_MODEL || 'latest_long';
        this.languageCode = process.env.GOOGLE_STT_LANGUAGE || 'auto';
        this.apiKey = process.env.GOOGLE_STT_API_KEY || 'REDACTED_GOOGLE_KEY';
        this.baseUrl = 'https://speech.googleapis.com/v1/speech:recognize';
        
        console.log(`🎤 Google STT Service initialized: ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🎤 Using API key: ${this.apiKey ? 'YES' : 'NO'}`);
    }


    /**
     * Convert WebM audio to WAV format using ffmpeg
     */
    async convertWebMToWav(audioBuffer) {
        return new Promise((resolve, reject) => {
            const tempInputPath = path.join('/tmp', `input_${Date.now()}.webm`);
            const tempOutputPath = path.join('/tmp', `output_${Date.now()}.wav`);
            
            // Write input buffer to temporary file
            fs.writeFileSync(tempInputPath, audioBuffer);
            
            // Convert using ffmpeg
            const ffmpeg = spawn('ffmpeg', [
                '-i', tempInputPath,
                '-ar', '16000', // Sample rate
                '-ac', '1',     // Mono
                '-f', 'wav',     // Output format
                tempOutputPath
            ]);
            
            ffmpeg.on('close', (code) => {
                // Clean up input file
                try {
                    fs.unlinkSync(tempInputPath);
                } catch (e) {}
                
                if (code === 0) {
                    try {
                        const wavBuffer = fs.readFileSync(tempOutputPath);
                        fs.unlinkSync(tempOutputPath);
                        resolve(wavBuffer);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`ffmpeg conversion failed with code ${code}`));
                }
            });
            
            ffmpeg.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Ultra-fast streaming transcription with Google Cloud Speech-to-Text
     */
    async streamingTranscription(audioBuffer, language = 'auto', isFinal = false) {
        if (!this.isEnabled) {
            throw new Error('Google STT is disabled');
        }

        const startTime = Date.now();
        console.log(`🎤 Starting Google STT transcription: ${audioBuffer.length} bytes, language: ${language}, isFinal: ${isFinal}`);
        
        try {
            // Convert WebM to WAV for Google Cloud STT
            let processedAudioBuffer = audioBuffer;
            try {
                processedAudioBuffer = await this.convertWebMToWav(audioBuffer);
                console.log(`🔄 Converted WebM to WAV: ${audioBuffer.length} -> ${processedAudioBuffer.length} bytes`);
            } catch (conversionError) {
                console.log('⚠️ WebM conversion failed, using original buffer:', conversionError.message);
            }

            // Simplified configuration to avoid 400 errors
            const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: language === 'auto' ? 'en-US' : language,
                enableAutomaticPunctuation: true
            };

            const request = {
                config: config,
                audio: {
                    content: processedAudioBuffer.toString('base64')
                }
            };

            console.log('📡 Sending request to Google STT API...');
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 Google STT Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText,
                    config: config,
                    audioSize: audioBuffer.length,
                    audioStart: audioBuffer.slice(0, 20).toString('hex')
                });
                throw new Error(`Google STT API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;
            
            console.log('🔍 Google STT Raw Response:', JSON.stringify(data, null, 2));
            
            let resultText = '';
            if (data.results && data.results.length > 0) {
                resultText = data.results[0].alternatives[0].transcript || '';
            }
            
            console.log(`⚡ Google STT completed in ${duration}ms: "${resultText}"`);
            
            return {
                success: true,
                text: resultText,
                isPartial: !isFinal,
                timestamp: Date.now(),
                processingTime: duration,
                source: 'google-cloud-stt'
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Google STT failed after ${duration}ms:`, error.message);
            throw error;
        }
    }

    /**
     * Quick transcription for non-streaming use
     */
    async quickTranscription(audioBuffer, language = 'auto') {
        if (!this.isEnabled) {
            throw new Error('Google STT is disabled');
        }

        const startTime = Date.now();
        
        try {
            const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 48000,
                languageCode: language === 'auto' ? 'en-US' : language,
                model: 'default', // Use default supported model
                enableAutomaticPunctuation: true,
                enableWordTimeOffsets: false,
                enableWordConfidence: false
            };

            const request = {
                config: config,
                audio: {
                    content: processedAudioBuffer.toString('base64')
                }
            };

            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 Google STT Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText,
                    config: config,
                    audioSize: audioBuffer.length,
                    audioStart: audioBuffer.slice(0, 20).toString('hex')
                });
                throw new Error(`Google STT API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const duration = Date.now() - startTime;
            
            let transcription = '';
            if (data.results && data.results.length > 0) {
                transcription = data.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
            }

            console.log(`⚡ Google STT quick transcription: ${duration}ms`);

            return {
                success: true,
                text: transcription,
                isPartial: false,
                timestamp: Date.now(),
                processingTime: duration,
                source: 'google-cloud-stt'
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Google STT quick transcription failed after ${duration}ms:`, error.message);
            throw error;
        }
    }

    /**
     * Check if service is available
     */
    async healthCheck() {
        try {
            // Simple test request
            const testConfig = {
                encoding: 'LINEAR16',
                sampleRateHertz: 48000,
                languageCode: 'en-US',
                model: this.model
            };

            const request = {
                config: testConfig,
                audio: {
                    content: Buffer.alloc(1000).toString('base64') // Empty audio
                }
            };

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (response.ok) {
                return { success: true, service: 'google-cloud-stt' };
            } else {
                return { success: false, error: `HTTP ${response.status}`, service: 'google-cloud-stt' };
            }
        } catch (error) {
            return { success: false, error: error.message, service: 'google-cloud-stt' };
        }
    }
}

module.exports = GoogleSTTService;
