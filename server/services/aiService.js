const OpenAI = require('openai');
const { HumeClient } = require('hume');
const fs = require('fs');
const { spawn } = require('child_process');
const ConversationCache = require('./conversationCache');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Initialize Hume client only if both API key and secret key are available
        this.humeEnabled = process.env.HUME_API_KEY && 
                          process.env.HUME_SECRET_KEY && 
                          process.env.HUME_API_KEY !== 'dummy_key';
        if (this.humeEnabled) {
            try {
                this.hume = new HumeClient({
                    apiKey: process.env.HUME_API_KEY,
                    secretKey: process.env.HUME_SECRET_KEY
                });
                console.log('Hume AI client initialized with API key and secret');
            } catch (error) {
                console.warn('Hume AI client initialization failed:', error.message);
                this.humeEnabled = false;
            }
        } else {
            console.log('Hume AI disabled - missing API key or secret key, using emotion fallbacks');
        }

        // Speed optimizations (configurable via environment)
        this.fastMode = process.env.FAST_MODE === 'true';
        this.fastTTSModel = process.env.TTS_MODEL || (this.fastMode ? 'tts-1' : 'tts-1-hd');
        this.maxTokens = parseInt(process.env.MAX_TOKENS) || (this.fastMode ? 150 : 300);
        this.temperature = parseFloat(process.env.TEMPERATURE) || (this.fastMode ? 0.1 : 0.3);
        this.ttsSpeed = parseFloat(process.env.TTS_SPEED) || (this.fastMode ? 1.1 : 0.9);

        // LLM model selection
        this.translationModel = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5';

        // Faster-whisper configuration
        this.fasterWhisperEnabled = process.env.FASTER_WHISPER_ENABLED === 'true';
        this.fasterWhisperModel = process.env.FASTER_WHISPER_MODEL || 'tiny';
        this.fasterWhisperDevice = process.env.FASTER_WHISPER_DEVICE || 'cpu';
        this.fasterWhisperComputeType = process.env.FASTER_WHISPER_COMPUTE_TYPE || 'int8';
        this.fasterWhisperServerUrl = process.env.FASTER_WHISPER_SERVER_URL || 'http://localhost:8999';
        this.usePersistentServer = process.env.FASTER_WHISPER_PERSISTENT_SERVER === 'true';

        // Conversation cache configuration
        this.conversationCacheEnabled = process.env.CONVERSATION_CACHE_ENABLED !== 'false';
        this.conversationCache = null;
        if (this.conversationCacheEnabled) {
            this.conversationCache = new ConversationCache();
        }

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
     * Analyze emotion in audio using Hume AI
     */
    async analyzeEmotion(audioBuffer) {
        try {
            // Check if Hume AI is enabled and configured
            if (!this.humeEnabled) {
                console.log('Using fallback emotion analysis (Hume disabled)');
                return {
                    success: true,
                    emotions: [{ name: 'professional', score: 0.8, confidence: 0.8 }],
                    primaryEmotion: { name: 'professional', score: 0.8 },
                    emotionalTone: 'professional'
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
                temperature: 0.0, // Deterministic
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
    async openaiSpeechToSpeechTranslation(audioBuffer, sourceLanguage, targetLanguage, emotionalContext) {
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
            const cachedResult = await this.checkConversationCache(
                transcription.text, sourceLanguage, targetLanguage
            );
            
            let cachedMeta = null;
            if (cachedResult) {
                // Do NOT return early. We still run strict translation to avoid chatty replies.
                // Keep cached metadata for downstream use (e.g., flags), but always translate fresh.
                cachedMeta = cachedResult;
                console.log('💾 Using cached metadata; proceeding with strict translation to avoid reply-style outputs');
            }

            // Step 2: Translate with emotional context and banking terminology (OPTIMIZED FOR SPEED)
            const translation = await this.openai.chat.completions.create({
                model: this.translationModel,
                messages: [
                    {
                        role: "system",
                        content: this.getTranslationSystemPrompt(sourceLanguage, targetLanguage, emotionalContext)
                    },
                    {
                        role: "user",
                        content: `Translate from ${sourceLanguage} to ${targetLanguage}.\nReturn ONLY the translated text, no extra words.\nIf already ${targetLanguage}, return unchanged.\n\nTEXT:\n${transcription.text}`
                    }
                ],
                temperature: 0,
                top_p: 1,
                presence_penalty: 0,
                frequency_penalty: 0,
                stream: false
            });

            // Step 3: Text-to-speech with appropriate voice (OPTIMIZED FOR SPEED)
            const speech = await this.openai.audio.speech.create({
                model: this.fastTTSModel, // Use faster TTS model
                voice: this.selectVoiceForLanguage(targetLanguage, emotionalContext),
                input: translation.choices[0].message.content,
                speed: this.ttsSpeed, // Configurable speed for optimization
                format: 'wav'
            });

            const audioArrayBuffer = await speech.arrayBuffer();
            const translatedAudioBuffer = Buffer.from(audioArrayBuffer);

            const totalLatency = Date.now() - startTime;
            console.log(`Total translation completed in ${totalLatency}ms using ${transcriptionProvider}`);

            // Step 4: Cache the successful translation
            await this.cacheTranslation({
                originalText: transcription.text,
                translatedText: translation.choices[0].message.content,
                sourceLanguage,
                targetLanguage,
                emotionalContext,
                customerMood: emotionalContext,
                audioDuration: 0, // Will be calculated if needed
                processingTime: totalLatency
            });

            return {
                success: true,
                originalText: transcription.text,
                translatedText: translation.choices[0].message.content,
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
                        const cachedResult = await this.checkConversationCache(
                            quickTranscription, sourceLanguage, targetLanguage
                        );
                        
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
            return await this.openaiSpeechToSpeechTranslation(audioBuffer, sourceLanguage, targetLanguage, emotionalContext);
            
        } catch (error) {
            console.error('Speech-to-speech translation error:', error);
            throw error;
        }
    }

    /**
     * Get banking-specific prompt for Whisper
     */
    getBankingPrompt(language) {
        const prompts = {
            'en': 'Banking conversation about accounts, transactions, loans, deposits, withdrawals, credit cards, and financial services.',
            'es': 'Conversación bancaria sobre cuentas, transacciones, préstamos, depósitos, retiros, tarjetas de crédito y servicios financieros.',
            'pt': 'Conversa bancária sobre contas, transações, empréstimos, depósitos, saques, cartões de crédito e serviços financeiros.',
            'fr': 'Conversation bancaire sur les comptes, transactions, prêts, dépôts, retraits, cartes de crédit et services financiers.',
            'ar': 'محادثة مصرفية حول الحسابات والمعاملات والقروض والودائع والسحوبات وبطاقات الائتمان والخدمات المالية.',
            'so': 'Wadahadal bangiga ah oo ku saabsan koontada, macaamil, deyn, dhigaal, lacag-bixinta, kaarka deynta, iyo adeegyada dhaqaalaha.'
        };

        return prompts[language] || prompts['en'];
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