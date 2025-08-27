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
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
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
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
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

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
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

        if (translationResult.success) {
            // Set appropriate headers for audio response
            res.set({
                'Content-Type': 'application/json',
                'X-Audio-Available': 'true'
            });
            
            // Send JSON response with base64 encoded audio
            res.json({
                ...translationResult,
                audioBuffer: translationResult.audioBuffer.toString('base64')
            });
        } else {
            res.status(500).json(translationResult);
        }
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

        if (translationResult.success) {
            // Process conversation for customer data extraction (can run in background)
            const customerDataPromise = aiService.processConversationForCustomerData(
                translationResult.originalText,
                parsedConversationHistory,
                parsedCustomerData
            );

            // Send response immediately, don't wait for customer data extraction
            const customerDataResult = await customerDataPromise;

            res.json({
                ...translationResult,
                emotionAnalysis: emotionResult,
                audioBuffer: translationResult.audioBuffer.toString('base64'),
                customerDataExtraction: customerDataResult
            });
        } else {
            res.status(500).json({
                ...translationResult,
                emotionAnalysis: emotionResult
            });
        }
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