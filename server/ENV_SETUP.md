# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=another-super-secure-refresh-secret

# =============================================================================
# TRANSLATION & TRANSCRIPTION SERVICES
# =============================================================================

# OpenAI API Key (Required for Whisper transcription + GPT translation fallback)
# Get your key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key

# Google Cloud Translation API Key (Optional - faster & cheaper than OpenAI)
# Get your key at: https://console.cloud.google.com/apis/credentials
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

## Service Priority

1. **Transcription (Speech-to-Text)**: Uses OpenAI Whisper API
2. **Translation**: 
   - Primary: Google Cloud Translation (faster, cheaper)
   - Fallback: OpenAI GPT-4 (better context understanding for banking terms)

## Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy and paste into your `.env` file

### Google Cloud Translation API Key
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable the "Cloud Translation API"
4. Go to APIs & Services > Credentials
5. Create an API key
6. Copy and paste into your `.env` file

## Testing Services

After starting the server, check service status:

```bash
curl http://localhost:3001/api/translations/status
```

Response will show which services are available:
```json
{
  "success": true,
  "data": {
    "translation": {
      "google": true,
      "openai": true,
      "available": true
    },
    "transcription": {
      "available": true,
      "provider": "openai-whisper"
    }
  }
}
```
