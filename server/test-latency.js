#!/usr/bin/env node
/**
 * Latency Test for Translation Pipeline
 * Tests: Audio → Transcription → Translation → TTS Audio
 */

const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config();

const API_URL = process.env.TEST_API_URL || 'https://cport-translator-576395442003.us-east1.run.app';

let authToken = null;

async function login() {
  console.log('Logging in...');
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password: 'admin123' }),
  });
  const data = await res.json();
  if (data.success) {
    authToken = data.data.accessToken;
    console.log('✓ Logged in as admin');
    return true;
  }
  console.error('✗ Login failed:', data.error);
  return false;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

// Test phrases to synthesize as "input audio"
const TEST_PHRASES = [
  { text: 'Hello, I would like to check my account balance please.', sourceLang: 'en', targetLang: 'es' },
  { text: 'Can you help me open a new savings account?', sourceLang: 'en', targetLang: 'fr' },
  { text: 'I need to make a wire transfer to another bank.', sourceLang: 'en', targetLang: 'pt' },
];

async function runLatencyTest() {
  console.log('='.repeat(60));
  console.log('TRANSLATION PIPELINE LATENCY TEST');
  console.log('='.repeat(60));
  console.log(`API: ${API_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  // First, check API health
  console.log('Checking API health...');
  try {
    const healthRes = await fetch(`${API_URL}/api/health`);
    const health = await healthRes.json();
    console.log(`✓ API Status: ${health.data?.status || 'unknown'}`);
  } catch (e) {
    console.error(`✗ API not reachable: ${e.message}`);
    process.exit(1);
  }

  // Login
  if (!await login()) {
    process.exit(1);
  }

  console.log('\n' + '-'.repeat(60));
  console.log('Testing TTS (Text-to-Speech) Latency');
  console.log('-'.repeat(60));

  // Test TTS using /speak endpoint
  const ttsTests = [
    { text: 'Welcome to cPort Credit Union. How may I help you today?', language: 'en' },
    { text: 'Bienvenido a cPort Credit Union. ¿Cómo puedo ayudarle hoy?', language: 'es' },
    { text: 'Bienvenue à cPort Credit Union. Comment puis-je vous aider?', language: 'fr' },
    { text: 'Bem-vindo ao cPort Credit Union. Como posso ajudá-lo hoje?', language: 'pt' },
  ];

  const ttsResults = [];

  for (const test of ttsTests) {
    console.log(`\nTTS: "${test.text.substring(0, 40)}..." (${test.language})`);
    
    const start = Date.now();
    
    try {
      const res = await fetch(`${API_URL}/api/translations/speak`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text: test.text,
          language: test.language,
        }),
      });
      
      const elapsed = Date.now() - start;
      
      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        const sizeKB = (audioBuffer.byteLength / 1024).toFixed(1);
        console.log(`  ✓ TTS complete: ${elapsed}ms`);
        console.log(`  → Audio size: ${sizeKB} KB`);
        ttsResults.push({ lang: test.language, time: elapsed, size: sizeKB });
      } else {
        const data = await res.json();
        console.log(`  ✗ Error: ${data.error}`);
      }
    } catch (e) {
      console.log(`  ✗ Request failed: ${e.message}`);
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log('Testing Service Status');
  console.log('-'.repeat(60));

  try {
    const statusRes = await fetch(`${API_URL}/api/translations/status`, {
      headers: getHeaders(),
    });
    const status = await statusRes.json();
    console.log('\nService Status:');
    console.log(`  Transcription: ${status.data?.transcription?.whisper ? '✓ Whisper' : '✗ Not configured'}`);
    console.log(`  Translation: ${status.data?.translation?.openai ? '✓ OpenAI GPT' : '✗ Not configured'}`);
    console.log(`  TTS: ${status.data?.tts?.openai ? '✓ OpenAI TTS' : '✗ Not configured'}`);
  } catch (e) {
    console.log(`  ✗ Failed to get status: ${e.message}`);
  }

  // Summary
  if (ttsResults.length > 0) {
    const avgTTS = Math.round(ttsResults.reduce((a, b) => a + b.time, 0) / ttsResults.length);
    console.log('\n' + '-'.repeat(60));
    console.log('TTS RESULTS SUMMARY');
    console.log('-'.repeat(60));
    console.log(`  Average TTS latency: ${avgTTS}ms`);
    console.log(`  Min: ${Math.min(...ttsResults.map(r => r.time))}ms`);
    console.log(`  Max: ${Math.max(...ttsResults.map(r => r.time))}ms`);
  }

  // Test full pipeline with real audio
  console.log('\n' + '-'.repeat(60));
  console.log('Testing FULL PIPELINE (Audio → STT → Translation → TTS)');
  console.log('-'.repeat(60));

  // First, generate some audio using TTS that we'll then send back through the pipeline
  console.log('\nStep 1: Generating test audio via TTS...');
  const testPhrase = 'I would like to check my account balance please.';
  
  try {
    const genStart = Date.now();
    const genRes = await fetch(`${API_URL}/api/translations/speak`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text: testPhrase, language: 'en' }),
    });
    
    if (!genRes.ok) {
      console.log('  ✗ Failed to generate test audio');
    } else {
      const testAudio = Buffer.from(await genRes.arrayBuffer());
      console.log(`  ✓ Generated test audio: ${(testAudio.length/1024).toFixed(1)} KB in ${Date.now()-genStart}ms`);
      
      // Now send through full pipeline
      console.log('\nStep 2: Sending through full translation pipeline...');
      console.log(`  Input: "${testPhrase}" (en → es)`);
      
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('audio', testAudio, { filename: 'test.mp3', contentType: 'audio/mpeg' });
      form.append('sourceLanguage', 'en');
      form.append('targetLanguage', 'es');
      form.append('sessionId', 'test-session');
      form.append('speakerType', 'customer');
      
      const pipelineStart = Date.now();
      
      const pipelineRes = await fetch(`${API_URL}/api/translations/full-pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders(),
        },
        body: form,
      });
      
      const pipelineTime = Date.now() - pipelineStart;
      const pipelineData = await pipelineRes.json();
      
      if (pipelineData.success) {
        console.log(`\n  ✓ FULL PIPELINE COMPLETE: ${pipelineTime}ms`);
        console.log(`\n  Breakdown:`);
        console.log(`    ├─ Transcription: "${pipelineData.data?.transcription?.text?.substring(0, 40)}..."`);
        console.log(`    ├─ STT time: ${pipelineData.data?.transcription?.processingTimeMs || 'N/A'}ms`);
        console.log(`    ├─ Translation: "${pipelineData.data?.translation?.translatedText?.substring(0, 40)}..."`);
        console.log(`    ├─ Translation time: ${pipelineData.data?.translation?.processingTimeMs || 'N/A'}ms`);
        console.log(`    └─ Audio URL: ${pipelineData.data?.audioUrl ? '✓ Generated' : '✗ None'}`);
        
        console.log('\n' + '='.repeat(60));
        console.log('TOTAL PIPELINE LATENCY: ' + pipelineTime + 'ms');
        console.log('='.repeat(60));
      } else {
        console.log(`  ✗ Pipeline error: ${pipelineData.error}`);
      }
    }
  } catch (e) {
    console.log(`  ✗ Full pipeline test failed: ${e.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('EXPECTED LATENCIES (based on component tests):');
  console.log('='.repeat(60));
  console.log(`
  Component Breakdown:
  ├─ Audio Upload:        ~100-300ms (depends on file size)
  ├─ Whisper STT:         ~1000-3000ms (depends on duration)
  ├─ GPT-4 Translation:   ~500-1500ms 
  ├─ OpenAI TTS:          ~300-800ms
  └─ Audio Download:      ~100-200ms
  
  Total Expected:         ~2-6 seconds for typical utterance
  
  Optimization Options:
  - Use streaming TTS for faster audio start
  - Use Whisper locally for faster STT
  - Use smaller translation models
  - Implement WebSocket for real-time streaming
  `);
}

// Run the test
runLatencyTest().catch(console.error);
