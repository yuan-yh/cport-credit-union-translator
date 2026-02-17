// =============================================================================
// TRANSLATION SERVICE - OpenAI GPT-4 (Primary)
// Better context understanding for banking terminology
// =============================================================================

// Initialize OpenAI client
let openai = null;

try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✓ OpenAI GPT-4 translation initialized');
  } else {
    console.log('⚠ OpenAI API key not configured - using mock translation');
  }
} catch (error) {
  console.warn('⚠ Failed to initialize OpenAI:', error.message);
}

// Language code mapping
const LANGUAGE_NAMES = {
  'en': 'English',
  'pt': 'Portuguese (Brazilian)',
  'fr': 'French',
  'es': 'Spanish',
  'ar': 'Arabic',
  'so': 'Somali',
  'ln': 'Lingala',
};

// Banking terminology for context
const BANKING_CONTEXT = `
You are translating conversations at cPort Credit Union in Maine.
Common banking terms include:
- Savings account, checking account, money market
- Wire transfer, ACH transfer, direct deposit
- APR (Annual Percentage Rate), APY (Annual Percentage Yield)
- Overdraft, NSF (Non-Sufficient Funds)
- Routing number, account number
- Loan, mortgage, line of credit
- Certificate of Deposit (CD)
- Member services, account services

CRITICAL RULES:
1. "cPort" is the credit union name - NEVER translate it. Keep it exactly as "cPort".
2. Personal names (first names, last names) must NOT be translated - keep them exactly as spoken.
3. Place names and proper nouns should be kept in their original form.
`;

// Mock translations for demo mode
const MOCK_TRANSLATIONS = {
  'en-pt': {
    'Hello, I would like to check my account balance.': 'Olá, gostaria de verificar o saldo da minha conta.',
    'Can you help me with a wire transfer?': 'Pode me ajudar com uma transferência bancária?',
    'I need to open a new savings account.': 'Preciso abrir uma nova conta poupança.',
    'What are the current interest rates?': 'Quais são as taxas de juros atuais?',
    'I would like to deposit this check.': 'Gostaria de depositar este cheque.',
  },
  'pt-en': {
    'Olá, gostaria de verificar o saldo da minha conta.': 'Hello, I would like to check my account balance.',
    'Pode me ajudar com uma transferência bancária?': 'Can you help me with a wire transfer?',
    'Preciso abrir uma nova conta poupança.': 'I need to open a new savings account.',
    'Quais são as taxas de juros atuais?': 'What are the current interest rates?',
    'Gostaria de depositar este cheque.': 'I would like to deposit this check.',
  },
  'en-fr': {
    'Hello, I would like to check my account balance.': 'Bonjour, je voudrais vérifier le solde de mon compte.',
    'Can you help me with a wire transfer?': 'Pouvez-vous m\'aider avec un virement bancaire?',
    'I need to open a new savings account.': 'J\'ai besoin d\'ouvrir un nouveau compte d\'épargne.',
  },
  'fr-en': {
    'Bonjour, je voudrais vérifier le solde de mon compte.': 'Hello, I would like to check my account balance.',
    'Pouvez-vous m\'aider avec un virement bancaire?': 'Can you help me with a wire transfer?',
  },
  'en-es': {
    'Hello, I would like to check my account balance.': 'Hola, me gustaría verificar el saldo de mi cuenta.',
    'Can you help me with a wire transfer?': '¿Puede ayudarme con una transferencia bancaria?',
    'I need to open a new savings account.': 'Necesito abrir una nueva cuenta de ahorros.',
  },
  'es-en': {
    'Hola, me gustaría verificar el saldo de mi cuenta.': 'Hello, I would like to check my account balance.',
    '¿Puede ayudarme con una transferencia bancaria?': 'Can you help me with a wire transfer?',
  },
  'en-ln': {
    'Hello, I would like to check my account balance.': 'Mbote, nalingi kotala mbongo na ngai.',
    'Can you help me with a wire transfer?': 'Okoki kosalisa ngai na transfert ya mbongo?',
    'I need to open a new savings account.': 'Nalingi kofungola compte ya kobomba mbongo.',
    'What are the current interest rates?': 'Intérêt ezali boni sikoyo?',
    'Thank you for your help.': 'Merci mingi pona lisalisi na yo.',
  },
  'ln-en': {
    'Mbote, nalingi kotala mbongo na ngai.': 'Hello, I would like to check my account balance.',
    'Okoki kosalisa ngai na transfert ya mbongo?': 'Can you help me with a wire transfer?',
    'Nalingi kofungola compte ya kobomba mbongo.': 'I need to open a new savings account.',
    'Merci mingi pona lisalisi na yo.': 'Thank you for your help.',
    'Nalingi kozwa crédit mpo na ndako.': 'I would like to get a home loan.',
  },
};

