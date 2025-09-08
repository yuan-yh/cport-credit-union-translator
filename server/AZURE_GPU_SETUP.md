# Azure GPU Setup Guide

## 🚀 **Ultra-Fast GPU Processing with Azure**

Leverage your Azure credits to get **10-50x faster** transcription using GPU compute!

## 📊 **Performance Comparison**

| Provider | Speed | Cost/Hour | Performance |
|----------|-------|-----------|-------------|
| **Azure GPU (Tesla V100)** | **100-500ms** | ~$3.06 | **50x faster** |
| **Azure GPU (T4)** | **200-800ms** | ~$0.35 | **20x faster** |
| **Local CPU** | 7+ seconds | Free | Baseline |
| **Local Persistent Server** | 200-500ms | Free | 10x faster |

## 🎯 **Setup Options**

### Option 1: Quick Setup (Recommended)
```bash
./setup-azure-gpu.sh
```
This script will:
- Create Azure resource group
- Launch GPU VM (Tesla V100)
- Install all dependencies
- Configure the service

### Option 2: Manual Setup
1. **Create Azure VM** with GPU
2. **Install dependencies**
3. **Deploy service**
4. **Configure endpoints**

## 💰 **Cost Management**

### VM Sizes & Costs
| Size | GPU | vCPUs | RAM | Cost/Hour | Best For |
|------|-----|-------|-----|----------|----------|
| **NC6s_v3** | Tesla V100 | 6 | 112GB | $3.06 | **Production** |
| **NC4as_T4_v3** | T4 | 4 | 28GB | $0.35 | **Development** |
| **NC12s_v3** | Tesla V100 | 12 | 224GB | $6.12 | **High Volume** |

### Cost Optimization
- **Auto-shutdown**: Stop VM when not in use
- **Spot instances**: 60-90% cheaper (with interruption risk)
- **Reserved instances**: 1-3 year commitment for 30-60% savings
- **Monitor usage**: Set up billing alerts

## 🛠️ **Setup Steps**

### 1. Prerequisites
```bash
# Install Azure CLI
brew install azure-cli

# Login to Azure
az login

# Verify subscription
az account show
```

### 2. Run Setup Script
```bash
./setup-azure-gpu.sh
```

### 3. Configure Environment
```bash
# Update .env file
AZURE_TRANSCRIPTION_ENABLED=true
AZURE_TRANSCRIPTION_ENDPOINT=http://YOUR_VM_IP:8999
AZURE_TRANSCRIPTION_API_KEY=your-secure-key
```

### 4. Deploy Service
```bash
# SSH into your VM
ssh azureuser@YOUR_VM_IP

# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv git
pip3 install faster-whisper torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Copy your project
scp -r . azureuser@YOUR_VM_IP:/home/azureuser/translator/

# Start the service
cd translator
python3 services/azureTranscriptionService.py
```

## ⚡ **Expected Performance**

### First Request
- **Model Loading**: 2-5 seconds (one-time)
- **Transcription**: 100-500ms
- **Total**: 3-6 seconds

### Subsequent Requests
- **Transcription**: 100-500ms
- **Total**: **100-500ms** (ultra-fast!)

### Comparison
| Scenario | Local CPU | Local Server | Azure GPU |
|----------|-----------|--------------|-----------|
| **First Request** | 7+ seconds | 7.5 seconds | 3-6 seconds |
| **Subsequent** | 7+ seconds | 200-500ms | **100-500ms** |
| **Greetings** | Instant | Instant | Instant |

## 🔧 **Configuration Options**

### GPU Model Sizes
```bash
# Ultra-fast (recommended for production)
AZURE_WHISPER_MODEL=large-v3
AZURE_WHISPER_DEVICE=cuda
AZURE_WHISPER_COMPUTE_TYPE=float16

# Balanced (good for development)
AZURE_WHISPER_MODEL=base
AZURE_WHISPER_DEVICE=cuda
AZURE_WHISPER_COMPUTE_TYPE=int8_float16

# Maximum speed
AZURE_WHISPER_MODEL=tiny
AZURE_WHISPER_DEVICE=cuda
AZURE_WHISPER_COMPUTE_TYPE=int8
```

### Performance Tuning
```bash
# Higher quality (slower)
AZURE_WHISPER_BEAM_SIZE=5
AZURE_WHISPER_COMPUTE_TYPE=float16

# Faster processing
AZURE_WHISPER_BEAM_SIZE=1
AZURE_WHISPER_COMPUTE_TYPE=int8
```

## 🎯 **Fallback Strategy**

The system automatically falls back through this hierarchy:

1. **Azure GPU** (100-500ms) - Ultra-fast
2. **Persistent Server** (200-500ms) - Fast
3. **Direct Faster-whisper** (4-7 seconds) - Medium
4. **OpenAI Whisper** (1-2 seconds) - Reliable

## 💡 **Best Practices**

### Cost Management
- **Stop VM** when not in use: `az vm deallocate`
- **Start VM** when needed: `az vm start`
- **Monitor costs**: Set up billing alerts
- **Use spot instances** for development

### Performance Optimization
- **Keep VM running** during business hours
- **Use larger models** for better accuracy
- **Monitor GPU utilization**
- **Scale up** for high volume

### Security
- **Use secure API keys**
- **Enable firewall rules**
- **Regular security updates**
- **Monitor access logs**

## 🚀 **Getting Started**

1. **Run the setup script**: `./setup-azure-gpu.sh`
2. **Configure your .env**: Update Azure settings
3. **Deploy to VM**: Copy and start service
4. **Test performance**: Try voice translation
5. **Monitor costs**: Set up billing alerts

## 🎉 **Benefits**

- **10-50x faster** transcription
- **Professional-grade** accuracy
- **Scalable** performance
- **Cost-effective** with credits
- **Automatic fallback** to local processing

Your Azure GPU setup will provide **ultra-fast transcription** that's perfect for production use! 🚀
