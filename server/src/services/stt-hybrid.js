// =============================================================================
// HYBRID SPEECH-TO-TEXT SERVICE
// Priority: 1) Faster Whisper (GPU VM) 2) OpenAI Whisper API 3) Google Cloud STT
// =============================================================================

const path = require('path');
const FormData = require('form-data');

// Faster Whisper microservice URL (GPU VM)
const FASTER_WHISPER_URL = process.env.FASTER_WHISPER_URL || null;
let fasterWhisperAvailable = false;

// Check if Faster Whisper service is available
async function checkFasterWhisper() {
  if (!FASTER_WHISPER_URL) return false;
  try {
    const response = await fetch(`${FASTER_WHISPER_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000) 
    });
    const data = await response.json();
    fasterWhisperAvailable = data.status === 'healthy';
    if (fasterWhisperAvailable) {
      console.log(`✓ Faster Whisper service available at ${FASTER_WHISPER_URL} (model: ${data.model})`);
    }
    return fasterWhisperAvailable;
  } catch {
    console.log('⚠ Faster Whisper service not available, will use fallbacks');
    return false;
  }
}

// Check on startup
if (FASTER_WHISPER_URL) {
  checkFasterWhisper();
  // Re-check every 30 seconds
  setInterval(checkFasterWhisper, 30000);
}

// Google Cloud Speech-to-Text (fallback)
let googleSpeechClient = null;
try {
  const speech = require('@google-cloud/speech');
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                  path.join(__dirname, '../../gcs-key.json');
  
  googleSpeechClient = new speech.SpeechClient({
    keyFilename: keyPath,
  });
  console.log('✓ Google Cloud Speech-to-Text initialized');
} catch (error) {
  console.warn('⚠ Google Cloud STT not available:', error.message);
}

// OpenAI Whisper API (fallback)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✓ OpenAI Whisper API initialized');
  }
} catch (error) {
  console.warn('⚠ OpenAI not available:', error.message);
}

// Language code mapping: our codes -> Google Cloud STT codes
const GOOGLE_LANGUAGE_MAP = {
  'en': 'en-US',
  'es': 'es-US',
  'fr': 'fr-FR',
  'pt': 'pt-BR',
  'ar': 'ar-XA',  // Modern Standard Arabic
  'so': 'so-SO',  // Somali
  // 'ln' - Lingala NOT supported by Google
};

// Languages that must use OpenAI Whisper
const WHISPER_ONLY_LANGUAGES = ['ln'];

/**
 * Transcribe audio using the best available service
 * 
 * PRIORITY ORDER:
 * 1. Faster Whisper (GPU VM) - Fastest (~200ms), same accuracy as Whisper
 * 2. OpenAI Whisper API - Accurate but slower (~2000ms)
 * 3. Google Cloud STT - Fallback, less accurate with accents
 * 
 * @param {Buffer} audioBuffer - Audio data
 * @param {string} language - Language code (en, es, fr, pt, ar, so, ln)
 * @returns {Promise<{text: string, confidence: number, detectedLanguage: string, provider: string}>}
 */
async function transcribeAudio(audioBuffer, language = null) {
  const startTime = Date.now();
  
  // Priority 1: Try Faster Whisper microservice (GPU, fastest)
  if (fasterWhisperAvailable && FASTER_WHISPER_URL) {
    try {
      return await transcribeWithFasterWhisper(audioBuffer, language, startTime);
    } catch (error) {
      console.error('[STT] Faster Whisper failed, trying OpenAI fallback:', error.message);
      // Mark as unavailable temporarily
      fasterWhisperAvailable = false;
      setTimeout(() => checkFasterWhisper(), 10000); // Re-check in 10s
    }
  }
  
  // Priority 2: Try OpenAI Whisper API (accurate)
  if (openai) {
    try {
      return await transcribeWithWhisper(audioBuffer, language, startTime);
    } catch (error) {
      console.error('[STT] OpenAI Whisper failed, trying Google fallback:', error.message);
    }
  }
  
  // Priority 3: Try Google Cloud STT (fallback)
  if (googleSpeechClient && language && GOOGLE_LANGUAGE_MAP[language]) {
    return await transcribeWithGoogle(audioBuffer, language, startTime);
  }
  
  throw new Error('No STT service available');
}

/**
 * Transcribe with Faster Whisper microservice (GPU VM)
 */
async function transcribeWithFasterWhisper(audioBuffer, language, startTime) {
  console.log(`[STT-FasterWhisper] Transcribing audio (${language || 'auto-detect'})`);
  
  try {
    const form = new FormData();
    form.append('audio', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    if (language) {
      form.append('language', language);
    }
    
    const response = await fetch(`${FASTER_WHISPER_URL}/transcribe`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Faster Whisper error: ${error}`);
    }
    
    const result = await response.json();
    
    const processingTime = Date.now() - startTime;
    
    // Normalize cPort
    const normalizedText = normalizeCPort(result.text);
    
    console.log(`[STT-FasterWhisper] SUCCESS: "${normalizedText.substring(0, 50)}..." (${processingTime}ms, server: ${result.processing_time_ms}ms)`);
    
    return {
      text: normalizedText,
      confidence: result.confidence,
      detectedLanguage: result.language || language,
      provider: 'faster-whisper',
      processingTimeMs: processingTime,
    };
  } catch (error) {
    console.error('[STT-FasterWhisper] Error:', error.message);
    throw error;
  }
}

