const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const AIService = require('./services/aiService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
// Serve docs for downloads
app.use('/download', express.static(require('path').join(__dirname, '..', 'docs')));

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files; some browsers send 'application/octet-stream' for mic blobs
        const isAudio = file.mimetype && file.mimetype.startsWith('audio/');
        const isOctetStream = file.mimetype === 'application/octet-stream';
        if (isAudio || isOctetStream) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

// Initialize AI Service
const aiService = new AIService();

// Mock data for development
let customers = [];
let sessions = [];

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current state to newly connected client
    socket.emit('initial_data', { customers, sessions });

    socket.on('add_customer', (customer) => {
        customers.push(customer);
        io.emit('customer_added', customer);
    });

    socket.on('update_customer', (update) => {
        const index = customers.findIndex(c => c.id === update.id);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...update.updates };
            io.emit('customer_updated', customers[index]);
        }
    });

    // Streaming translation handlers
    socket.on('start_streaming_translation', async (data) => {
        const { sourceLanguage, targetLanguage, sessionId } = data;
        console.log(`🚀 START_STREAMING_TRANSLATION received!`);
        console.log(`🚀 Starting streaming translation: ${sourceLanguage} -> ${targetLanguage}`);
        console.log(`🚀 Session ID: ${sessionId}`);
        
        // Store session info
        socket.translationSession = {
            sourceLanguage,
            targetLanguage,
            sessionId,
            isActive: true
        };
        
        console.log(`🚀 Session created:`, socket.translationSession);
        socket.emit('streaming_started', { sessionId });
    });

    socket.on('streaming_audio_chunk', async (data) => {
        console.log('🔍 STREAMING_AUDIO_CHUNK received!');
        console.log('🔍 Translation session exists:', !!socket.translationSession);
        console.log('🔍 Session is active:', socket.translationSession?.isActive);
        
        if (!socket.translationSession || !socket.translationSession.isActive) {
            console.log('❌ No active translation session');
            return;
        }

        try {
            console.log('🔍 Raw data received:', JSON.stringify(data, null, 2));
            const { audioData, isFinal = false } = data;
            const { sourceLanguage, targetLanguage } = socket.translationSession;

            // Validate audioData
            if (!audioData) {
                console.error('❌ No audioData received in chunk. Data keys:', Object.keys(data));
                return;
            }

            console.log(`🎤 Received audio chunk: ${audioData.length} bytes, isFinal: ${isFinal}, session: ${socket.translationSession.sessionId}`);

            // Convert base64 audio to buffer
            const audioBuffer = Buffer.from(audioData, 'base64');
            
            // Log audio buffer info for debugging
            console.log(`🎤 Audio buffer size: ${audioBuffer.length} bytes, first 20 bytes:`, audioBuffer.slice(0, 20));

            // Process transcription
            const transcriptionResult = await aiService.streamingTranscription(
                audioBuffer, sourceLanguage, isFinal
            );

            console.log('📝 Transcription result:', transcriptionResult);
            
            if (transcriptionResult.success && transcriptionResult.text) {
                console.log('📝 Processing translation for text:', transcriptionResult.text);
                
                // Process translation
                const translationResult = await aiService.streamingTranslation(
                    transcriptionResult.text, sourceLanguage, targetLanguage, isFinal
                );

                console.log('🔄 Translation result:', translationResult);

                if (translationResult.success) {
                    // Send partial results
                    socket.emit('streaming_partial_result', {
                        sessionId: socket.translationSession.sessionId,
                        originalText: transcriptionResult.text,
                        translatedText: translationResult.translatedText,
                        isPartial: !isFinal,
                        timestamp: Date.now()
                    });

                    // If final, also generate TTS
                    if (isFinal && translationResult.translatedText) {
                        console.log('🔊 Generating TTS for:', translationResult.translatedText);
                        const ttsResult = await aiService.streamingTTS(
                            translationResult.translatedText, false
                        );

                        console.log('🔊 TTS result:', ttsResult);

                        if (ttsResult.success && ttsResult.audioBuffer) {
                            const audioBase64 = ttsResult.audioBuffer.toString('base64');
                            console.log('🔊 Sending audio result to client');
                            socket.emit('streaming_audio_result', {
                                sessionId: socket.translationSession.sessionId,
                                audioBuffer: audioBase64,
                                translatedText: translationResult.translatedText
                            });
                        }
                    }
                }
            } else {
                console.log('❌ Transcription failed or no text:', transcriptionResult);
            }
        } catch (error) {
            console.error('Streaming translation error:', error);
            socket.emit('streaming_error', {
                sessionId: socket.translationSession?.sessionId,
                error: error.message
            });
        }
    });

    socket.on('stop_streaming_translation', () => {
        if (socket.translationSession) {
            socket.translationSession.isActive = false;
            socket.emit('streaming_stopped', {
                sessionId: socket.translationSession.sessionId
            });
        }
    });

    socket.on('streaming_tts_request', async (data) => {
        if (!socket.translationSession || !socket.translationSession.isActive) {
            console.log('❌ No active translation session for TTS');
            return;
        }

        try {
            const { text, sessionId, isBuffered = false } = data;
            console.log(`🔊 TTS request: "${text}" (buffered: ${isBuffered})`);

            // Generate TTS audio
            const ttsResult = await aiService.streamingTTS(text, !isBuffered);
            
            if (ttsResult.success && ttsResult.audioBuffer) {
                console.log('🔊 TTS generated successfully');
                socket.emit('streaming_audio_result', {
                    sessionId,
                    translatedText: text,
                    audioBuffer: ttsResult.audioBuffer.toString('base64'),
                    isBuffered
                });
            } else {
                console.error('❌ TTS generation failed:', ttsResult.error);
                socket.emit('streaming_error', {
                    sessionId,
                    error: 'TTS generation failed'
                });
            }
        } catch (error) {
            console.error('TTS request error:', error);
            socket.emit('streaming_error', {
                sessionId: data.sessionId,
                error: error.message
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.translationSession) {
            socket.translationSession.isActive = false;
        }
    });
});

