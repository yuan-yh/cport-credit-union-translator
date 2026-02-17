// =============================================================================
// TRANSCRIPTION SERVICE - OpenAI Whisper (Primary)
// Supports all languages including Lingala
// =============================================================================

const fs = require('fs');
const path = require('path');

// Initialize OpenAI Whisper
let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✓ OpenAI Whisper STT initialized');
  } else {
    console.log('⚠ OpenAI API key not configured - using mock transcription');
  }
} catch (error) {
  console.warn('⚠ Failed to initialize OpenAI Whisper:', error.message);
}

// Get model from env or default
const WHISPER_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

// =============================================================================
// POST-PROCESSING: Fix common misheard words
// =============================================================================

/**
 * Fix "seaport" and variations to "cPort"
 * Whisper often mishears "cPort" as "seaport", "sea port", "C port", etc.
 */
function normalizeCPortMentions(text) {
  if (!text) return text;
  
  // Patterns that should become "cPort"
  const patterns = [
    /\bsea\s*port\b/gi,       // "sea port", "seaport"
    /\bseaport\b/gi,          // "Seaport"
    /\bc[\s-]*port\b/gi,      // "c port", "c-port", "C port"
    /\bsee\s*port\b/gi,       // "see port"
    /\bcee\s*port\b/gi,       // "cee port"
    /\bsi\s*port\b/gi,        // "si port"
  ];
  
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, 'cPort');
  }
  
  return result;
}

// Whisper supported language codes
// Note: Lingala (ln) is NOT directly supported by Whisper - use auto-detect
const WHISPER_SUPPORTED = ['en', 'pt', 'fr', 'es', 'ar', 'so'];
const AUTO_DETECT_LANGUAGES = ['ln']; // Languages to auto-detect (Whisper doesn't support explicit code)

// Mock transcription phrases for demo
const MOCK_TRANSCRIPTIONS = {
  'en': [
    'Hello, I would like to check my account balance.',
    'Can you help me with a wire transfer?',
    'I need to open a new savings account.',
  ],
  'pt': [
    'Olá, gostaria de verificar o saldo da minha conta.',
    'Pode me ajudar com uma transferência bancária?',
  ],
  'fr': [
    'Bonjour, je voudrais vérifier le solde de mon compte.',
    'Pouvez-vous m\'aider avec un virement bancaire?',
  ],
  'es': [
    'Hola, me gustaría verificar el saldo de mi cuenta.',
    '¿Puede ayudarme con una transferencia bancaria?',
  ],
  'ar': [
    'مرحبا، أود التحقق من رصيد حسابي.',
  ],
  'so': [
    'Salaam, waxaan jeclaan lahaa inaan hubiyo haraagayga akoonkayga.',
  ],
  'ln': [
    'Mbote, nalingi kotala mbongo na ngai.',
    'Okoki kosalisa ngai na transfert ya mbongo?',
    'Nalingi kofungola compte ya kobomba mbongo.',
    'Merci mingi pona lisalisi na yo.',
    'Nalingi kozwa crédit mpo na ndako.',
  ],
};

/**
 * Transcribe using OpenAI Whisper
 */
async function transcribeWithWhisper(audioInput, language) {
  if (!openai) {
    throw new Error('OpenAI Whisper not configured');
  }

  const startTime = Date.now();
  let tempPath = null;

  try {
    // Create temp file from buffer
    if (Buffer.isBuffer(audioInput)) {
      tempPath = path.join(__dirname, `../../temp/audio_${Date.now()}.webm`);
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(tempPath, audioInput);
    }

    const audioFile = fs.createReadStream(tempPath || audioInput);

    // Check if we should auto-detect language
    const useAutoDetect = !language || language === 'auto' || AUTO_DETECT_LANGUAGES.includes(language);
    console.log(`[Whisper] Transcribing audio - language: ${language || 'auto-detect'}, autoDetect: ${useAutoDetect}`);

    // Build transcription options
    const transcriptionOptions = {
      file: audioFile,
      model: WHISPER_MODEL,
      response_format: 'verbose_json',
    };

    // Only pass language if explicitly supported and not auto-detect
    if (!useAutoDetect && WHISPER_SUPPORTED.includes(language)) {
      transcriptionOptions.language = language;
    }

    const transcription = await openai.audio.transcriptions.create(transcriptionOptions);
    
    // Whisper returns detected language in verbose_json response
    const detectedLanguage = transcription.language || language || 'en';

    // Cleanup
    if (tempPath) {
      setTimeout(() => {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }, 5000);
    }

    // Apply post-processing to fix common misheard words
    const normalizedText = normalizeCPortMentions(transcription.text);
    
    console.log(`[Whisper] Transcription complete: "${normalizedText.substring(0, 50)}..." (detected: ${detectedLanguage})`);
    if (normalizedText !== transcription.text) {
      console.log(`[Whisper] Applied cPort normalization: "${transcription.text}" -> "${normalizedText}"`);
    }

    return {
      text: normalizedText,
      confidence: 0.95,
      duration: transcription.duration || 0,
      processingTimeMs: Date.now() - startTime,
      language: language || detectedLanguage,
      detectedLanguage: detectedLanguage,
      provider: 'whisper',
    };
  } catch (error) {
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch (e) {}
    }
    console.error('[Whisper] Error:', error.message);
    throw error;
  }
}

/**
 * Mock transcription for demo
 */
async function transcribeWithMock(language) {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const phrases = MOCK_TRANSCRIPTIONS[language] || MOCK_TRANSCRIPTIONS['en'];
  const randomText = phrases[Math.floor(Math.random() * phrases.length)];
  
  console.log(`[Mock] Generated transcription: "${randomText}"`);
  
  return {
    text: randomText,
    confidence: 0.85 + Math.random() * 0.1,
    duration: 2 + Math.random() * 3,
    processingTimeMs: 800,
    language,
    provider: 'mock',
  };
}

/**
 * Main transcription function
 * @param {Buffer|string} audioInput - Audio buffer or file path
 * @param {string} language - ISO language code
 * @returns {Promise<{text: string, confidence: number, duration: number}>}
 */
async function transcribeAudio(audioInput, language = 'en') {
  console.log(`[Transcription] Processing audio for language: ${language}`);
  console.log(`[Transcription] Audio input type: ${typeof audioInput}, isBuffer: ${Buffer.isBuffer(audioInput)}, size: ${Buffer.isBuffer(audioInput) ? audioInput.length : 'N/A'} bytes`);

  // Require Whisper - no mock fallback
  if (!openai) {
    console.error('[Transcription] OPENAI_API_KEY not configured');
    throw new Error('Transcription service not configured. Please set OPENAI_API_KEY.');
  }

  // Use Whisper
  const result = await transcribeWithWhisper(audioInput, language);
  console.log(`[Transcription] SUCCESS - Whisper returned: "${result.text.substring(0, 50)}..."`);
  return result;
}

/**
 * Check if transcription service is available
 */
async function isServiceAvailable() {
  return !!openai; // Only available if OpenAI is configured
}

/**
 * Get service status
 */
function getServiceStatus() {
  return {
    whisper: !!openai,
    mock: !openai,
    model: WHISPER_MODEL,
  };
}

function isRealServiceConfigured() {
  return !!openai;
}

module.exports = {
  transcribeAudio,
  isServiceAvailable,
  isRealServiceConfigured,
  getServiceStatus,
  WHISPER_SUPPORTED,
};
