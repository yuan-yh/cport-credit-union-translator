# 🚀 Ultra-Low Latency Translation App - Google Cloud Run Deployment Guide

## 📋 Prerequisites

✅ **Completed:**
- Redis Cloud database: `database-MFK63ZDC`
- Redis endpoint: `redis-17753.c83.us-east-1-2.ec2.cloud.redislabs.com:17753`
- Local development environment working
- Docker files created

## 🎯 Deployment Steps

### 1. Google Cloud Setup

1. **Create/Select Project:**
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

### 2. Configure Environment Variables

Update `cloud-run.env` with your actual values:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-openai-key

# Hume AI Configuration  
HUME_API_KEY=your-actual-hume-api-key
HUME_SECRET_KEY=your-actual-hume-secret-key

# Redis Cloud Configuration (Already configured)
REDIS_URL=redis://default:Srq64jruxee5dHyTwBRK2USE32NLWCoZ@redis-17753.c83.us-east-1-2.ec2.cloud.redislabs.com:17753
REDIS_CACHE_ENABLED=true

# Google STT Configuration
GOOGLE_STT_ENABLED=true
GOOGLE_STT_MODEL=latest_long
GOOGLE_STT_LANGUAGE=auto
GOOGLE_APPLICATION_CREDENTIALS=your-google-service-account-key

# Performance Settings
FAST_MODE=true
TTS_MODEL=tts-1
MAX_TOKENS=150
TEMPERATURE=0.1
TTS_SPEED=1.1

# Server Configuration
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-url.run.app
```

### 3. Deploy Backend Service

**Option A: Using Google Cloud Console (Recommended)**

1. **Build Container:**
   - Go to Cloud Build → Create Build
   - Source: Upload `Dockerfile.backend` and server code
   - Build and push to Container Registry

2. **Deploy to Cloud Run:**
   - Go to Cloud Run → Create Service
   - Container image: `gcr.io/your-project-id/translation-backend`
   - **Configuration:**
     - Region: `us-central1` (closest to your Redis in us-east-1)
     - CPU: 2
     - Memory: 2Gi
     - Min instances: 1 (prevents cold starts)
     - Max instances: 10
     - Concurrency: 100
     - Timeout: 300s
   - **Environment Variables:** Copy from `cloud-run.env`

**Option B: Using gcloud CLI**

```bash
# Update deploy-cloud-run.sh with your project ID
nano deploy-cloud-run.sh

# Run deployment
./deploy-cloud-run.sh
```

### 4. Deploy Frontend Service

1. **Update Frontend Environment:**
   ```bash
   # Update Dockerfile.frontend with your backend URL
   sed -i 's|VITE_API_BASE=.*|VITE_API_BASE=https://your-backend-url.run.app|g' Dockerfile.frontend
   ```

2. **Deploy Frontend:**
   - Build container with `Dockerfile.frontend`
   - Deploy to Cloud Run with:
     - CPU: 1
     - Memory: 512Mi
     - Min instances: 0
     - Max instances: 5

### 5. Configure Redis Authentication (If Required)

If your Redis Cloud instance requires authentication:

1. **Get Redis Password:**
   - Go to Redis Cloud dashboard
   - Copy the password from database configuration

2. **Update Redis URL:**
   ```bash
   REDIS_URL=redis://default:Srq64jruxee5dHyTwBRK2USE32NLWCoZ@redis-17753.c83.us-east-1-2.ec2.cloud.redislabs.com:17753
   ```

### 6. Test Deployment

1. **Health Check:**
   ```bash
   curl https://your-backend-url.run.app/health
   ```

2. **Test Translation:**
   - Open frontend URL
   - Test voice translation
   - Check Redis cache hits in logs

## 🎯 Expected Performance

**With Redis Cloud + Google Cloud Run:**

- **Cold Start**: ~2-3 seconds (first request)
- **Warm Requests**: **<100ms** (cached translations)
- **Redis Cache Hits**: **<1ms** (instant responses)
- **Global Edge**: Multiple regions for low latency
- **Auto-scaling**: Handles traffic spikes automatically

## 🔧 Troubleshooting

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli -u redis://default:Srq64jruxee5dHyTwBRK2USE32NLWCoZ@redis-17753.c83.us-east-1-2.ec2.cloud.redislabs.com:17753 ping
```

### Environment Variables
- Ensure all API keys are correctly set
- Check Redis URL format
- Verify CORS_ORIGIN matches frontend URL

### Performance Issues
- Increase CPU/memory allocation
- Set min instances to 1 for backend
- Check Redis Cloud plan limits

## 📊 Monitoring

1. **Google Cloud Console:**
   - Cloud Run metrics
   - Logs and errors
   - Performance monitoring

2. **Redis Cloud Dashboard:**
   - Cache hit rates
   - Memory usage
   - Connection statistics

## 🚀 Next Steps

1. **Custom Domain:** Set up custom domain in Cloud Run
2. **SSL:** Automatic with Cloud Run
3. **Monitoring:** Set up alerts for performance
4. **Scaling:** Monitor and adjust based on usage

## 💡 Pro Tips

- **Region Selection**: Use `us-central1` for US users (closest to your Redis)
- **Min Instances**: Set to 1 for backend to avoid cold starts
- **Memory**: 2GB for backend (handles audio processing)
- **CPU**: 2 cores for backend (faster processing)
- **Redis**: Monitor cache hit rates for optimization