// Health check endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/customers', (req, res) => {
    res.json(customers);
});

app.get('/api/sessions', (req, res) => {
    res.json(sessions);
});

// AI Translation Endpoints

// Get supported languages
app.get('/api/languages', (req, res) => {
    res.json(aiService.getSupportedLanguages());
});

// Analyze emotion in audio
app.post('/api/analyze-emotion', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const emotionResult = await aiService.analyzeEmotion(req.file.buffer);
        res.json(emotionResult);
    } catch (error) {
        console.error('Emotion analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze emotion' });
    }
});

// Speech-to-speech translation
app.post('/api/translate-speech', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { sourceLanguage, targetLanguage, emotionalContext } = req.body;

        if (!sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Source and target languages are required' });
        }

        // Parse emotional context if it's a string
        let parsedEmotionalContext;
        try {
            parsedEmotionalContext = typeof emotionalContext === 'string' 
                ? JSON.parse(emotionalContext) 
                : emotionalContext;
        } catch (parseError) {
            parsedEmotionalContext = { emotionalTone: 'professional' };
        }

        const translationResult = await aiService.speechToSpeechTranslation(
            req.file.buffer,
            sourceLanguage,
            targetLanguage,
            parsedEmotionalContext
        );

        if (!translationResult || !translationResult.success) {
            return res.status(500).json(translationResult || { success: false, error: 'Translation failed' });
        }

        // Prepare optional base64 audio only if present
        const base64Audio = translationResult.audioBuffer && Buffer.isBuffer(translationResult.audioBuffer)
            ? translationResult.audioBuffer.toString('base64')
            : undefined;

        res.set({ 'Content-Type': 'application/json' });
        res.json({
            ...translationResult,
            ...(base64Audio ? { audioBuffer: base64Audio } : {})
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Failed to translate speech' });
    }
});