/**
 * Mock translation function
 */
async function translateWithMock(text, sourceLanguage, targetLanguage) {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  const key = `${sourceLanguage}-${targetLanguage}`;
  const translations = MOCK_TRANSLATIONS[key] || {};
  
  if (translations[text]) {
    return {
      translatedText: translations[text],
      confidence: 0.92,
      provider: 'mock',
    };
  }
  
  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  return {
    translatedText: `[${langName}] ${text}`,
    confidence: 0.75,
    provider: 'mock',
  };
}

/**
 * Translate text using OpenAI GPT-4
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code
 * @param {string} context - Optional additional context
 * @returns {Promise<{translatedText: string, confidence: number}>}
 */
async function translateWithOpenAI(text, sourceLanguage, targetLanguage, context = '') {
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const sourceLang = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
  const targetLang = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  const systemPrompt = `You are a professional translator specializing in banking and financial services.
${BANKING_CONTEXT}

Translate the following text from ${sourceLang} to ${targetLang}.
${context ? `Additional context: ${context}` : ''}

IMPORTANT GUIDELINES:
- Maintain the original tone and formality
- Use appropriate banking/financial terminology
- Be culturally sensitive and natural
- Return ONLY the translated text, no explanations or quotes
- Keep numbers exactly as-is

DO NOT TRANSLATE (keep exactly as written):
- "cPort" (the credit union name)
- Personal names (e.g., "John", "Maria", "Ahmed", "Fatou")
- Street addresses, city names, state names
- Any proper nouns or brand names`;

  const model = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4-turbo-preview';
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    temperature: parseFloat(process.env.TEMPERATURE) || 0.3,
    max_tokens: parseInt(process.env.MAX_TOKENS) || 1000,
  });

  return {
    translatedText: response.choices[0].message.content.trim(),
    confidence: 0.95,
    provider: 'openai-gpt4',
  };
}

/**
 * Main translation function
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code
 * @param {object} options - Additional options
 * @returns {Promise<{translatedText: string, confidence: number, provider: string, processingTimeMs: number}>}
 */
async function translate(text, sourceLanguage, targetLanguage, options = {}) {
  const startTime = Date.now();
  const { context = '' } = options;

  // Skip if same language
  if (sourceLanguage === targetLanguage) {
    return {
      translatedText: text,
      confidence: 1.0,
      provider: 'passthrough',
      processingTimeMs: 0,
    };
  }

  // Require OpenAI - no mock fallback
  if (!openai) {
    console.error('[Translation] OPENAI_API_KEY not configured');
    throw new Error('Translation service not configured. Please set OPENAI_API_KEY.');
  }

  // Use OpenAI GPT-4
  const result = await translateWithOpenAI(text, sourceLanguage, targetLanguage, context);
  const processingTimeMs = Date.now() - startTime;

  return {
    ...result,
    processingTimeMs,
  };
}

/**
 * Check service availability
 * @returns {object} - Status of each service
 */
function getServiceStatus() {
  return {
    openai: !!openai,
    available: !!openai, // Only available if OpenAI is configured
    mock: false,
    provider: openai ? 'openai-gpt4' : 'none',
  };
}

module.exports = {
  translate,
  translateWithOpenAI,
  translateWithMock,
  getServiceStatus,
  LANGUAGE_NAMES,
};
