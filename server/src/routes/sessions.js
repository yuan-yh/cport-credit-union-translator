// =============================================================================
// SESSION ROUTES - SIMPLIFIED
// =============================================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

const validLanguages = ['en', 'pt', 'fr', 'so', 'ar', 'es', 'ln'];

// =============================================================================
// CREATE SESSION
// =============================================================================

router.post('/', async (req, res, next) => {
  try {
    const { customerLanguage, customerName, notes } = req.body;

    if (!customerLanguage || !validLanguages.includes(customerLanguage)) {
      throw new ApiError(400, 'Valid customer language is required', 'VALIDATION_ERROR');
    }

    const sessionId = uuidv4();
    
    await queries.sessions.create.run(
      sessionId,
      customerLanguage,
      customerName || null,
      notes || null,
      req.user.id
    );

    const session = await queries.sessions.findById.get(sessionId);

    res.status(201).json({
      success: true,
      data: formatSession(session),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET ALL SESSIONS
// =============================================================================

router.get('/', async (req, res, next) => {
  try {
    const sessions = await queries.sessions.findAll.all();

    res.json({
      success: true,
      data: sessions.map(formatSession),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET SESSION BY ID
// =============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const session = await queries.sessions.findById.get(req.params.id);

    if (!session) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    // Get translations for this session
    const translations = await queries.translations.findBySession.all(req.params.id);

    res.json({
      success: true,
      data: {
        ...formatSession(session),
        translations: translations.map(formatTranslation),
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// COMPLETE SESSION
// =============================================================================

router.post('/:id/complete', async (req, res, next) => {
  try {
    const session = await queries.sessions.findById.get(req.params.id);

    if (!session) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    await queries.sessions.complete.run(req.params.id);
    
    const updated = await queries.sessions.findById.get(req.params.id);

    res.json({
      success: true,
      data: formatSession(updated),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// HELPERS
// =============================================================================

function formatSession(session) {
  return {
    id: session.id,
    customerLanguage: session.customer_language,
    customerName: session.customer_name,
    notes: session.notes,
    status: session.status,
    staffId: session.staff_id,
    staffName: session.staff_first_name ? `${session.staff_first_name} ${session.staff_last_name}` : null,
    translationCount: session.translation_count || 0,
    createdAt: session.created_at,
    completedAt: session.completed_at,
  };
}

function formatTranslation(t) {
  return {
    id: t.id,
    sessionId: t.session_id,
    originalText: t.original_text,
    translatedText: t.translated_text,
    sourceLanguage: t.source_language,
    targetLanguage: t.target_language,
    speakerType: t.speaker_type,
    confidence: t.confidence,
    processingTimeMs: t.processing_time_ms,
    audioUrl: t.audio_url,
    staffId: t.staff_id,
    staffName: t.staff_first_name ? `${t.staff_first_name} ${t.staff_last_name}` : null,
    createdAt: t.created_at,
  };
}

module.exports = router;
