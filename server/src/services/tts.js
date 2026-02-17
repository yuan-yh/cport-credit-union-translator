// =============================================================================
// TEXT-TO-SPEECH SERVICE - OpenAI TTS
// =============================================================================

let openai = null;

// Initialize OpenAI TTS
try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✓ OpenAI TTS initialized');
  } else {
    console.log('⚠ OpenAI API key not configured - TTS disabled');
  }
} catch (error) {
  console.warn('⚠ Failed to initialize OpenAI TTS:', error.message);
}

// Get settings from env
const TTS_MODEL = process.env.TTS_MODEL || 'tts-1';
const TTS_SPEED = parseFloat(process.env.TTS_SPEED) || 1.0;

// Voice mapping by language
const VOICE_MAP = {
  'en': 'alloy',      // Neutral, professional
  'pt': 'nova',       // Warm, suitable for Portuguese
  'fr': 'shimmer',    // Soft, suitable for French
  'es': 'nova',       // Warm, suitable for Spanish
  'ar': 'onyx',       // Deep, suitable for Arabic
  'so': 'echo',       // Clear, suitable for Somali
  'ln': 'echo',       // Clear, suitable for Lingala
};

/**
 * Synthesize speech from text using OpenAI TTS
 * @param {string} text - The text to synthesize
 * @param {string} language - The language code (e.g., 'en', 'pt', 'ln')
 * @returns {Promise<Buffer>} - Audio content as a Buffer (MP3)
 */
async function synthesizeSpeech(text, language = 'en') {
  if (!openai) {
    throw new Error('OpenAI TTS not configured');
  }

  const voice = VOICE_MAP[language] || 'alloy';
  
  console.log(`[TTS] Synthesizing speech: "${text.substring(0, 50)}..." with voice: ${voice}`);

  try {
    const mp3 = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: voice,
      input: text,
      speed: TTS_SPEED,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log(`[TTS] Generated ${buffer.length} bytes of audio`);
    
    return buffer;
  } catch (error) {
    console.error('[TTS] Error:', error.message);
    throw error;
  }
}

/**
 * Synthesize speech with streaming - returns a readable stream
 * Audio starts playing on the client as chunks arrive
 * @param {string} text - The text to synthesize
 * @param {string} language - The language code
 * @returns {Promise<ReadableStream>} - Streaming audio response
 */
async function synthesizeSpeechStream(text, language = 'en') {
  if (!openai) {
    throw new Error('OpenAI TTS not configured');
  }

  const voice = VOICE_MAP[language] || 'alloy';
  
  console.log(`[TTS-Stream] Starting stream: "${text.substring(0, 50)}..." with voice: ${voice}`);
  const startTime = Date.now();

  try {
    // OpenAI TTS returns a Response object that can be streamed
    const response = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: voice,
      input: text,
      speed: TTS_SPEED,
      response_format: 'mp3', // MP3 is best for streaming
    });

    console.log(`[TTS-Stream] First byte in ${Date.now() - startTime}ms`);
    
    // Return the response body as a stream
    return response.body;
  } catch (error) {
    console.error('[TTS-Stream] Error:', error.message);
    throw error;
  }
}

/**
 * Pipe TTS stream directly to HTTP response
 * This is the most efficient way to stream audio to the client
 * @param {string} text - Text to synthesize
 * @param {string} language - Language code
 * @param {Response} res - Express response object
 */
async function streamSpeechToResponse(text, language, res) {
  if (!openai) {
    throw new Error('OpenAI TTS not configured');
  }

  const voice = VOICE_MAP[language] || 'alloy';
  
  console.log(`[TTS-Stream] Streaming to response: "${text.substring(0, 40)}..." (${language})`);
  const startTime = Date.now();

  try {
    const response = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice: voice,
      input: text,
      speed: TTS_SPEED,
      response_format: 'mp3',
    });

    // Set headers for streaming audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-TTS-First-Byte-Ms', Date.now() - startTime);

    // Get the readable stream from the response
    const stream = response.body;
    
    let totalBytes = 0;
    let firstChunk = true;

    // Pipe chunks to response
    for await (const chunk of stream) {
      if (firstChunk) {
        console.log(`[TTS-Stream] First chunk sent in ${Date.now() - startTime}ms`);
        firstChunk = false;
      }
      totalBytes += chunk.length;
      res.write(chunk);
    }

    res.end();
    console.log(`[TTS-Stream] Complete: ${totalBytes} bytes in ${Date.now() - startTime}ms`);
    
    return { success: true, bytes: totalBytes, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error('[TTS-Stream] Error:', error.message);
    throw error;
  }
}

/**
 * Check if TTS service is available
 */
function isServiceAvailable() {
  return !!openai;
}

/**
 * Get service status
 */
function getServiceStatus() {
  return {
    available: !!openai,
    model: TTS_MODEL,
    speed: TTS_SPEED,
  };
}

module.exports = {
  synthesizeSpeech,
  synthesizeSpeechStream,
  streamSpeechToResponse,
  isServiceAvailable,
  getServiceStatus,
  VOICE_MAP,
};
