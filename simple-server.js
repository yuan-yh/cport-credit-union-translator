const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve our custom HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start_streaming_translation', async (data) => {
        const { sourceLanguage, targetLanguage, sessionId, customerData } = data;
        console.log(`🚀 Starting streaming translation: ${sourceLanguage} -> ${targetLanguage}`);
        console.log(`🚀 Customer: ${customerData.name}`);
        
        // Store session info
        socket.translationSession = {
            sourceLanguage,
            targetLanguage,
            sessionId,
            customerData,
            isActive: true
        };
        
        socket.emit('streaming_started', { sessionId });
        
        // Simulate a connection to the interpreter
        setTimeout(() => {
            socket.emit('interpreter_connected', {
                interpreterName: 'Maria Rodriguez',
                languages: `${sourceLanguage} ⇄ ${targetLanguage}`,
                status: 'connected'
            });
        }, 1000);
    });

    socket.on('streaming_audio_chunk', async (data) => {
        if (!socket.translationSession || !socket.translationSession.isActive) {
            return;
        }

        try {
            const { audioData, isFinal = false } = data;
            const { sourceLanguage, targetLanguage } = socket.translationSession;

            // Mock transcription and translation
            const mockTranscriptions = {
                'en': 'Hello, I need help with my account balance',
                'es': 'Hola, necesito ayuda con el saldo de mi cuenta',
                'fr': 'Bonjour, j\'ai besoin d\'aide avec le solde de mon compte',
                'ar': 'مرحبا، أحتاج مساعدة في رصيد حسابي',
                'pt': 'Olá, preciso de ajuda com o saldo da minha conta',
                'so': 'Salaan, u baahan tahay caawimada saldo-ka koontadayda'
            };

            const mockTranslations = {
                'en': 'Hello, I need help with my account balance',
                'es': 'Hola, necesito ayuda con el saldo de mi cuenta',
                'fr': 'Bonjour, j\'ai besoin d\'aide avec le solde de mon compte',
                'ar': 'مرحبا، أحتاج مساعدة في رصيد حسابي',
                'pt': 'Olá, preciso de ajuda com o saldo da minha conta',
                'so': 'Salaan, u baahan tahay caawimada saldo-ka koontadayda'
            };

            const transcribedText = mockTranscriptions[sourceLanguage] || 'Mock transcription';
            const translatedText = mockTranslations[targetLanguage] || 'Mock translation';

            // Send partial results
            socket.emit('streaming_partial_result', {
                sessionId: socket.translationSession.sessionId,
                originalText: transcribedText,
                translatedText: translatedText,
                isPartial: !isFinal,
                timestamp: Date.now()
            });

            // If final, also simulate TTS
            if (isFinal) {
                setTimeout(() => {
                    socket.emit('streaming_audio_result', {
                        sessionId: socket.translationSession.sessionId,
                        audioBuffer: 'mock-audio-data', // In real implementation, this would be base64 audio
                        translatedText: translatedText
                    });
                }, 500);
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

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.translationSession) {
            socket.translationSession.isActive = false;
        }
    });
});

const PORT = 5174; // Different port from Vite
server.listen(PORT, () => {
    console.log(`Custom server running on http://localhost:${PORT}`);
    console.log('Backend API available at http://localhost:3001');
});
