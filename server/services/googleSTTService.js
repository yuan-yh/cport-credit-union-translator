const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GoogleSTTService {
    constructor() {
        this.isEnabled = process.env.GOOGLE_STT_ENABLED === 'true';
        this.model = process.env.GOOGLE_STT_MODEL || 'latest_long';
        this.languageCode = process.env.GOOGLE_STT_LANGUAGE || 'auto';
        this.apiKey = process.env.GOOGLE_STT_API_KEY;
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
            
            // Add timeout for ffmpeg conversion (5 seconds)
            const timeout = setTimeout(() => {
                try {
                    ffmpeg.kill('SIGTERM');
                } catch (e) {}
                try {
                    fs.unlinkSync(tempInputPath);
                } catch (e) {}
                try {
                    fs.unlinkSync(tempOutputPath);
                } catch (e) {}
                reject(new Error('ffmpeg conversion timed out after 5 seconds'));
            }, 5000);
            
            // Convert using ffmpeg
            const ffmpeg = spawn('ffmpeg', [
                '-i', tempInputPath,
                '-ar', '16000', // Sample rate
                '-ac', '1',     // Mono
                '-f', 'wav',     // Output format
                tempOutputPath
            ]);
            
            ffmpeg.on('close', (code) => {
                clearTimeout(timeout);
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
                clearTimeout(timeout);
                // Check if ffmpeg is not found
                if (err.code === 'ENOENT') {
                    reject(new Error('ffmpeg is not installed. Please install it: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)'));
                } else {
                    reject(err);
                }
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
                if (conversionError.message.includes('ffmpeg is not installed')) {
                    console.error('❌ ffmpeg is required for Google STT. Install it with: brew install ffmpeg');
                    throw conversionError;
                }
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
            
            // Add timeout to prevent hanging (10 seconds for Cloud Run)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            let response;
            try {
                response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Google STT API request timed out after 10 seconds');
                }
                throw fetchError;
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorDetails;
                try {
                    errorDetails = JSON.parse(errorText);
                } catch (e) {
                    errorDetails = errorText;
                }
                
                console.error('🔍 Google STT Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorDetails,
                    apiKeyPresent: !!this.apiKey,
                    apiKeyLength: this.apiKey ? this.apiKey.length : 0,
                    config: config,
                    audioSize: processedAudioBuffer.length
                });
                
                // Provide helpful error messages
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Google STT API authentication failed. Check your API key. Status: ${response.status}`);
                } else if (response.status === 400) {
                    throw new Error(`Google STT API bad request: ${JSON.stringify(errorDetails)}`);
                } else {
                    throw new Error(`Google STT API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
                }
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
            // Convert WebM to WAV if needed
            let processedAudioBuffer = audioBuffer;
            try {
                processedAudioBuffer = await this.convertWebMToWav(audioBuffer);
            } catch (conversionError) {
                if (conversionError.message.includes('ffmpeg is not installed')) {
                    console.error('❌ ffmpeg is required for Google STT. Install it with: brew install ffmpeg');
                    throw conversionError;
                }
                console.log('⚠️ WebM conversion failed, using original buffer:', conversionError.message);
            }

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

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorDetails;
                try {
                    errorDetails = JSON.parse(errorText);
                } catch (e) {
                    errorDetails = errorText;
                }
                
                console.error('🔍 Google STT Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorDetails,
                    apiKeyPresent: !!this.apiKey,
                    apiKeyLength: this.apiKey ? this.apiKey.length : 0
                });
                
                // Provide helpful error messages
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Google STT API authentication failed. Check your API key. Status: ${response.status}`);
                } else if (response.status === 400) {
                    throw new Error(`Google STT API bad request: ${JSON.stringify(errorDetails)}`);
                } else {
                    throw new Error(`Google STT API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
                }
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
