require('dotenv').config();
const AIService = require('./services/aiService');

console.log('🧹 Testing cleanup - AI Service should work without Moshi/Kyutai...\n');

try {
    const ai = new AIService();
    console.log('✅ AI Service loaded successfully');
    console.log('✅ OpenAI enabled:', !!ai.openai);
    console.log('✅ Hume enabled:', ai.humeEnabled);
    console.log('✅ Speech-to-speech method available:', typeof ai.speechToSpeechTranslation === 'function');
    console.log('\n🎉 Cleanup successful! System is ready to use with OpenAI pipeline.');
} catch (error) {
    console.error('❌ Error:', error.message);
}
