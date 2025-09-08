#!/bin/bash

# Start Persistent Faster-Whisper Server
# This keeps the model loaded in memory for ultra-fast transcription

echo "🚀 Starting Persistent Faster-Whisper Server..."
echo "📊 Model: $(grep FASTER_WHISPER_MODEL .env | cut -d'=' -f2)"
echo "💻 Device: $(grep FASTER_WHISPER_DEVICE .env | cut -d'=' -f2)"
echo "⚡ Compute Type: $(grep FASTER_WHISPER_COMPUTE_TYPE .env | cut -d'=' -f2)"
echo ""

# Load environment variables
source .env

# Start the server
python3 services/fasterWhisperServer.py 8999