/**
 * Transcribe with Google Cloud Speech-to-Text
 */
async function transcribeWithGoogle(audioBuffer, language, startTime) {
  if (!googleSpeechClient) {
    throw new Error('Google Cloud STT not configured');
  }

  const googleLang = GOOGLE_LANGUAGE_MAP[language] || 'en-US';
  
  console.log(`[STT-Google] Transcribing audio (${language} -> ${googleLang})`);

  try {
    // Configure the request
    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: 'WEBM_OPUS',  // Our recordings are WebM with Opus codec
        sampleRateHertz: 48000,
        languageCode: googleLang,
        enableAutomaticPunctuation: true,
        model: 'latest_long',  // Best accuracy
        useEnhanced: true,     // Enhanced model for better accuracy
      },
    };

    const [response] = await googleSpeechClient.recognize(request);
    
    const processingTime = Date.now() - startTime;
    
    if (!response.results || response.results.length === 0) {
      console.log(`[STT-Google] No speech detected (${processingTime}ms)`);
      return {
        text: '',
        confidence: 0,
        detectedLanguage: language,
        provider: 'google',
        processingTimeMs: processingTime,
      };
    }

    // Combine all transcription results
    const transcription = response.results
      .map(result => result.alternatives[0]?.transcript || '')
      .join(' ')
      .trim();

    // Get confidence from first result
    const confidence = response.results[0]?.alternatives[0]?.confidence || 0.9;

    // Apply cPort normalization
    const normalizedText = normalizeCPort(transcription);

    console.log(`[STT-Google] SUCCESS: "${normalizedText.substring(0, 50)}..." (${processingTime}ms, conf: ${confidence.toFixed(2)})`);

    return {
      text: normalizedText,
      confidence: confidence,
      detectedLanguage: language,
      provider: 'google',
      processingTimeMs: processingTime,
    };
  } catch (error) {
    console.error(`[STT-Google] Error:`, error.message);
    
    // Fallback to Whisper on Google error
    console.log('[STT-Google] Falling back to Whisper...');
    return transcribeWithWhisper(audioBuffer, language, startTime);
  }
}

/**
 * Transcribe with OpenAI Whisper (for Lingala or as fallback)
 */
async function transcribeWithWhisper(audioBuffer, language, startTime) {
  if (!openai) {
    throw new Error('OpenAI Whisper not configured');
  }

  console.log(`[STT-Whisper] Transcribing audio (${language || 'auto-detect'})`);

  try {
    const File = (await import('node:buffer')).File;
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });

    const params = {
      file: audioFile,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1',
      response_format: 'verbose_json',
    };

    // Only set language if specified and not auto-detect
    if (language && language !== 'ln') {
      params.language = language;
    }

    const transcription = await openai.audio.transcriptions.create(params);
    
    const processingTime = Date.now() - startTime;

    let transcribedText = transcription.text || '';
    
    // Normalize "seaport" variations to "cPort"
    transcribedText = normalizeCPort(transcribedText);

    console.log(`[STT-Whisper] SUCCESS: "${transcribedText.substring(0, 50)}..." (${processingTime}ms)`);

    return {
      text: transcribedText,
      confidence: 0.95,  // Whisper doesn't return confidence
      detectedLanguage: transcription.language || language,
      provider: 'whisper',
      processingTimeMs: processingTime,
    };
  } catch (error) {
    console.error('[STT-Whisper] Error:', error.message);
    throw error;
  }
}

/**
 * Normalize "seaport" variations to "cPort"
 */
function normalizeCPort(text) {
  return text.replace(/seaport|sea port|c port|c-port|see port|cee port/gi, 'cPort');
}

/**
 * Check if service is available
 */
function isServiceAvailable() {
  return fasterWhisperAvailable || !!openai || !!googleSpeechClient;
}

/**
 * Get service status
 */
function getServiceStatus() {
  return {
    fasterWhisper: fasterWhisperAvailable,
    fasterWhisperUrl: FASTER_WHISPER_URL,
    whisper: !!openai,
    google: !!googleSpeechClient,
    available: fasterWhisperAvailable || !!openai || !!googleSpeechClient,
    priority: fasterWhisperAvailable ? 'faster-whisper' : (openai ? 'whisper' : 'google'),
    supportedLanguages: Object.keys(GOOGLE_LANGUAGE_MAP),
    whisperOnlyLanguages: WHISPER_ONLY_LANGUAGES,
  };
}

module.exports = {
  transcribeAudio,
  isServiceAvailable,
  getServiceStatus,
  GOOGLE_LANGUAGE_MAP,
  WHISPER_ONLY_LANGUAGES,
};
