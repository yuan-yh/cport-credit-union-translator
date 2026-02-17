// =============================================================================
// TRANSLATION ROUTES - SIMPLIFIED
// =============================================================================

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { translate, getServiceStatus } = require('../services/translation');
const { transcribeAudio, isServiceAvailable: isTranscriptionAvailable, getServiceStatus: getTranscriptionStatus } = require('../services/transcription');
const { synthesizeSpeech, isServiceAvailable: isTTSAvailable, getServiceStatus: getTTSStatus } = require('../services/tts');
const { uploadAudio } = require('../services/storage');

const router = express.Router();

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/flac'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`), false);
    }
  },
});

// All routes require authentication
router.use(authenticate);

const validLanguages = ['en', 'pt', 'fr', 'so', 'ar', 'es', 'ln'];

// =============================================================================
// GET SERVICE STATUS
// =============================================================================

router.get('/status', async (req, res) => {
  const translationStatus = getServiceStatus();
  const transcriptionStatus = getTranscriptionStatus();
  const ttsStatus = getTTSStatus();
  
  res.json({
    success: true,
    data: {
      translation: translationStatus,
      transcription: transcriptionStatus,
      tts: ttsStatus,
      supportedLanguages: validLanguages,
    },
  });
});

// =============================================================================
// GET ALL TRANSLATIONS (Admin Dashboard)
// =============================================================================

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 500;
    const translations = await queries.translations.findRecent.all(limit);

    res.json({
      success: true,
      data: translations.map(formatTranslation),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// FULL TRANSLATION PIPELINE (Audio -> STT -> Translate -> TTS)
// =============================================================================

router.post('/full-pipeline', upload.single('audio'), async (req, res, next) => {
  try {
    const { sessionId, sourceLanguage, targetLanguage, speakerType, context } = req.body;
    
    console.log(`[Pipeline] Starting: ${sourceLanguage} -> ${targetLanguage}, speaker: ${speakerType}`);
    
    if (!req.file) {
      throw new ApiError(400, 'Audio file is required', 'NO_AUDIO');
    }

    if (!sessionId || !sourceLanguage || !targetLanguage || !speakerType) {
      throw new ApiError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    if (!validLanguages.includes(sourceLanguage) || !validLanguages.includes(targetLanguage)) {
      throw new ApiError(400, 'Invalid language code', 'VALIDATION_ERROR');
    }

    // Check session exists
    const session = await queries.sessions.findById.get(sessionId);
    if (!session) {
      throw new ApiError(404, 'Session not found', 'NOT_FOUND');
    }

    const startTime = Date.now();

    // Step 1: Transcribe audio (STT)
    console.log(`[Pipeline] Step 1: Transcribing...`);
    const transcription = await transcribeAudio(req.file.buffer, sourceLanguage);
    console.log(`[Pipeline] STT: "${transcription.text}"`);

    // Validate transcription
    const trimmedText = (transcription.text || '').trim();
    if (!trimmedText || trimmedText.length < 2) {
      console.log(`[Pipeline] No speech detected`);
      return res.json({
        success: true,
        data: {
          noSpeechDetected: true,
          message: 'No speech detected',
          processingTimeMs: Date.now() - startTime,
        },
      });
    }

    // Step 2: Translate
    console.log(`[Pipeline] Step 2: Translating...`);
    const translation = await translate(
      transcription.text, 
      sourceLanguage, 
      targetLanguage,
      { context: context || `Banking conversation. Speaker: ${speakerType}` }
    );
    console.log(`[Pipeline] Translation: "${translation.translatedText}"`);

    // Step 3: Generate TTS
    let ttsAudioBase64 = null;
    if (isTTSAvailable()) {
      console.log(`[Pipeline] Step 3: Generating TTS...`);
      try {
        const audioBuffer = await synthesizeSpeech(translation.translatedText, targetLanguage);
        ttsAudioBase64 = audioBuffer.toString('base64');
      } catch (ttsError) {
        console.error(`[Pipeline] TTS error:`, ttsError.message);
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    // Step 4: Upload original audio to Google Cloud Storage
    let audioUrl = null;
    try {
      audioUrl = await uploadAudio(req.file.buffer, `${sessionId}/${uuidv4()}.webm`);
      console.log(`[Pipeline] Audio uploaded to: ${audioUrl}`);
    } catch (storageError) {
      console.error(`[Pipeline] Storage error:`, storageError.message);
    }

    // Save to database
    const translationId = uuidv4();
    
    await queries.translations.create.run(
      translationId,
      sessionId,
      transcription.text,
      translation.translatedText,
      sourceLanguage,
      targetLanguage,
      speakerType,
      Math.min(transcription.confidence, translation.confidence),
      totalProcessingTime,
      audioUrl,
      req.user.id
    );

    const result = {
      id: translationId,
      sessionId,
      originalText: transcription.text,
      translatedText: translation.translatedText,
      sourceLanguage,
      targetLanguage,
      speakerType,
      confidence: Math.min(transcription.confidence, translation.confidence),
      processingTimeMs: totalProcessingTime,
      audioUrl,
      ttsAudio: ttsAudioBase64,
      ttsAvailable: !!ttsAudioBase64,
      createdAt: new Date().toISOString(),
      staffId: req.user.id,
    };

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit('translation:result', result);
    }

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(`[Pipeline] ERROR:`, error.message);
    next(error);
  }
});

// =============================================================================
// GET TRANSLATIONS FOR SESSION
// =============================================================================

router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const translations = await queries.translations.findBySession.all(req.params.sessionId);
    res.json({
      success: true,
      data: translations.map(formatTranslation),
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// TEXT-TO-SPEECH
// =============================================================================

router.post('/speak', async (req, res, next) => {
  try {
    const { text, language } = req.body;
    
    if (!text) {
      throw new ApiError(400, 'Text is required', 'VALIDATION_ERROR');
    }

    if (!isTTSAvailable()) {
      throw new ApiError(503, 'TTS service not available', 'SERVICE_UNAVAILABLE');
    }

    const audioBuffer = await synthesizeSpeech(text, language || 'en');
    
    res.json({
      success: true,
      data: {
        audio: audioBuffer.toString('base64'),
        format: 'mp3',
        language: language || 'en',
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// HELPERS
// =============================================================================

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
    customerLanguage: t.customer_language,
    customerName: t.customer_name,
    createdAt: t.created_at,
  };
}

module.exports = router;
