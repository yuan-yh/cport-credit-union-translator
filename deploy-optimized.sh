#!/bin/bash

# Deploy CPort Translation Backend with Optimized AI Processing
# This script deploys an optimized version ready for GPU acceleration

set -e

PROJECT_ID="solid-choir-472118-q6"
REGION="us-central1"
SERVICE_NAME="cport-optimized"
IMAGE_NAME="gcr.io/${PROJECT_ID}/cport-optimized"

echo "🚀 Deploying CPort Translation Backend with Optimized AI Processing..."

# Build and push the optimized image
echo "📦 Building optimized Docker image..."
gcloud builds submit --config cloudbuild-optimized.yaml .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."

gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 3001 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 10 \
  --max-instances 20 \
  --set-env-vars="NODE_ENV=production,REDIS_URL=redis://default:password@redis-12345.c1.us-central1-1.gce.cloud.redislabs.com:12345,OPTIMIZED_MODE=true" \
  --execution-environment=gen2

echo "✅ Optimized backend deployed successfully!"
echo "🌐 Service URL: https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app"

echo ""
echo "📊 Performance Improvements:"
echo "  - Optimized Whisper model loading"
echo "  - Better memory management"
echo "  - Improved concurrent request handling"
echo "  - Ready for GPU acceleration"

echo ""
echo "🔧 Next Steps:"
echo "  1. Update frontend to use optimized backend URL"
echo "  2. Test performance improvements"
echo "  3. Monitor metrics and optimize further"