// Combined emotion analysis and translation with customer data extraction
app.post('/api/translate-with-emotion', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { sourceLanguage, targetLanguage, conversationHistory, currentCustomerData } = req.body;

        if (!sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Source and target languages are required' });
        }

        // Parse optional parameters
        let parsedConversationHistory = [];
        let parsedCustomerData = {};

        try {
            if (conversationHistory) {
                parsedConversationHistory = typeof conversationHistory === 'string' 
                    ? JSON.parse(conversationHistory) 
                    : conversationHistory;
            }
            if (currentCustomerData) {
                parsedCustomerData = typeof currentCustomerData === 'string'
                    ? JSON.parse(currentCustomerData)
                    : currentCustomerData;
            }
        } catch (parseError) {
            console.error('Error parsing optional parameters:', parseError);
        }

        // Run emotion analysis and translation in parallel for speed
        const [emotionResult, translationResult] = await Promise.all([
            aiService.analyzeEmotion(req.file.buffer),
            aiService.speechToSpeechTranslation(
                req.file.buffer,
                sourceLanguage,
                targetLanguage,
                { emotionalTone: 'professional' } // Use default while emotion analysis runs
            )
        ]);

        if (!translationResult || !translationResult.success) {
            return res.status(500).json({
                ...(translationResult || { success: false, error: 'Translation failed' }),
                emotionAnalysis: emotionResult
            });
        }

        // Process conversation for customer data extraction (can run in background)
        const customerDataResult = await aiService.processConversationForCustomerData(
            translationResult.originalText,
            parsedConversationHistory,
            parsedCustomerData
        );

        const base64Audio2 = translationResult.audioBuffer && Buffer.isBuffer(translationResult.audioBuffer)
            ? translationResult.audioBuffer.toString('base64')
            : undefined;

        res.json({
            ...translationResult,
            emotionAnalysis: emotionResult,
            ...(base64Audio2 ? { audioBuffer: base64Audio2 } : {}),
            customerDataExtraction: customerDataResult
        });
    } catch (error) {
        console.error('Combined translation error:', error);
        res.status(500).json({ error: 'Failed to process audio' });
    }
});

// Extract customer information from text
app.post('/api/extract-customer-info', async (req, res) => {
    try {
        const { text, sourceLanguage, conversationHistory, currentCustomerData } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await aiService.processConversationForCustomerData(
            text,
            conversationHistory || [],
            currentCustomerData || {}
        );

        res.json(result);
    } catch (error) {
        console.error('Customer info extraction error:', error);
        res.status(500).json({ error: 'Failed to extract customer information' });
    }
});

// Combined finalize endpoint for streaming flow: returns extraction + emotion in one response
app.post('/api/streaming-finalize', async (req, res) => {
    try {
        const { originalText, translatedText, conversationHistory, currentCustomerData, audioBase64 } = req.body || {};

        // Determine text to use for extraction
        const safeText = (originalText && typeof originalText === 'string' && originalText.trim())
            ? originalText
            : (translatedText && typeof translatedText === 'string' ? translatedText : '');

        if (!safeText) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Parse conversation history safely
        let parsedHistory = [];
        if (Array.isArray(conversationHistory)) {
            parsedHistory = conversationHistory;
        }

        // Kick off extraction
        const extractionPromise = aiService.processConversationForCustomerData(
            safeText,
            parsedHistory,
            currentCustomerData || {}
        );

        // Optional emotion analysis from audio
        let emotionPromise = Promise.resolve({ success: true, emotions: [], primaryEmotion: { name: 'professional', score: 0.8 }, emotionalTone: 'professional' });
        if (audioBase64 && typeof audioBase64 === 'string') {
            try {
                const audioBuffer = Buffer.from(audioBase64, 'base64');
                emotionPromise = aiService.analyzeEmotion(audioBuffer);
            } catch (e) {
                console.warn('Failed to decode audioBase64 for emotion analysis:', e.message);
            }
        }

        const [extractionResult, emotionResult] = await Promise.all([extractionPromise, emotionPromise]);

        res.json({
            success: true,
            customerDataExtraction: extractionResult,
            emotionAnalysis: emotionResult
        });
    } catch (error) {
        console.error('Streaming finalize error:', error);
        res.status(500).json({ error: 'Failed to finalize streaming turn' });
    }
});

// Generate visit summary
app.post('/api/generate-visit-summary', async (req, res) => {
    try {
        const { conversationHistory, customerInfo } = req.body;

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return res.status(400).json({ error: 'Conversation history is required' });
        }

        const result = await aiService.generateVisitSummary(conversationHistory, customerInfo || {});
        res.json(result);
    } catch (error) {
        console.error('Visit summary generation error:', error);
        res.status(500).json({ error: 'Failed to generate visit summary' });
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});