// =============================================================================
// TRANSLATION ROUTES
// =============================================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// MOCK TRANSLATION SERVICE
// In production, replace with actual Google Cloud Translation API
// =============================================================================

async function translateText(text, sourceLanguage, targetLanguage) {
  const startTime = Date.now();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  // Mock translations for common banking phrases
  const mockTranslations = {
    'pt': {
      'Hello, how can I help you today?': 'Olá, como posso ajudá-lo hoje?',
      'I need to open a savings account': 'Preciso abrir uma conta poupança',
      'I would like to make a deposit': 'Eu gostaria de fazer um depósito',
      'Can you check my balance?': 'Você pode verificar meu saldo?',
    },
    'fr': {
      'Hello, how can I help you today?': 'Bonjour, comment puis-je vous aider aujourd\'hui?',
      'I need to open a savings account': 'Je dois ouvrir un compte d\'épargne',
      'I would like to make a deposit': 'Je voudrais faire un dépôt',
      'Can you check my balance?': 'Pouvez-vous vérifier mon solde?',
    },
    'es': {
      'Hello, how can I help you today?': '¡Hola! ¿Cómo puedo ayudarle hoy?',
      'I need to open a savings account': 'Necesito abrir una cuenta de ahorros',
      'I would like to make a deposit': 'Me gustaría hacer un depósito',
      'Can you check my balance?': '¿Puede verificar mi saldo?',
    },
    'so': {
      'Hello, how can I help you today?': 'Salaan, sidee kuu caawin karaa maanta?',
      'I need to open a savings account': 'Waxaan u baahanahay inaan furo koonto kaydis',
    },
    'ar': {
      'Hello, how can I help you today?': 'مرحبا، كيف يمكنني مساعدتك اليوم؟',
      'I need to open a savings account': 'أحتاج إلى فتح حساب توفير',
    },
  };

  // Try to find a mock translation
  let translatedText = text;
  let confidence = 0.85 + Math.random() * 0.15; // 85-100%

  if (sourceLanguage === 'en' && mockTranslations[targetLanguage]) {
    translatedText = mockTranslations[targetLanguage][text] || `[${targetLanguage.toUpperCase()}] ${text}`;
  } else if (targetLanguage === 'en') {
    // Reverse lookup for translations to English
    translatedText = `[EN] ${text}`;
    confidence = 0.90 + Math.random() * 0.10;
  }

  const processingTimeMs = Date.now() - startTime;

  return {
    translatedText,
    confidence,
    processingTimeMs,
  };
}

// =============================================================================
// CREATE TRANSLATION
// =============================================================================

router.post('/', async (req, res, next) => {
  try {
    const { 
      sessionId, 
      text, 
      sourceLanguage, 
      targetLanguage, 
      speakerType,
      context,
    } = req.body;

    // Validate required fields
    if (!sessionId || !text || !sourceLanguage || !targetLanguage || !speakerType) {
      throw new ApiError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    const validLanguages = ['en', 'pt', 'fr', 'so', 'ar', 'es'];
    if (!validLanguages.includes(sourceLanguage) || !validLanguages.includes(targetLanguage)) {
      throw new ApiError(400, 'Invalid language code', 'VALIDATION_ERROR');
    }

    // Check session exists
    const session = queries.sessions.findById.get(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    // Perform translation
    const { translatedText, confidence, processingTimeMs } = await translateText(
      text,
      sourceLanguage,
      targetLanguage
    );

    // Save translation
    const translationId = uuidv4();
    
    queries.translations.create.run(
      translationId,
      sessionId,
      text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence,
      context || null,
      speakerType,
      processingTimeMs,
      req.user.id
    );

    // Also save to chat history
    queries.chat.create.run(
      uuidv4(),
      sessionId,
      translationId,
      speakerType,
      text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence
    );

    const translation = {
      id: translationId,
      sessionId,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence,
      context: context || null,
      speakerType,
      processingTimeMs,
      createdAt: new Date().toISOString(),
      createdById: req.user.id,
    };

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit('translation:result', translation);
    }

    res.status(201).json({
      success: true,
      data: translation,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET TRANSLATIONS FOR SESSION
// =============================================================================

router.get('/:sessionId', (req, res, next) => {
  try {
    const translations = queries.translations.findBySession.all(req.params.sessionId);

    res.json({
      success: true,
      data: translations.map(t => ({
        id: t.id,
        sessionId: t.session_id,
        originalText: t.original_text,
        translatedText: t.translated_text,
        sourceLanguage: t.source_language,
        targetLanguage: t.target_language,
        confidence: t.confidence,
        context: t.context,
        speakerType: t.speaker_type,
        processingTimeMs: t.processing_time_ms,
        createdAt: t.created_at,
        createdById: t.created_by_id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET CHAT HISTORY FOR SESSION
// =============================================================================

router.get('/:sessionId/history', (req, res, next) => {
  try {
    const messages = queries.chat.findBySession.all(req.params.sessionId);

    res.json({
      success: true,
      data: messages.map(m => ({
        id: m.id,
        sessionId: m.session_id,
        translationId: m.translation_id,
        speakerType: m.speaker_type,
        originalText: m.original_text,
        translatedText: m.translated_text,
        sourceLanguage: m.source_language,
        targetLanguage: m.target_language,
        confidence: m.confidence,
        timestamp: m.timestamp,
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
