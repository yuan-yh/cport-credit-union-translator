// Quick OpenAI connectivity test
// Usage:
//   1) Ensure OPENAI_API_KEY is set (via .env or shell)
//   2) node test-openai.js

require('dotenv').config();
const { OpenAI } = require('openai');

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is missing. Add it to server/.env or export it in your shell.');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_TRANSLATION_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Reply with the word: OK' },
      ],
      temperature: 0,
      max_tokens: 3,
    });
    console.log('OpenAI chat OK →', resp.choices?.[0]?.message?.content?.trim());
  } catch (err) {
    console.error('OpenAI test failed:', err?.message || err);
    process.exit(2);
  }
}

main();


