// =============================================================================
// HYBRID TEXT-TO-SPEECH SERVICE
// Uses Google Cloud TTS for supported languages, OpenAI TTS for Lingala
// Google TTS supports streaming for faster perceived latency
// =============================================================================

const path = require('path');

// Google Cloud Text-to-Speech
let googleTTSClient = null;
try {
  const textToSpeech = require('@google-cloud/text-to-speech');
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                  path.join(__dirname, '../../gcs-key.json');
  
  googleTTSClient = new textToSpeech.TextToSpeechClient({
    keyFilename: keyPath,
  });
  console.log('✓ Google Cloud Text-to-Speech initialized');
} catch (error) {
  console.warn('⚠ Google Cloud TTS not available:', error.message);
}

// OpenAI TTS (fallback for Lingala)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('⚠ OpenAI TTS not available:', error.message);
}

// Language code mapping: our codes -> Google Cloud TTS language/voice
const GOOGLE_VOICE_MAP = {
  'en': { languageCode: 'en-US', name: 'en-US-Neural2-J', ssmlGender: 'MALE' },
  'es': { languageCode: 'es-US', name: 'es-US-Neural2-B', ssmlGender: 'MALE' },
  'fr': { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', ssmlGender: 'MALE' },
  'pt': { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B', ssmlGender: 'MALE' },
  'ar': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', ssmlGender: 'MALE' },
  'so': { languageCode: 'so-SO', name: 'so-SO-Standard-A', ssmlGender: 'FEMALE' }, // Limited voice options for Somali
  // 'ln' - Lingala NOT supported by Google
};

// OpenAI voice mapping (for Lingala fallback)
const OPENAI_VOICE_MAP = {
  'en': 'alloy',
  'pt': 'nova',
  'fr': 'shimmer',
  'es': 'nova',
  'ar': 'onyx',
  'so': 'echo',
  'ln': 'echo',
};

// Languages that must use OpenAI TTS
const OPENAI_ONLY_LANGUAGES = ['ln'];

/**
 * Synthesize speech using the best available service for the language
 * @param {string} text - Text to synthesize
 * @param {string} language - Language code
 * @returns {Promise<Buffer>} - Audio buffer (MP3)
 */
async function synthesizeSpeech(text, language = 'en') {
  const startTime = Date.now();
  
  // Determine which service to use
  const useOpenAI = OPENAI_ONLY_LANGUAGES.includes(language) || 
                    !googleTTSClient ||
                    !GOOGLE_VOICE_MAP[language];

  if (useOpenAI) {
    return synthesizeWithOpenAI(text, language, startTime);
  } else {
    return synthesizeWithGoogle(text, language, startTime);
  }
}

/**
 * Synthesize with Google Cloud TTS (faster, supports streaming)
 */
async function synthesizeWithGoogle(text, language, startTime) {
  if (!googleTTSClient) {
    throw new Error('Google Cloud TTS not configured');
  }

  const voiceConfig = GOOGLE_VOICE_MAP[language] || GOOGLE_VOICE_MAP['en'];
  
  console.log(`[TTS-Google] Synthesizing: "${text.substring(0, 40)}..." (${language})`);

  try {
    const request = {
      input: { text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
      },
    };

    const [response] = await googleTTSClient.synthesizeSpeech(request);
    
    const processingTime = Date.now() - startTime;
    const audioBuffer = Buffer.from(response.audioContent);
    
    console.log(`[TTS-Google] SUCCESS: ${audioBuffer.length} bytes in ${processingTime}ms`);

    return audioBuffer;
  } catch (error) {
    console.error('[TTS-Google] Error:', error.message);
    
    // Fallback to OpenAI
    console.log('[TTS-Google] Falling back to OpenAI TTS...');
    return synthesizeWithOpenAI(text, language, startTime);
  }
}

/**
 * Synthesize with OpenAI TTS (for Lingala or as fallback)
 */
async function synthesizeWithOpenAI(text, language, startTime) {
  if (!openai) {
    throw new Error('OpenAI TTS not configured');
  }

  const voice = OPENAI_VOICE_MAP[language] || 'alloy';
  
  console.log(`[TTS-OpenAI] Synthesizing: "${text.substring(0, 40)}..." (${language}, voice: ${voice})`);

  try {
    const mp3 = await openai.audio.speech.create({
      model: process.env.TTS_MODEL || 'tts-1',
      voice: voice,
      input: text,
      speed: parseFloat(process.env.TTS_SPEED) || 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const processingTime = Date.now() - startTime;
    
    console.log(`[TTS-OpenAI] SUCCESS: ${buffer.length} bytes in ${processingTime}ms`);
    
    return buffer;
  } catch (error) {
    console.error('[TTS-OpenAI] Error:', error.message);
    throw error;
  }
}

/**
 * Stream TTS audio directly to HTTP response (Google Cloud only)
 * Falls back to OpenAI for unsupported languages
 */
async function streamSpeechToResponse(text, language, res) {
  const startTime = Date.now();
  
  // Check if we should use Google (streaming) or OpenAI (non-streaming)
  const useOpenAI = OPENAI_ONLY_LANGUAGES.includes(language) || 
                    !googleTTSClient ||
                    !GOOGLE_VOICE_MAP[language];

  if (useOpenAI) {
    // OpenAI streaming (via their API, still faster than waiting)
    return streamWithOpenAI(text, language, res, startTime);
  } else {
    // Google is so fast, we can just synthesize and send
    return streamWithGoogle(text, language, res, startTime);
  }
}

/**
 * Stream with Google Cloud TTS
 */
async function streamWithGoogle(text, language, res, startTime) {
  if (!googleTTSClient) {
    throw new Error('Google Cloud TTS not configured');
  }

  const voiceConfig = GOOGLE_VOICE_MAP[language] || GOOGLE_VOICE_MAP['en'];
  
  console.log(`[TTS-Stream-Google] Starting: "${text.substring(0, 40)}..." (${language})`);

  try {
    const request = {
      input: { text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
      },
    };

    const [response] = await googleTTSClient.synthesizeSpeech(request);
    
    const firstByteTime = Date.now() - startTime;
    console.log(`[TTS-Stream-Google] Audio ready in ${firstByteTime}ms`);
    
    // Set headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-TTS-Provider', 'google');
    res.setHeader('X-TTS-First-Byte-Ms', firstByteTime);

    // Send the audio
    const audioBuffer = Buffer.from(response.audioContent);
    res.write(audioBuffer);
    res.end();

    const totalTime = Date.now() - startTime;
    console.log(`[TTS-Stream-Google] Complete: ${audioBuffer.length} bytes in ${totalTime}ms`);

    return { success: true, bytes: audioBuffer.length, durationMs: totalTime, provider: 'google' };
  } catch (error) {
    console.error('[TTS-Stream-Google] Error:', error.message);
    
    // Fallback to OpenAI
    console.log('[TTS-Stream-Google] Falling back to OpenAI...');
    return streamWithOpenAI(text, language, res, startTime);
  }
}

/**
 * Stream with OpenAI TTS
 */
async function streamWithOpenAI(text, language, res, startTime) {
  if (!openai) {
    throw new Error('OpenAI TTS not configured');
  }

  const voice = OPENAI_VOICE_MAP[language] || 'alloy';
  
  console.log(`[TTS-Stream-OpenAI] Starting: "${text.substring(0, 40)}..." (${language})`);

  try {
    const response = await openai.audio.speech.create({
      model: process.env.TTS_MODEL || 'tts-1',
      voice: voice,
      input: text,
      speed: parseFloat(process.env.TTS_SPEED) || 1.0,
      response_format: 'mp3',
    });

    const firstByteTime = Date.now() - startTime;
    console.log(`[TTS-Stream-OpenAI] First byte in ${firstByteTime}ms`);

    // Set headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-TTS-Provider', 'openai');
    res.setHeader('X-TTS-First-Byte-Ms', firstByteTime);

    // Stream the response
    const stream = response.body;
    let totalBytes = 0;

    for await (const chunk of stream) {
      totalBytes += chunk.length;
      res.write(chunk);
    }

    res.end();

    const totalTime = Date.now() - startTime;
    console.log(`[TTS-Stream-OpenAI] Complete: ${totalBytes} bytes in ${totalTime}ms`);

    return { success: true, bytes: totalBytes, durationMs: totalTime, provider: 'openai' };
  } catch (error) {
    console.error('[TTS-Stream-OpenAI] Error:', error.message);
    throw error;
  }
}

/**
 * Check if service is available
 */
function isServiceAvailable() {
  return !!googleTTSClient || !!openai;
}

/**
 * Get service status
 */
function getServiceStatus() {
  return {
    google: !!googleTTSClient,
    openai: !!openai,
    available: !!googleTTSClient || !!openai,
    supportedLanguages: Object.keys(GOOGLE_VOICE_MAP),
    openaiOnlyLanguages: OPENAI_ONLY_LANGUAGES,
  };
}

module.exports = {
  synthesizeSpeech,
  streamSpeechToResponse,
  isServiceAvailable,
  getServiceStatus,
  GOOGLE_VOICE_MAP,
  OPENAI_VOICE_MAP,
  OPENAI_ONLY_LANGUAGES,
};
