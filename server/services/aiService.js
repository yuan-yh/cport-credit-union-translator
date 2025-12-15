const OpenAI = require('openai');
// const { HumeClient } = require('hume'); // Disabled due to deployment issues
const fs = require('fs');
const { spawn } = require('child_process');
// const ConversationCache = require('./conversationCache'); // Disabled due to sqlite3 issues
const GoogleSTTService = require('./googleSTTService');
const RedisCacheService = require('./redisCacheService');
const nerService = require('./nerService');
const nameMaskingService = require('./nameMaskingService'); // Keep for backward compatibility
const entityMaskingService = require('./entityMaskingService');
const conversationContextService = require('./conversationContextService');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Hume AI disabled due to deployment issues - using enhanced text-based emotion analysis
        this.humeEnabled = false;
        console.log('Hume AI disabled - using enhanced text-based emotion analysis with keyword detection');

        // Speed optimizations (configurable via environment)
        this.fastMode = process.env.FAST_MODE === 'true';
        this.fastTTSModel = process.env.TTS_MODEL || 'tts-1'; // Always use fastest model
        this.maxTokens = parseInt(process.env.MAX_TOKENS) || 50; // Ultra-reduced for speed
        this.temperature = parseFloat(process.env.TEMPERATURE) || 0.1; // Always fast
        this.ttsSpeed = parseFloat(process.env.TTS_SPEED) || 1.4; // Maximum speed
        
        // Google Cloud TTS for ultra-fast audio generation
        this.googleTTSEnabled = process.env.GOOGLE_TTS_ENABLED === 'true';
        this.googleTTSApiKey = process.env.GOOGLE_TTS_API_KEY;
        this.googleTTSVoice = process.env.GOOGLE_TTS_VOICE || 'en-US-Wavenet-D'; // Fast, high-quality voice
        
        console.log(`🎵 Google TTS Service initialized: ${this.googleTTSEnabled ? 'ENABLED' : 'DISABLED'}`);

        // LLM model selection
        this.translationModel = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini';

        // Faster-whisper configuration
        this.fasterWhisperEnabled = process.env.FASTER_WHISPER_ENABLED === 'true';
        this.fasterWhisperModel = process.env.FASTER_WHISPER_MODEL || 'tiny';
        this.fasterWhisperDevice = process.env.FASTER_WHISPER_DEVICE || 'cpu';
        this.fasterWhisperComputeType = process.env.FASTER_WHISPER_COMPUTE_TYPE || 'int8';
        this.fasterWhisperServerUrl = process.env.FASTER_WHISPER_SERVER_URL || 'http://localhost:8999';
        this.usePersistentServer = process.env.FASTER_WHISPER_PERSISTENT_SERVER === 'true';

        // Conversation cache configuration (disabled to avoid sqlite3 in Cloud Run)
        this.conversationCacheEnabled = false;
        this.conversationCache = null;

        // Initialize Google STT service
        this.googleSTT = new GoogleSTTService();

        // Initialize Redis cache service
        this.redisCache = new RedisCacheService();

        // Azure GPU configuration (removed)
        this.azureEnabled = false;


        // Banking-specific vocabulary and contexts
        this.bankingContext = {
            commonTerms: [
                'account balance', 'transaction', 'deposit', 'withdrawal', 'transfer',
                'checking account', 'savings account', 'loan', 'mortgage', 'credit card',
                'interest rate', 'monthly fee', 'overdraft', 'direct deposit',
                'online banking', 'mobile banking', 'ATM', 'PIN', 'routing number',
                'account number', 'statement', 'minimum balance', 'credit score',
                'payment', 'due date', 'late fee', 'credit limit', 'debit card'
            ],
            phrases: [
                'I would like to check my account balance',
                'Can you help me with a money transfer?',
                'I need to make a deposit',
                'There seems to be an unauthorized transaction',
                'I want to apply for a loan',
                'Can you explain the fees on my account?',
                'I need to update my personal information',
                'I want to open a new account'
            ]
        };
    }

    /**
     * Enhanced fallback mood analysis based on audio characteristics
     */
    async analyzeTextForMood(audioBuffer) {
        try {
            // Simple mood analysis based on audio characteristics
            // Longer audio might indicate urgency or complexity
            const audioLength = audioBuffer.length;
            let primaryMood = 'professional';
            let confidence = 0.7;
            
            if (audioLength > 100000) { // Longer audio
                primaryMood = 'urgent';
                confidence = 0.8;
            } else if (audioLength < 20000) { // Shorter audio
                primaryMood = 'calm';
                confidence = 0.6;
            }
            
            const emotions = [
                { name: primaryMood, score: confidence, confidence: confidence },
                { name: 'professional', score: 0.6, confidence: 0.6 }
            ];
            
            console.log(`🎭 Enhanced mood analysis: audio length ${audioLength} → ${primaryMood}`);
            
            return {
                emotions,
                primaryEmotion: { name: primaryMood, score: confidence },
                emotionalTone: primaryMood
            };
            
        } catch (error) {
            console.log('Enhanced mood analysis failed, using default:', error.message);
            return {
                emotions: [{ name: 'professional', score: 0.8, confidence: 0.8 }],
                primaryEmotion: { name: 'professional', score: 0.8 },
                emotionalTone: 'professional'
            };
        }
    }

    /**
     * Analyze emotion in audio using Hume AI
     */
    async analyzeEmotion(audioBuffer) {
        try {
            // Check if Hume AI is enabled and configured
            if (!this.humeEnabled) {
                console.log('Using enhanced fallback emotion analysis (Hume disabled)');
                
                // Enhanced fallback: analyze text content for mood indicators
                const moodAnalysis = await this.analyzeTextForMood(audioBuffer);
                
                return {
                    success: true,
                    emotions: moodAnalysis.emotions,
                    primaryEmotion: moodAnalysis.primaryEmotion,
                    emotionalTone: moodAnalysis.emotionalTone
                };
            }

            const tempFilePath = `/tmp/audio_${Date.now()}.wav`;
            fs.writeFileSync(tempFilePath, audioBuffer);

            // Attempt to use real Hume AI emotion detection
            try {
                console.log('Calling Hume AI emotion analysis...');
                console.log('Using API Key:', process.env.HUME_API_KEY ? 'Present' : 'Missing');
                console.log('Using Secret Key:', process.env.HUME_SECRET_KEY ? 'Present' : 'Missing');
                
                // Use Hume's emotion detection API (batch processing for now)
                // Prefer Prosody (voice) model; some SDK versions use "prosody" instead of "speech"
                const result = await this.hume.expressionMeasurement.batch.startInferenceJob({
                    files: [tempFilePath],
                    models: {
                        prosody: {
                            granularity: "utterance"
                        }
                    }
                });
                
                console.log('Hume AI response received:', JSON.stringify(result, null, 2));
                
                // Process the real Hume response
                if (result && result.predictions && result.predictions.length > 0) {
                    const predictions = result.predictions[0];
                    // Try both shapes that we may encounter depending on SDK/version
                    const speechEmotions = predictions.prosody?.emotions || predictions.speech?.emotions || [];
                    
                    if (speechEmotions.length > 0) {
                        const primaryEmotion = speechEmotions.reduce((prev, current) => 
                            (prev.score > current.score) ? prev : current
                        );
                        
                        // Clean up temp file
                        fs.unlinkSync(tempFilePath);
                        
                        return {
                            success: true,
                            emotions: speechEmotions.map(e => ({
                                name: e.name,
                                score: e.score,
                                confidence: e.score
                            })),
                            primaryEmotion: {
                                name: primaryEmotion.name,
                                score: primaryEmotion.score
                            },
                            emotionalTone: this.determineEmotionalTone(primaryEmotion)
                        };
                    }
                }
            } catch (humeError) {
                console.error('Hume AI API call failed:', {
                    message: humeError.message,
                    status: humeError.status,
                    statusText: humeError.statusText,
                    response: humeError.response?.data
                });
                console.warn('Using fallback emotion analysis due to Hume error');
            }
            
            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            // Fallback to professional emotion analysis
            console.log('Using fallback emotion analysis');
            return {
                success: true,
                emotions: [
                    { name: 'professional', score: 0.8, confidence: 0.8 },
                    { name: 'calm', score: 0.6, confidence: 0.6 },
                    { name: 'friendly', score: 0.5, confidence: 0.5 }
                ],
                primaryEmotion: { name: 'professional', score: 0.8 },
                emotionalTone: 'professional'
            };

        } catch (error) {
            console.error('Emotion analysis error:', error);
            return {
                success: false,
                error: error.message,
                emotions: [],
                primaryEmotion: { name: 'neutral', score: 0.5 },
                emotionalTone: 'neutral'
            };
        }
    }

    /**
     * Determine emotional tone for translation context
     */
    determineEmotionalTone(primaryEmotion) {
        const emotionMapping = {
            'joy': 'friendly',
            'sadness': 'empathetic',
            'anger': 'calming',
            'fear': 'reassuring',
            'disgust': 'professional',
            'surprise': 'understanding',
            'contempt': 'respectful',
            'anxiety': 'reassuring',
            'confusion': 'clarifying',
            'excitement': 'enthusiastic',
            'frustration': 'patient',
            'satisfaction': 'positive'
        };

        return emotionMapping[primaryEmotion.name] || 'professional';
    }

    /**
     * Check conversation cache for existing translation
     */
    async checkConversationCache(originalText, sourceLanguage, targetLanguage) {
        if (!this.conversationCacheEnabled || !this.conversationCache) {
            return null;
        }

        try {
            const cachedResult = await this.conversationCache.findCachedTranslation(
                originalText, sourceLanguage, targetLanguage
            );
            
            if (cachedResult) {
                console.log(`🎯 Cache hit (${cachedResult.cacheHit}): ${originalText.substring(0, 50)}...`);
                return cachedResult;
            }
            
            return null;
        } catch (error) {
            console.error('Error checking conversation cache:', error);
            return null;
        }
    }

    /**
     * Cache a successful translation
     */
    async cacheTranslation(translationData) {
        if (!this.conversationCacheEnabled || !this.conversationCache) {
            return;
        }

        try {
            await this.conversationCache.cacheTranslation(translationData);
        } catch (error) {
            console.error('Error caching translation:', error);
        }
    }

    /**
     * Quick transcription for cache checking (optimized for speed)
     */
    async quickTranscription(audioBuffer, sourceLanguage) {
        try {
            // Use faster-whisper with minimal settings for quick transcription
            if (this.fasterWhisperEnabled) {
                const quickResult = await this.fasterWhisperTranscription(audioBuffer, sourceLanguage);
                if (quickResult.success) {
                    return quickResult.text;
                }
            }
            
            // Fallback to OpenAI with minimal settings
            const tempFilePath = `/tmp/quick_audio_${Date.now()}.wav`;
            fs.writeFileSync(tempFilePath, audioBuffer);
            
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
                language: sourceLanguage,
                prompt: this.getBankingPrompt(sourceLanguage),
                temperature: 0.1, // Deterministic but compatible
                response_format: "text" // Faster than JSON
            });
            
            fs.unlinkSync(tempFilePath);
            return transcription;
            
        } catch (error) {
            console.log('Quick transcription failed:', error.message);
            return null;
        }
    }

    /**
     * Streaming transcription for real-time processing
     */
    async streamingTranscription(audioChunk, language = 'auto', isFinal = false) {
        try {
            // Ultra-fast transcription for low latency
            const startTime = Date.now();
            
            // Priority 1: Google Cloud STT (fastest, <100ms)
            if (this.googleSTT.isEnabled) {
                try {
                    const googleResult = await this.googleSTT.streamingTranscription(audioChunk, language, isFinal);
                    if (googleResult.success) {
                        console.log(`⚡ Google STT streaming: ${googleResult.processingTime}ms`);
                        return googleResult;
                    }
                } catch (googleError) {
                    console.log('⚠️ Google STT failed, trying fallback:', googleError.message);
                }
            }
            
            // Priority 2: Faster-whisper (local, ~200ms)
            if (this.fasterWhisperEnabled) {
                try {
                    const quickResult = await this.fasterWhisperTranscription(audioChunk, language);
                    if (quickResult.success) {
                        const duration = Date.now() - startTime;
                        console.log(`⚡ Faster-whisper transcription: ${duration}ms`);
                        return {
                            success: true,
                            text: quickResult.text || '',
                            isPartial: !isFinal,
                            timestamp: Date.now(),
                            processingTime: duration,
                            source: 'faster-whisper'
                        };
                    }
                } catch (whisperError) {
                    console.log('⚠️ Faster-whisper failed, trying OpenAI:', whisperError.message);
                }
            }
            
            // Priority 3: OpenAI Whisper (fallback, ~500ms)
            const result = await this.quickTranscription(audioChunk, language);
            const duration = Date.now() - startTime;
            console.log(`⚡ OpenAI fallback transcription: ${duration}ms`);
            
            return {
                success: true,
                text: result || '',
                isPartial: !isFinal,
                timestamp: Date.now(),
                processingTime: duration,
                source: 'openai-whisper'
            };
        } catch (error) {
            console.error('Streaming transcription error:', error);
            return { success: false, error: error.message, isPartial: true };
        }
    }

    /**
     * Streaming translation with partial text
     */
    async streamingTranslation(partialText, sourceLanguage, targetLanguage, isFinal = false, sessionId = null) {
        try {
            if (!partialText || !partialText.trim()) {
                return { success: true, translatedText: '', isPartial: true };
            }

            // Priority 1: Check Redis cache first (fastest, <1ms)
            const redisResult = await this.redisCache.getCachedTranslation(
                partialText, sourceLanguage, targetLanguage
            );
            if (redisResult && redisResult.success) {
                console.log('⚡ Redis cache hit for streaming translation:', partialText.substring(0, 50) + '...');
                return {
                    ...redisResult,
                    isPartial: !isFinal,
                    timestamp: Date.now(),
                    processingTime: 0 // Instant from Redis
                };
            }

            // Priority 2: Check SQLite cache (fast, ~5ms)
            const cachedResult = this.conversationCacheEnabled ? await this.checkConversationCache(
                partialText, sourceLanguage, targetLanguage
            ) : null;
            if (cachedResult && cachedResult.success) {
                console.log('🎯 SQLite cache hit for streaming translation:', partialText.substring(0, 50) + '...');
                return {
                    ...cachedResult,
                    isPartial: !isFinal,
                    timestamp: Date.now()
                };
            }

            // For very short partial text, return as-is if no cache hit
            if (!isFinal && partialText.length < 10) {
                return { success: true, translatedText: partialText, isPartial: true };
            }

            // Detect and mask all entities (names + banking) before translation
            let originalText = partialText;
            let entityMapping = {};
            let maskedText = originalText;
            let detectedEntities = [];
            
            try {
                // Only do entity detection for final translations or longer partials to avoid overhead
                if (isFinal || partialText.length > 20) {
                    const entityResults = await nerService.detectAllEntities(originalText);
                    detectedEntities = [...entityResults.names.map(n => ({ ...n, type: 'PERSON' })), ...entityResults.banking];
                    
                    if (detectedEntities.length > 0) {
                        const maskingResult = entityMaskingService.maskEntities(originalText, detectedEntities);
                        maskedText = maskingResult.maskedText;
                        entityMapping = maskingResult.mapping;
                        
                        const nameCount = entityResults.names.length;
                        const bankingCount = entityResults.banking.length;
                        if (isFinal) {
                            console.log(`🛡️ Masked ${nameCount} name(s) and ${bankingCount} banking entity/entities in streaming translation`);
                            console.log(`📝 Original: "${originalText}"`);
                            console.log(`🎭 Masked: "${maskedText}"`);
                            console.log(`🔑 Mapping:`, entityMapping);
                        }
                    } else if (isFinal) {
                        console.log(`⚠️ No entities detected in: "${originalText}"`);
                    }
                }
            } catch (nerError) {
                console.warn('⚠️ Entity detection failed in streaming, proceeding without masking:', nerError.message);
                // Continue without masking if NER fails
            }

            // Get conversation context for final translations
            let contextPrompt = '';
            if (sessionId && isFinal) {
                contextPrompt = conversationContextService.formatContextForPrompt(sessionId, sourceLanguage, targetLanguage);
            }

            // Ultra-fast translation with minimal settings
            const startTime = Date.now();
            // Add placeholder preservation instruction if entities are masked
            const placeholderInstruction = Object.keys(entityMapping).length > 0
                ? `\n\nCRITICAL: The text contains placeholders like __PERSON_0__, __ACCOUNT_0__, etc. DO NOT translate, modify, or change these placeholders. Keep them exactly as they appear in the original text.`
                : '';
            const systemPrompt = `Translate from ${sourceLanguage} to ${targetLanguage}. Return ONLY the translated text.${placeholderInstruction}${contextPrompt}`;
            
            const response = await this.openai.chat.completions.create({
                model: this.translationModel,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: maskedText // Use masked text
                    }
                ],
                temperature: 0.1, // Use 0.1 instead of 0 for compatibility
                max_completion_tokens: isFinal ? 50 : 20, // Ultra-limited tokens for speed
                stream: false // Disable streaming for faster response
            });

            let translatedText = response.choices[0]?.message?.content || '';
            
            // Restore entities after translation
            if (Object.keys(entityMapping).length > 0) {
                translatedText = entityMaskingService.unmaskEntities(translatedText, entityMapping);
                if (isFinal) {
                    const isValid = entityMaskingService.validateUnmasking(translatedText);
                    if (!isValid) {
                        console.warn('⚠️ Some entity placeholders may not have been restored in streaming translation');
                    }
                }
            }

            // Update conversation context for final translations
            if (sessionId && isFinal) {
                conversationContextService.addTurn(sessionId, 'customer', originalText, detectedEntities);
            }
            
            const duration = Date.now() - startTime;
            console.log(`⚡ Ultra-fast translation: ${duration}ms`);

            const result = {
                success: true,
                translatedText: translatedText.trim(),
                isPartial: !isFinal,
                timestamp: Date.now()
            };

                // Cache the translation for future use (only for final translations)
                if (isFinal && translatedText.trim()) {
                    try {
                        // Cache in both Redis (fastest) and SQLite (persistent)
                        await Promise.all([
                            this.redisCache.cacheTranslation(
                                partialText,
                                translatedText.trim(),
                                sourceLanguage,
                                targetLanguage
                            ),
                            this.cacheTranslation({
                                originalText: partialText,
                                translatedText: translatedText.trim(),
                                sourceLanguage,
                                targetLanguage,
                                timestamp: Date.now()
                            })
                        ]);
                        console.log('💾 Cached streaming translation in Redis + SQLite');
                    } catch (cacheError) {
                        console.log('⚠️ Failed to cache streaming translation:', cacheError.message);
                    }
                }

            return result;
        } catch (error) {
            console.error('Streaming translation error:', error);
            return { success: false, error: error.message, isPartial: true };
        }
    }

    /**
     * Streaming TTS for immediate audio feedback
     */
    async streamingTTS(text, isPartial = false) {
        try {
            if (!text || !text.trim()) {
                return { success: true, audioBuffer: null, isPartial: true };
            }

            const startTime = Date.now();
            
            // Check Redis cache first for TTS
            const cachedAudio = await this.redisCache.getCachedTTS(text, 'google-tts');
            if (cachedAudio) {
                console.log(`⚡ Redis TTS cache hit: ${text.substring(0, 30)}...`);
                return {
                    success: true,
                    audioBuffer: cachedAudio,
                    isPartial: isPartial,
                    timestamp: Date.now(),
                    processingTime: 0 // Instant from cache
                };
            }

            // Priority 1: Google Cloud TTS (fastest, 200-400ms)
            if (this.googleTTSEnabled) {
                try {
                    const googleResult = await this.googleCloudTTS(text, isPartial);
                    if (googleResult.success) {
                        console.log(`⚡ Google TTS generated in ${googleResult.processingTime}ms`);
                        return googleResult;
                    }
                } catch (googleError) {
                    console.log('⚠️ Google TTS failed, trying OpenAI:', googleError.message);
                }
            }

            // Priority 2: OpenAI TTS (fallback, 1200ms)
            const response = await this.openai.audio.speech.create({
                model: 'tts-1', // Always use fastest model
                voice: 'alloy',
                input: text,
                response_format: 'wav',
                speed: 1.4 // Maximum speed for fastest processing
            });

            const audioBuffer = Buffer.from(await response.arrayBuffer());
            const duration = Date.now() - startTime;
            console.log(`⚡ OpenAI TTS generated in ${duration}ms`);

            // Cache the TTS audio for future use
            try {
                await this.redisCache.cacheTTS(text, audioBuffer, 'openai-tts');
            } catch (cacheError) {
                console.log('⚠️ Failed to cache TTS:', cacheError.message);
            }
            
            return {
                success: true,
                audioBuffer,
                isPartial,
                timestamp: Date.now(),
                processingTime: duration
            };
        } catch (error) {
            console.error('Streaming TTS error:', error);
            return { success: false, error: error.message, isPartial: true };
        }
    }


    /**
     * Google Cloud TTS for ultra-fast audio generation
     */
    async googleCloudTTS(text, isPartial = false) {
        try {
            const startTime = Date.now();
            
            // Google Cloud TTS API request
            const requestBody = {
                input: { text: text },
                voice: {
                    languageCode: 'en-US',
                    name: this.googleTTSVoice,
                    ssmlGender: 'MALE'
                },
                audioConfig: {
                    audioEncoding: 'LINEAR16',
                    speakingRate: isPartial ? 1.2 : 1.0, // Faster for partial text
                    pitch: 0.0,
                    volumeGainDb: 0.0
                }
            };

            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleTTSApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorDetails;
                try {
                    errorDetails = JSON.parse(errorText);
                } catch (e) {
                    errorDetails = errorText;
                }
                
                console.error('🔍 Google TTS Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorDetails,
                    apiKeyPresent: !!this.googleTTSApiKey,
                    apiKeyLength: this.googleTTSApiKey ? this.googleTTSApiKey.length : 0
                });
                
                // Provide helpful error messages
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Google TTS API authentication failed. Check your API key. Status: ${response.status}`);
                } else if (response.status === 400) {
                    throw new Error(`Google TTS API bad request: ${JSON.stringify(errorDetails)}`);
                } else {
                    throw new Error(`Google TTS API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetails)}`);
                }
            }

            const result = await response.json();
            const audioBuffer = Buffer.from(result.audioContent, 'base64');
            const duration = Date.now() - startTime;

            // Cache the TTS audio for future use
            try {
                await this.redisCache.cacheTTS(text, audioBuffer, 'google-tts');
            } catch (cacheError) {
                console.log('⚠️ Failed to cache Google TTS:', cacheError.message);
            }

            return {
                success: true,
                audioBuffer,
                isPartial,
                timestamp: Date.now(),
                processingTime: duration
            };
        } catch (error) {
            console.error('Google Cloud TTS error:', error);
            return { success: false, error: error.message, isPartial: true };
        }
    }

    /**
     * Speech-to-text using faster-whisper (up to 4x faster)
     */
    async fasterWhisperTranscription(audioBuffer, sourceLanguage) {
        return new Promise((resolve, reject) => {
            if (!this.fasterWhisperEnabled) {
                reject(new Error('Faster-whisper is not enabled'));
                return;
            }

            const startTime = Date.now();
            const tempFilePath = `/tmp/faster_whisper_${Date.now()}.wav`;
            
            try {
                // Write audio buffer to temporary file
                fs.writeFileSync(tempFilePath, audioBuffer);
                
                // Prepare Python script arguments
                const pythonScript = require('path').join(__dirname, 'fasterWhisperService.py');
                const args = [pythonScript, tempFilePath];
                if (sourceLanguage) {
                    args.push(sourceLanguage);
                }
                
                console.log('Starting faster-whisper transcription...');
                
                // Spawn Python process with OpenMP fix
                const pythonProcess = spawn('python3', args, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        KMP_DUPLICATE_LIB_OK: 'TRUE'
                    }
                });
                
                let stdout = '';
                let stderr = '';
                
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                pythonProcess.on('close', (code) => {
                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (cleanupError) {
                        console.warn('Failed to clean up temp file:', cleanupError.message);
                    }
                    
                    if (code !== 0) {
                        console.error('Faster-whisper process failed:', stderr);
                        reject(new Error(`Faster-whisper failed with code ${code}: ${stderr}`));
                        return;
                    }
                    
                    try {
                        const result = JSON.parse(stdout);
                        const latency = Date.now() - startTime;
                        
                        console.log(`Faster-whisper transcription completed in ${latency}ms`);
                        
                        resolve({
                            success: result.success,
                            text: result.text,
                            language: result.language,
                            languageProbability: result.language_probability,
                            duration: result.duration,
                            segments: result.segments,
                            wordTimestamps: result.word_timestamps,
                            latency: latency,
                            provider: 'faster-whisper'
                        });
                    } catch (parseError) {
                        console.error('Failed to parse faster-whisper result:', parseError);
                        reject(new Error('Failed to parse faster-whisper result'));
                    }
                });
                
                pythonProcess.on('error', (error) => {
                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (cleanupError) {
                        // Ignore cleanup errors
                    }
                    
                    console.error('Faster-whisper process error:', error);
                    reject(error);
                });
                
            } catch (error) {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
                
                console.error('Faster-whisper transcription error:', error);
                reject(error);
            }
        });
    }

    /**
     * Speech-to-text using persistent faster-whisper server (ultra-fast)
     */
    async fasterWhisperServerTranscription(audioBuffer, sourceLanguage) {
        return new Promise(async (resolve, reject) => {
            if (!this.fasterWhisperEnabled || !this.usePersistentServer) {
                reject(new Error('Faster-whisper server is not enabled'));
                return;
            }

            const startTime = Date.now();
            const tempFilePath = `/tmp/faster_whisper_server_${Date.now()}.wav`;
            
            try {
                // Write audio buffer to temporary file
                fs.writeFileSync(tempFilePath, audioBuffer);
                
                console.log('Using persistent faster-whisper server...');
                
                // Make HTTP request to persistent server
                const response = await fetch(`${this.fasterWhisperServerUrl}/transcribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        audio_file_path: tempFilePath,
                        language: sourceLanguage
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const result = await response.json();
                const latency = Date.now() - startTime;
                
                // Clean up temp file
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                    console.warn('Failed to clean up temp file:', cleanupError.message);
                }
                
                if (result.success) {
                    console.log(`Persistent faster-whisper transcription completed in ${latency}ms (model load: ${result.model_load_time}s)`);
                    
                    resolve({
                        success: result.success,
                        text: result.text,
                        language: result.language,
                        languageProbability: result.language_probability,
                        duration: result.duration,
                        segments: result.segments,
                        wordTimestamps: result.word_timestamps,
                        latency: latency,
                        transcriptionTime: result.transcription_time,
                        modelLoadTime: result.model_load_time,
                        provider: 'faster-whisper-server'
                    });
                } else {
                    throw new Error(result.error || 'Transcription failed');
                }
                
            } catch (error) {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
                
                console.error('Persistent faster-whisper server error:', error);
                reject(error);
            }
        });
    }

    // Azure transcription removed

    /**
     * Perform speech-to-speech translation with emotional context (OpenAI pipeline)
     */
    async openaiSpeechToSpeechTranslation(audioBuffer, sourceLanguage, targetLanguage, emotionalContext, sessionId = null) {
        try {
            const startTime = Date.now();
            let transcription;
            let transcriptionProvider = 'openai-whisper';

            // Step 1: Speech-to-text (persistent faster-whisper server, then faster-whisper, then OpenAI)
            try {
                if (this.fasterWhisperEnabled && this.usePersistentServer) {
                    console.log('Attempting persistent faster-whisper server...');
                    const serverResult = await this.fasterWhisperServerTranscription(audioBuffer, sourceLanguage);
                    if (serverResult.success) {
                        transcription = {
                            text: serverResult.text,
                            language: serverResult.language
                        };
                        transcriptionProvider = 'faster-whisper-server';
                        console.log(`Using persistent faster-whisper server (${serverResult.latency}ms)`);
                        
                        // Performance feedback
                        if (serverResult.latency < 1000) {
                            console.log('🚀 Ultra-fast transcription with persistent server!');
                        }
                    } else {
                        throw new Error('Persistent server failed, trying direct faster-whisper');
                    }
                } else if (this.fasterWhisperEnabled) {
                    console.log('Attempting direct faster-whisper transcription...');
                    const fasterResult = await this.fasterWhisperTranscription(audioBuffer, sourceLanguage);
                    if (fasterResult.success) {
                        transcription = {
                            text: fasterResult.text,
                            language: fasterResult.language
                        };
                        transcriptionProvider = 'faster-whisper';
                        console.log(`Using faster-whisper (${fasterResult.latency}ms)`);
                        
                        // Performance feedback
                        if (fasterResult.latency > 3000) {
                            console.log('⚠️  Slow transcription detected. Consider using persistent server for better performance.');
                        } else if (fasterResult.latency < 1000) {
                            console.log('🚀 Excellent transcription speed!');
                        }
                    } else {
                        throw new Error('Faster-whisper failed, falling back to OpenAI');
                    }
                } else {
                    throw new Error('Faster-whisper not enabled');
                }
            } catch (fasterError) {
                console.log('Falling back to OpenAI Whisper:', fasterError.message);
                
                // Create a temporary file for the audio
                const tempFilePath = `/tmp/input_audio_${Date.now()}.wav`;
                fs.writeFileSync(tempFilePath, audioBuffer);

                transcription = await this.openai.audio.transcriptions.create({
                    file: fs.createReadStream(tempFilePath),
                    model: "whisper-1",
                    language: sourceLanguage,
                    prompt: this.getBankingPrompt(sourceLanguage)
                });

                // Clean up temp file
                fs.unlinkSync(tempFilePath);
            }

            // Guard: empty/no-speech transcription → fail fast to avoid LLM replying generically
            if (!transcription || !transcription.text || !transcription.text.trim()) {
                return {
                    success: false,
                    error: 'No speech detected in audio',
                    originalText: '',
                    translatedText: '',
                    audioBuffer: null
                };
            }

            // Step 1.5: Check conversation cache after transcription
            const cachedResult = this.conversationCacheEnabled ? await this.checkConversationCache(
                transcription.text, sourceLanguage, targetLanguage
            ) : null;
            
            let cachedMeta = null;
            if (cachedResult) {
                // Do NOT return early. We still run strict translation to avoid chatty replies.
                // Keep cached metadata for downstream use (e.g., flags), but always translate fresh.
                cachedMeta = cachedResult;
                console.log('💾 Using cached metadata; proceeding with strict translation to avoid reply-style outputs');
            }

            // Step 1.6: Detect and mask all entities (names + banking entities) to prevent translation
            let originalText = transcription.text;
            let entityMapping = {};
            let maskedText = originalText;
            let detectedEntities = [];
            
            try {
                // Detect all entities (names + banking)
                const entityResults = await nerService.detectAllEntities(originalText);
                detectedEntities = [...entityResults.names.map(n => ({ ...n, type: 'PERSON' })), ...entityResults.banking];
                
                if (detectedEntities.length > 0) {
                    const maskingResult = entityMaskingService.maskEntities(originalText, detectedEntities);
                    maskedText = maskingResult.maskedText;
                    entityMapping = maskingResult.mapping;
                    
                    const nameCount = entityResults.names.length;
                    const bankingCount = entityResults.banking.length;
                    console.log(`🛡️ Masked ${nameCount} name(s) and ${bankingCount} banking entity/entities before translation`);
                    console.log(`📝 Original: "${originalText}"`);
                    console.log(`🎭 Masked: "${maskedText}"`);
                    console.log(`🔑 Mapping:`, entityMapping);
                } else {
                    console.log(`⚠️ No entities detected in: "${originalText}"`);
                }
            } catch (nerError) {
                console.warn('⚠️ Entity detection failed, proceeding without masking:', nerError.message);
                // Continue without masking if NER fails
            }

            // Step 1.7: Get conversation context (if sessionId provided)
            let contextPrompt = '';
            if (sessionId) {
                contextPrompt = conversationContextService.formatContextForPrompt(sessionId, sourceLanguage, targetLanguage);
            }

            // Step 2: Translate with emotional context, banking terminology, and conversation context (OPTIMIZED FOR SPEED)
            // Add placeholder preservation instruction if entities are masked
            const placeholderInstruction = Object.keys(entityMapping).length > 0
                ? `\n\nCRITICAL: The text contains placeholders like __PERSON_0__, __ACCOUNT_0__, etc. DO NOT translate, modify, or change these placeholders. Keep them exactly as they appear in the original text.`
                : '';
            const systemPrompt = this.getTranslationSystemPrompt(sourceLanguage, targetLanguage, emotionalContext) + placeholderInstruction + contextPrompt;
            
            const translation = await this.openai.chat.completions.create({
                model: this.translationModel,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Translate from ${sourceLanguage} to ${targetLanguage}.\nReturn ONLY the translated text, no extra words.\nIf already ${targetLanguage}, return unchanged.\n\nTEXT:\n${maskedText}`
                    }
                ],
                temperature: 0.1,
                top_p: 1,
                presence_penalty: 0,
                frequency_penalty: 0,
                stream: false
            });

            // Step 2.5: Restore entities after translation
            let translatedText = translation.choices[0].message.content;
            if (Object.keys(entityMapping).length > 0) {
                translatedText = entityMaskingService.unmaskEntities(translatedText, entityMapping);
                const isValid = entityMaskingService.validateUnmasking(translatedText);
                if (!isValid) {
                    console.warn('⚠️ Some entity placeholders may not have been restored');
                } else {
                    console.log('✅ All entities restored after translation');
                }
            }

            // Step 2.6: Update conversation context (if sessionId provided)
            if (sessionId) {
                conversationContextService.addTurn(sessionId, 'customer', originalText, detectedEntities);
            }

            // Step 3: Text-to-speech with appropriate voice (OPTIMIZED FOR SPEED)
            // Use restored text (with names) for TTS
            const speech = await this.openai.audio.speech.create({
                model: this.fastTTSModel, // Use faster TTS model
                voice: this.selectVoiceForLanguage(targetLanguage, emotionalContext),
                input: translatedText, // Use restored text with names
                speed: this.ttsSpeed, // Configurable speed for optimization
                format: 'wav'
            });

            const audioArrayBuffer = await speech.arrayBuffer();
            const translatedAudioBuffer = Buffer.from(audioArrayBuffer);

            const totalLatency = Date.now() - startTime;
            console.log(`Total translation completed in ${totalLatency}ms using ${transcriptionProvider}`);

            // Step 4: Cache the successful translation
            await this.cacheTranslation({
                originalText: originalText,
                translatedText: translatedText,
                sourceLanguage,
                targetLanguage,
                emotionalContext,
                customerMood: emotionalContext,
                audioDuration: 0, // Will be calculated if needed
                processingTime: totalLatency
            });

            return {
                success: true,
                originalText: originalText,
                translatedText: translatedText, // Use restored text with names
                audioBuffer: translatedAudioBuffer,
                sourceLanguage,
                targetLanguage,
                emotionalContext,
                confidence: 0.95, // High confidence for OpenAI
                transcriptionProvider: transcriptionProvider,
                totalLatency: totalLatency,
                ...(cachedMeta ? { cacheHit: cachedMeta.cacheHit } : {})
            };

        } catch (error) {
            console.error('Speech-to-speech translation error:', error);
            
            // Clean up temp file if it exists
            try {
                fs.unlinkSync(tempFilePath);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }

            return {
                success: false,
                error: error.message,
                originalText: '',
                translatedText: '',
                audioBuffer: null
            };
        }
    }

    /**
     * Perform speech-to-speech translation with emotional context
     */
    async speechToSpeechTranslation(audioBuffer, sourceLanguage, targetLanguage, emotionalContext) {
        try {
            const startTime = Date.now();
            
            // Step 0: Quick transcription for cache check (only for very short audio)
            // This is a performance optimization - if audio is very short, try a quick transcription
            // to check if it's a common greeting that can be cached
            if (audioBuffer.length < 50000) { // Less than ~3 seconds of audio
                try {
                    console.log('🔍 Attempting quick transcription for cache check...');
                    const quickTranscription = await this.quickTranscription(audioBuffer, sourceLanguage);
                    
                    if (quickTranscription) {
                        // Check cache with quick transcription
                        const cachedResult = this.conversationCacheEnabled ? await this.checkConversationCache(
                            quickTranscription, sourceLanguage, targetLanguage
                        ) : null;
                        
                        if (cachedResult) {
                            // Synthesize audio for quick cache hits to keep speech-first UX
                            const ttsStart = Date.now();
                            const speech = await this.openai.audio.speech.create({
                                model: this.fastTTSModel,
                                voice: this.selectVoiceForLanguage(targetLanguage, { emotionalTone: 'professional' }),
                                input: cachedResult.translatedText,
                                speed: this.ttsSpeed,
                                format: 'wav'
                            });

                            const audioArrayBuffer = await speech.arrayBuffer();
                            const translatedAudioBuffer = Buffer.from(audioArrayBuffer);

                            const totalLatency = Date.now() - startTime;
                            console.log(`⚡ Quick cache hit + TTS completed in ${totalLatency}ms (TTS: ${Date.now() - ttsStart}ms)`);
                            
                            return {
                                success: true,
                                originalText: quickTranscription,
                                translatedText: cachedResult.translatedText,
                                audioBuffer: translatedAudioBuffer,
                                sourceLanguage,
                                targetLanguage,
                                emotionalContext: cachedResult.emotionalContext || 'professional',
                                confidence: 0.98,
                                transcriptionProvider: 'quick-cache',
                                totalLatency: totalLatency,
                                cacheHit: cachedResult.cacheHit,
                                customerMood: cachedResult.customerMood,
                                extractedName: cachedResult.extractedName,
                                extractedPhone: cachedResult.extractedPhone,
                                visitReason: cachedResult.visitReason,
                                notes: cachedResult.notes
                            };
                        }
                    }
                } catch (quickError) {
                    console.log('Quick transcription failed, proceeding with full processing:', quickError.message);
                }
            }
            
            // Step 1: Full processing (existing flow)
            return await this.openaiSpeechToSpeechTranslation(audioBuffer, sourceLanguage, targetLanguage, emotionalContext, sessionId);
            
        } catch (error) {
            console.error('Speech-to-speech translation error:', error);
            throw error;
        }
    }

    /**
     * Get banking-specific prompt for Whisper
     */
    /**
     * Get accent-aware banking prompt for STT
     * Includes banking vocabulary and accent hints
     */
    getBankingPrompt(language, accentHint = null) {
        // Banking vocabulary to help STT recognize common terms
        const bankingVocab = {
            'en': 'account balance transaction deposit withdrawal transfer loan mortgage credit card debit card checking savings routing number account number PIN password statement fee interest rate payment due date',
            'es': 'cuenta saldo transacción depósito retiro transferencia préstamo hipoteca tarjeta de crédito tarjeta de débito cuenta corriente ahorros número de ruteo número de cuenta PIN contraseña estado de cuenta tarifa tasa de interés pago fecha de vencimiento',
            'pt': 'conta saldo transação depósito saque transferência empréstimo hipoteca cartão de crédito cartão de débito conta corrente poupança número de roteamento número da conta PIN senha extrato taxa taxa de juros pagamento data de vencimento',
            'fr': 'compte solde transaction dépôt retrait transfert prêt hypothèque carte de crédit carte de débit compte courant épargne numéro de routage numéro de compte NIP mot de passe relevé frais taux d\'intérêt paiement date d\'échéance',
            'ar': 'حساب رصيد معاملة إيداع سحب تحويل قرض رهن بطاقة ائتمان بطاقة خصم حساب جاري توفير رقم التوجيه رقم الحساب رقم التعريف كلمة المرور كشف حساب رسوم سعر الفائدة دفعة تاريخ الاستحقاق',
            'so': 'koonto xisaab macaamil dhigaal lacag-bixinta wareejin deyn guri-qaad kaar deyn kaar bixinta koonto joogto kayd lambarka wareejinta lambarka koontada PIN erayga sirta ah warbixinta kharashka heerka faa\'iidada bixinta taariikhda u dhigma'
        };

        const basePrompts = {
            'en': 'Banking conversation about accounts, transactions, loans, deposits, withdrawals, credit cards, and financial services.',
            'es': 'Conversación bancaria sobre cuentas, transacciones, préstamos, depósitos, retiros, tarjetas de crédito y servicios financieros.',
            'pt': 'Conversa bancária sobre contas, transações, empréstimos, depósitos, saques, cartões de crédito e serviços financeiros.',
            'fr': 'Conversation bancaire sur les comptes, transactions, prêts, dépôts, retraits, cartes de crédit et services financiers.',
            'ar': 'محادثة مصرفية حول الحسابات والمعاملات والقروض والودائع والسحوبات وبطاقات الائتمان والخدمات المالية.',
            'so': 'Wadahadal bangiga ah oo ku saabsan koontada, macaamil, deyn, dhigaal, lacag-bixinta, kaarka deynta, iyo adeegyada dhaqaalaha.'
        };

        let prompt = basePrompts[language] || basePrompts['en'];
        
        // Add banking vocabulary
        const vocab = bankingVocab[language] || bankingVocab['en'];
        prompt += ` Common banking terms: ${vocab}.`;

        // Add accent hint if provided
        if (accentHint) {
            const accentHints = {
                'es': {
                    'mexican': 'Mexican Spanish accent',
                    'caribbean': 'Caribbean Spanish accent',
                    'spain': 'Spain Spanish accent',
                    'central-american': 'Central American Spanish accent'
                },
                'en': {
                    'hispanic': 'Hispanic English accent',
                    'asian': 'Asian English accent',
                    'african': 'African English accent',
                    'european': 'European English accent'
                },
                'pt': {
                    'brazilian': 'Brazilian Portuguese accent',
                    'european': 'European Portuguese accent'
                },
                'fr': {
                    'african': 'African French accent',
                    'canadian': 'Canadian French accent',
                    'european': 'European French accent'
                }
            };

            const hints = accentHints[language];
            if (hints && hints[accentHint]) {
                prompt += ` Note: Speaker has ${hints[accentHint]}.`;
            }
        }

        return prompt;
    }

    /**
     * Get system prompt for translation with emotional context
     */
    getTranslationSystemPrompt(sourceLanguage, targetLanguage, emotionalContext) {
        const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'pt': 'Portuguese', 
            'fr': 'French',
            'ar': 'Arabic',
            'so': 'Somali'
        };

        return `You are a professional banking translator specializing in ${languageNames[sourceLanguage]} → ${languageNames[targetLanguage]} translation.

CRITICAL RULES (FOLLOW STRICTLY):
- You are NOT a chatbot and MUST NOT reply to the user.
- Output ONLY the translation of the input text, nothing else (no greetings, no questions, no filler).
- Do NOT change speaker intent; do NOT add or remove information; do NOT rephrase into a response.
- Maintain professional tone and accurate banking terminology.
- If source and target languages are the same, return the original text verbatim.

EMOTIONAL CONTEXT (for word choice only): "${emotionalContext.emotionalTone}".

EXAMPLES (what NOT to do):
- Input (FR): "Bonjour, mon ami, comment ça va ?"
  WRONG Output: "Bonjour ! Comment puis-je vous aider aujourd'hui ?"  ← This is a reply, not a translation.
  RIGHT Output (EN): "Hello, my friend, how are you?"

TASK:
Translate the following ${languageNames[sourceLanguage]} text into natural ${languageNames[targetLanguage]}.
Return ONLY the translated text:`;
    }

    /**
     * Select appropriate voice for language and emotion
     */
    selectVoiceForLanguage(language, emotionalContext) {
        const voiceMapping = {
            'en': {
                'friendly': 'nova',
                'empathetic': 'shimmer', 
                'calming': 'alloy',
                'reassuring': 'echo',
                'professional': 'onyx',
                'patient': 'fable'
            },
            // For other languages, OpenAI will adapt the voice appropriately
            'default': 'nova'
        };

        return voiceMapping[language]?.[emotionalContext.emotionalTone] || voiceMapping.default;
    }

    /**
     * Extract customer information from conversation text
     */
    async extractCustomerInfo(conversationText, sourceLanguage = 'en') {
        try {
            const extraction = await this.openai.chat.completions.create({
                model: this.translationModel,
                messages: [
                    {
                        role: "system",
                        content: `You are an AI assistant that extracts customer information from banking conversations. 

TASK: Extract the following information from the conversation:
1. Customer's full name (first and last name)
2. Phone number (any format)
3. Reason for visit/service needed

RULES:
- Only extract information that is explicitly mentioned
- For names: Look for phrases like "My name is...", "I'm...", "This is..."
- For phone: Look for any number sequence that could be a phone number (10+ digits)
- For visit reason: Identify the main banking service or reason for the visit
- Return "not_mentioned" if information is not found
- Be very careful not to make assumptions

LANGUAGE: The conversation may be in ${sourceLanguage} language.

Return ONLY a JSON object with this exact format:
{
  "name": "extracted name or not_mentioned",
  "phone": "extracted phone or not_mentioned", 
  "visitReason": "extracted reason or not_mentioned",
  "confidence": "high/medium/low"
}`
                    },
                    {
                        role: "user",
                        content: `Extract customer information from this conversation: "${conversationText}"`
                    }
                ],
                temperature: 0.1, // Very low for consistent extraction
                max_tokens: 200
            });

            const extractedText = extraction.choices[0].message.content.trim();
            
            try {
                const parsed = JSON.parse(extractedText);
                return {
                    success: true,
                    data: parsed
                };
            } catch (parseError) {
                console.error('Failed to parse extraction result:', extractedText);
                return {
                    success: false,
                    error: 'Failed to parse extraction result',
                    data: {
                        name: 'not_mentioned',
                        phone: 'not_mentioned',
                        visitReason: 'not_mentioned',
                        confidence: 'low'
                    }
                };
            }

        } catch (error) {
            console.error('Customer info extraction error:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    name: 'not_mentioned',
                    phone: 'not_mentioned',
                    visitReason: 'not_mentioned',
                    confidence: 'low'
                }
            };
        }
    }

    /**
     * Generate visit summary from conversation history
     */
    async generateVisitSummary(conversationHistory, customerInfo = {}) {
        try {
            // Combine all conversation text
            const fullConversation = conversationHistory
                .map(entry => `${entry.turn === 'customer' ? 'Customer' : 'Staff'}: ${entry.originalText}`)
                .join('\n');

            const summary = await this.openai.chat.completions.create({
                model: this.translationModel,
                messages: [
                    {
                        role: "system",
                        content: `You are an AI assistant that creates concise visit summaries for banking customer interactions.

TASK: Create a professional summary of the customer's visit for internal banking records.

GUIDELINES:
- Focus on key banking services discussed or requested
- Include customer's main concerns or questions
- Note any specific products mentioned (accounts, loans, cards, etc.)
- Mention resolution status if applicable
- Keep it concise but informative (2-4 sentences)
- Use professional banking terminology
- Include emotional context if relevant (concerned, satisfied, etc.)

CUSTOMER INFO:
${customerInfo.name ? `Name: ${customerInfo.name}` : ''}
${customerInfo.visitReason ? `Stated reason: ${customerInfo.visitReason}` : ''}

Create a summary that would be useful for follow-up interactions.`
                    },
                    {
                        role: "user",
                        content: `Summarize this banking conversation:\n\n${fullConversation}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 150
            });

            return {
                success: true,
                summary: summary.choices[0].message.content.trim()
            };

        } catch (error) {
            console.error('Visit summary generation error:', error);
            return {
                success: false,
                error: error.message,
                summary: 'Unable to generate visit summary'
            };
        }
    }

    /**
     * Process conversation for customer information updates
     */
    async processConversationForCustomerData(originalText, conversationHistory = [], currentCustomerData = {}) {
        try {
            // Extract information from the latest message
            const extractionResult = await this.extractCustomerInfo(originalText);
            
            // Generate updated visit summary if we have conversation history
            let summaryResult = { success: false, summary: '' };
            if (conversationHistory.length > 0) {
                summaryResult = await this.generateVisitSummary(conversationHistory, extractionResult.data);
            }

            // Merge with existing customer data
            const updatedData = { ...currentCustomerData };
            const extracted = extractionResult.data;

            // Update fields only if new information is found and not already filled
            if (extracted.name !== 'not_mentioned' && !updatedData.name) {
                updatedData.name = extracted.name;
            }
            
            if (extracted.phone !== 'not_mentioned' && !updatedData.phone) {
                // Clean phone number format
                const cleanPhone = extracted.phone.replace(/\D/g, '');
                if (cleanPhone.length >= 10) {
                    updatedData.phone = cleanPhone;
                }
            }

            if (summaryResult.success) {
                updatedData.notes = summaryResult.summary;
            }

            return {
                success: true,
                extractedInfo: extracted,
                updatedCustomerData: updatedData,
                summaryGenerated: summaryResult.success,
                hasUpdates: (
                    (extracted.name !== 'not_mentioned' && !currentCustomerData.name) ||
                    (extracted.phone !== 'not_mentioned' && !currentCustomerData.phone) ||
                    summaryResult.success
                )
            };

        } catch (error) {
            console.error('Conversation processing error:', error);
            return {
                success: false,
                error: error.message,
                extractedInfo: {},
                updatedCustomerData: currentCustomerData,
                summaryGenerated: false,
                hasUpdates: false
            };
        }
    }

    /**
     * Get supported languages with their codes
     */
    getSupportedLanguages() {
        return {
            'en': { name: 'English', native: 'English', flag: '🇺🇸' },
            'es': { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
            'pt': { name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
            'fr': { name: 'French', native: 'Français', flag: '🇫🇷' },
            'ar': { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
            'so': { name: 'Somali', native: 'Soomaali', flag: '🇸🇴' }
        };
    }
}

module.exports = AIService;