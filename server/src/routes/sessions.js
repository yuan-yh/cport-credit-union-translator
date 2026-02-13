// =============================================================================
// SESSION ROUTES
// =============================================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// HELPERS
// =============================================================================

function formatSession(dbSession) {
  return {
    id: dbSession.id,
    customerName: dbSession.customer_name,
    customerPhone: dbSession.customer_phone,
    preferredLanguage: dbSession.preferred_language,
    status: dbSession.status,
    serviceType: dbSession.service_type,
    priority: dbSession.priority,
    emotionState: dbSession.emotion_state,
    branchId: dbSession.branch_id,
    greeterId: dbSession.greeter_id,
    assignedBankerId: dbSession.assigned_banker_id,
    createdAt: dbSession.created_at,
    updatedAt: dbSession.updated_at,
    completedAt: dbSession.completed_at,
    greeter: dbSession.greeter_first_name ? {
      id: dbSession.greeter_id,
      firstName: dbSession.greeter_first_name,
      lastName: dbSession.greeter_last_name,
    } : undefined,
    assignedBanker: dbSession.banker_first_name ? {
      id: dbSession.assigned_banker_id,
      firstName: dbSession.banker_first_name,
      lastName: dbSession.banker_last_name,
    } : undefined,
  };
}

// =============================================================================
// CREATE SESSION
// =============================================================================

router.post('/', requireRole('GREETER', 'TELLER', 'CONSULTOR'), (req, res, next) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      preferredLanguage, 
      serviceType,
      notes,
    } = req.body;

    // Validate required fields
    if (!preferredLanguage) {
      throw new ApiError(400, 'Preferred language is required', 'VALIDATION_ERROR');
    }

    const validLanguages = ['en', 'pt', 'fr', 'so', 'ar', 'es'];
    if (!validLanguages.includes(preferredLanguage)) {
      throw new ApiError(400, 'Invalid language code', 'VALIDATION_ERROR');
    }

    const sessionId = uuidv4();
    
    queries.sessions.create.run(
      sessionId,
      customerName || null,
      customerPhone || null,
      preferredLanguage,
      serviceType || null,
      'STANDARD',
      req.user.branchId,
      req.user.id
    );

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      sessionId,
      'SESSION_CREATE',
      'session',
      JSON.stringify({ preferredLanguage, serviceType, notes }),
      req.ip
    );

    // Fetch the created session with relations
    const session = queries.sessions.findById.get(sessionId);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`branch:${req.user.branchId}`).emit('session:created', formatSession(session));
    }

    res.status(201).json({
      success: true,
      data: formatSession(session),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET SESSION BY ID
// =============================================================================

router.get('/:id', (req, res, next) => {
  try {
    const session = queries.sessions.findById.get(req.params.id);
    
    if (!session) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    // Get translations for this session
    const translations = queries.translations.findBySession.all(req.params.id);

    const formattedSession = formatSession(session);
    formattedSession.translations = translations.map(t => ({
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
    }));

    res.json({
      success: true,
      data: formattedSession,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET ACTIVE SESSIONS
// =============================================================================

router.get('/', (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.user.branchId;
    const sessions = queries.sessions.findActive.all(branchId);

    res.json({
      success: true,
      data: sessions.map(formatSession),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// UPDATE SESSION
// =============================================================================

router.patch('/:id', (req, res, next) => {
  try {
    const { customerName, serviceType, priority, emotionState, status, assignedBankerId } = req.body;

    // Check session exists
    const existing = queries.sessions.findById.get(req.params.id);
    if (!existing) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    // Update session
    queries.sessions.update.run(
      customerName,
      serviceType,
      priority,
      emotionState,
      status,
      assignedBankerId,
      req.params.id
    );

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      req.params.id,
      'SESSION_UPDATE',
      'session',
      JSON.stringify(req.body),
      req.ip
    );

    // Fetch updated session
    const session = queries.sessions.findById.get(req.params.id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${req.params.id}`).emit('session:updated', formatSession(session));
      io.to(`branch:${session.branch_id}`).emit('session:updated', formatSession(session));
    }

    res.json({
      success: true,
      data: formatSession(session),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// COMPLETE SESSION
// =============================================================================

router.post('/:id/complete', (req, res, next) => {
  try {
    // Check session exists
    const existing = queries.sessions.findById.get(req.params.id);
    if (!existing) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    // Complete session
    queries.sessions.complete.run(req.params.id);

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      req.params.id,
      'SESSION_COMPLETE',
      'session',
      null,
      req.ip
    );

    // Fetch updated session
    const session = queries.sessions.findById.get(req.params.id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${req.params.id}`).emit('session:completed', formatSession(session));
      io.to(`branch:${session.branch_id}`).emit('session:completed', formatSession(session));
    }

    res.json({
      success: true,
      data: formatSession(session),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
