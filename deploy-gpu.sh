#!/bin/bash

# Deploy CPort Translation Backend with GPU acceleration
# This script deploys to Google Cloud Run with GPU support

set -e

PROJECT_ID="solid-choir-472118-q6"
REGION="us-central1"
SERVICE_NAME="cport-gpu"
IMAGE_NAME="gcr.io/${PROJECT_ID}/cport-gpu"

echo "🚀 Deploying CPort Translation Backend with GPU acceleration..."

# Build and push the GPU-enabled image
echo "📦 Building GPU-enabled Docker image..."
gcloud builds submit --config cloudbuild-gpu.yaml .

# Deploy to Cloud Run with GPU
echo "🚀 Deploying to Cloud Run with GPU..."

# Note: Cloud Run GPU is currently in preview and has limitations
# For production GPU workloads, consider using GKE instead

gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 3001 \
  --memory 8Gi \
  --cpu 4 \
  --timeout 900 \
  --concurrency 1 \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production,REDIS_URL=redis://default:password@redis-12345.c1.us-central1-1.gce.cloud.redislabs.com:12345,GPU_ENABLED=true" \
  --execution-environment=gen2

echo "✅ GPU-enabled backend deployed successfully!"
echo "🌐 Service URL: https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app"

# Alternative: Deploy to GKE with GPU (recommended for production)
echo ""
echo "💡 For better GPU performance, consider deploying to GKE:"
echo "   kubectl apply -f k8s-gpu-deployment.yaml"
echo "   This provides better GPU control and performance."
