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
  isServiceAvailable,
  getServiceStatus,
  VOICE_MAP,
};
