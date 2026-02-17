#!/bin/bash
# =============================================================================
# GPU VM Startup Script - Faster Whisper Service
# =============================================================================

set -e

echo "Starting Faster Whisper setup..."

# Wait for GPU drivers
sleep 30

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Install NVIDIA Docker runtime
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# Create app directory
mkdir -p /opt/whisper-service
cd /opt/whisper-service

# Create the Python service file
cat > main.py << 'PYTHON_EOF'
"""
Faster Whisper STT Microservice
"""
import os
import io
import time
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from faster_whisper import WhisperModel

MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = os.getenv("WHISPER_DEVICE", "cuda")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")

print(f"Loading Faster Whisper: {MODEL_SIZE} on {DEVICE}")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
print("Model loaded!")

app = FastAPI(title="Faster Whisper STT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    confidence: float
    processing_time_ms: int
    provider: str = "faster-whisper"

@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_SIZE, "device": DEVICE}

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(audio: UploadFile = File(...), language: Optional[str] = Form(None)):
    start = time.time()
    audio_data = await audio.read()
    
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_data)
        tmp_path = tmp.name
    
    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language if language else None,
            beam_size=5,
            vad_filter=True,
        )
        text = " ".join([s.text.strip() for s in segments])
        
        # Normalize cPort
        import re
        text = re.sub(r'seaport|sea port|c port|c-port|see port|cee port', 'cPort', text, flags=re.IGNORECASE)
        
        ms = int((time.time() - start) * 1000)
        print(f"Transcribed: '{text[:50]}...' ({ms}ms)")
        
        return TranscriptionResponse(
            text=text,
            language=info.language,
            confidence=0.95,
            processing_time_ms=ms
        )
    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
PYTHON_EOF

# Create requirements
cat > requirements.txt << 'EOF'
faster-whisper==1.0.1
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
pydantic==2.5.3
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM nvidia/cuda:12.1-cudnn8-runtime-ubuntu22.04
RUN apt-get update && apt-get install -y python3.11 python3-pip ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
COPY main.py .
ENV WHISPER_MODEL_SIZE=base
ENV WHISPER_DEVICE=cuda
ENV WHISPER_COMPUTE_TYPE=float16
EXPOSE 8080
CMD ["python3", "main.py"]
EOF

# Build and run the container
echo "Building Docker image..."
docker build -t whisper-service .

echo "Starting Whisper service..."
docker rm -f whisper-service 2>/dev/null || true
docker run -d \
    --name whisper-service \
    --gpus all \
    -p 8080:8080 \
    --restart unless-stopped \
    whisper-service

echo "Faster Whisper service started on port 8080"

# Wait and test
sleep 60
curl -s http://localhost:8080/health || echo "Service still starting..."
