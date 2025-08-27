const OpenAI = require('openai');
const { HumeClient } = require('hume');
const fs = require('fs');

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
     * Perform speech-to-speech translation with emotional context
     */
    async speechToSpeechTranslation(audioBuffer, sourceLanguage, targetLanguage, emotionalContext) {
        try {
            // Create a temporary file for the audio
            const tempFilePath = `/tmp/input_audio_${Date.now()}.wav`;
            fs.writeFileSync(tempFilePath, audioBuffer);

            // Step 1: Speech-to-text with Whisper
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-1",
                language: sourceLanguage,
                prompt: this.getBankingPrompt(sourceLanguage)
            });

            // Step 2: Translate with emotional context and banking terminology (OPTIMIZED FOR SPEED)
            const translation = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: this.getTranslationSystemPrompt(sourceLanguage, targetLanguage, emotionalContext)
                    },
                    {
                        role: "user",
                        content: transcription.text
                    }
                ],
                temperature: this.temperature, // Lower temperature for faster responses
                max_tokens: this.maxTokens, // Limit response length for speed
                stream: false // Ensure we get the full response at once
            });

            // Step 3: Text-to-speech with appropriate voice (OPTIMIZED FOR SPEED)
            const speech = await this.openai.audio.speech.create({
                model: this.fastTTSModel, // Use faster TTS model
                voice: this.selectVoiceForLanguage(targetLanguage, emotionalContext),
                input: translation.choices[0].message.content,
                speed: this.ttsSpeed // Configurable speed for optimization
            });

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            const audioArrayBuffer = await speech.arrayBuffer();
            const translatedAudioBuffer = Buffer.from(audioArrayBuffer);

            return {
                success: true,
                originalText: transcription.text,
                translatedText: translation.choices[0].message.content,
                audioBuffer: translatedAudioBuffer,
                sourceLanguage,
                targetLanguage,
                emotionalContext,
                confidence: 0.95 // High confidence for OpenAI
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

        return `You are a professional banking translator specializing in ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]} translation.

EMOTIONAL CONTEXT: The speaker's emotional tone is "${emotionalContext.emotionalTone}". Adapt your translation to match this tone appropriately.

BANKING SPECIALIZATION:
- Use precise banking and financial terminology
- Maintain professional yet empathetic tone
- Ensure accuracy in financial concepts and numbers
- Be culturally sensitive to banking practices

TONE ADAPTATION GUIDELINES:
- ${emotionalContext.emotionalTone === 'friendly' ? 'Use warm, welcoming language' : ''}
- ${emotionalContext.emotionalTone === 'empathetic' ? 'Show understanding and compassion' : ''}
- ${emotionalContext.emotionalTone === 'calming' ? 'Use soothing, de-escalating language' : ''}
- ${emotionalContext.emotionalTone === 'reassuring' ? 'Provide confidence and comfort' : ''}
- ${emotionalContext.emotionalTone === 'professional' ? 'Maintain formal, respectful tone' : ''}
- ${emotionalContext.emotionalTone === 'patient' ? 'Use understanding, unhurried language' : ''}

INSTRUCTIONS:
1. Translate the banking conversation accurately
2. Preserve the emotional intent while adapting to cultural norms
3. Use appropriate banking terminology
4. Maintain clarity and professionalism
5. Ensure the translation sounds natural in ${languageNames[targetLanguage]}

Translate the following ${languageNames[sourceLanguage]} text to ${languageNames[targetLanguage]}:`;
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
                model: "gpt-3.5-turbo",
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
                model: "gpt-3.5-turbo",
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