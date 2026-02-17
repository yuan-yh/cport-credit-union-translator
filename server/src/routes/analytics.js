// =============================================================================
// ANALYTICS ROUTES - Admin Dashboard Statistics
// =============================================================================

const express = require('express');
const { query, queryOne, isPostgres } = require('../database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require admin
router.use(authenticate);
router.use(requireRole('ADMIN'));

// =============================================================================
// GET DASHBOARD ANALYTICS
// =============================================================================

router.get('/dashboard', async (req, res, next) => {
  try {
    // Total counts - works for both SQLite and PostgreSQL
    const totals = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'COMPLETED') as completed_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'ACTIVE') as active_sessions,
        (SELECT COUNT(*) FROM translations) as total_translations,
        (SELECT COUNT(DISTINCT staff_id) FROM sessions) as active_staff,
        (SELECT AVG(processing_time_ms) FROM translations) as avg_processing_time
    `, []);

    // Translations by language
    const languageStats = await query(`
      SELECT 
        source_language as language,
        COUNT(*) as count
      FROM translations
      GROUP BY source_language
      ORDER BY count DESC
    `, []);

    // Translations by day (last 7 days)
    const dailyStatsQuery = isPostgres
      ? `SELECT 
          DATE(created_at) as date,
          COUNT(*) as translations,
          COUNT(DISTINCT session_id) as sessions
        FROM translations
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC`
      : `SELECT 
          DATE(created_at) as date,
          COUNT(*) as translations,
          COUNT(DISTINCT session_id) as sessions
        FROM translations
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC`;
    const dailyStats = await query(dailyStatsQuery, []);

    // Translations by staff
    const staffStats = await query(`
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        COUNT(t.id) as translations,
        COUNT(DISTINCT t.session_id) as sessions
      FROM users u
      LEFT JOIN translations t ON u.id = t.staff_id
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY translations DESC
    `, []);

    // Recent sessions (only those with translations)
    const recentSessions = await query(`
      SELECT 
        s.id,
        s.customer_language,
        s.customer_name,
        s.status,
        s.created_at,
        s.completed_at,
        u.first_name || ' ' || u.last_name as staff_name,
        (SELECT COUNT(*) FROM translations WHERE session_id = s.id) as translation_count,
        (SELECT COUNT(*) FROM translations WHERE session_id = s.id AND audio_url IS NOT NULL) as audio_count
      FROM sessions s
      JOIN users u ON s.staff_id = u.id
      WHERE (SELECT COUNT(*) FROM translations WHERE session_id = s.id) > 0
      ORDER BY s.created_at DESC
      LIMIT 10
    `, []);

    // Speaker type breakdown
    const speakerStats = await query(`
      SELECT 
        speaker_type,
        COUNT(*) as count
      FROM translations
      GROUP BY speaker_type
    `, []);

    // Audio upload stats
    const audioStats = await queryOne(`
      SELECT
        COUNT(*) as total_translations,
        SUM(CASE WHEN audio_url IS NOT NULL THEN 1 ELSE 0 END) as with_audio,
        SUM(CASE WHEN audio_url IS NULL THEN 1 ELSE 0 END) as without_audio
      FROM translations
    `, []);

    res.json({
      success: true,
      data: {
        totals: {
          totalSessions: parseInt(totals?.total_sessions || 0),
          completedSessions: parseInt(totals?.completed_sessions || 0),
          activeSessions: parseInt(totals?.active_sessions || 0),
          totalTranslations: parseInt(totals?.total_translations || 0),
          activeStaff: parseInt(totals?.active_staff || 0),
          avgProcessingTime: Math.round(parseFloat(totals?.avg_processing_time || 0)),
        },
        languageStats: (languageStats || []).map(l => ({
          language: l.language,
          count: parseInt(l.count),
        })),
        dailyStats: (dailyStats || []).map(d => ({
          date: d.date,
          translations: parseInt(d.translations),
          sessions: parseInt(d.sessions),
        })),
        staffStats: (staffStats || []).map(s => ({
          id: s.id,
          name: s.name,
          translations: parseInt(s.translations),
          sessions: parseInt(s.sessions),
        })),
        recentSessions: (recentSessions || []).map(s => ({
          id: s.id,
          customerLanguage: s.customer_language,
          customerName: s.customer_name,
          status: s.status,
          staffName: s.staff_name,
          translationCount: parseInt(s.translation_count),
          audioCount: parseInt(s.audio_count),
          createdAt: s.created_at,
          completedAt: s.completed_at,
        })),
        speakerStats: (speakerStats || []).map(s => ({
          speakerType: s.speaker_type,
          count: parseInt(s.count),
        })),
        audioStats: {
          total: parseInt(audioStats?.total_translations || 0),
          withAudio: parseInt(audioStats?.with_audio || 0),
          withoutAudio: parseInt(audioStats?.without_audio || 0),
          uploadRate: audioStats?.total_translations > 0 
            ? Math.round((parseInt(audioStats?.with_audio || 0) / parseInt(audioStats?.total_translations)) * 100) 
            : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET ALL SESSIONS WITH TRANSLATIONS
// =============================================================================

router.get('/sessions', async (req, res, next) => {
  try {
    // Only get sessions that have at least one translation
    const sessions = await query(`
      SELECT 
        s.id,
        s.customer_language,
        s.customer_name,
        s.notes,
        s.status,
        s.created_at,
        s.completed_at,
        u.id as staff_id,
        u.first_name || ' ' || u.last_name as staff_name
      FROM sessions s
      JOIN users u ON s.staff_id = u.id
      WHERE (SELECT COUNT(*) FROM translations WHERE session_id = s.id) > 0
      ORDER BY s.created_at DESC
    `, []);

    // Get translations for each session
    const sessionsWithTranslations = [];
    
    for (const session of sessions) {
      const translations = await query(`
        SELECT 
          t.id,
          t.original_text,
          t.translated_text,
          t.source_language,
          t.target_language,
          t.speaker_type,
          t.confidence,
          t.processing_time_ms,
          t.audio_url,
          t.created_at,
          u.first_name || ' ' || u.last_name as staff_name
        FROM translations t
        JOIN users u ON t.staff_id = u.id
        WHERE t.session_id = ?
        ORDER BY t.created_at ASC
      `, [session.id]);

      sessionsWithTranslations.push({
        id: session.id,
        customerLanguage: session.customer_language,
        customerName: session.customer_name,
        notes: session.notes,
        status: session.status,
        staffId: session.staff_id,
        staffName: session.staff_name,
        createdAt: session.created_at,
        completedAt: session.completed_at,
        translations: translations.map(t => ({
          id: t.id,
          originalText: t.original_text,
          translatedText: t.translated_text,
          sourceLanguage: t.source_language,
          targetLanguage: t.target_language,
          speakerType: t.speaker_type,
          confidence: t.confidence,
          processingTimeMs: t.processing_time_ms,
          audioUrl: t.audio_url,
          staffName: t.staff_name,
          createdAt: t.created_at,
        })),
      });
    }

    res.json({
      success: true,
      data: sessionsWithTranslations,
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET SIGNED URL FOR AUDIO (Admin Only)
// =============================================================================

router.post('/audio-url', async (req, res, next) => {
  try {
    const { audioUrl } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'audioUrl is required',
      });
    }

    // Only process gs:// URLs
    if (!audioUrl.startsWith('gs://')) {
      return res.json({
        success: true,
        data: { signedUrl: audioUrl }, // Already a regular URL
      });
    }

    const { getSignedUrl } = require('../services/storage');
    const signedUrl = await getSignedUrl(audioUrl, 60); // 60 minute expiry

    if (!signedUrl) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate signed URL',
      });
    }

    res.json({
      success: true,
      data: { signedUrl },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
