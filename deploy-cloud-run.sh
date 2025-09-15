#!/bin/bash

# Google Cloud Run Deployment Script for Ultra-Low Latency Translation App
# Make sure you have gcloud CLI installed and authenticated

set -e

# Configuration
PROJECT_ID="solid-choir-472118-q6"  # Your actual Google Cloud Project ID
REGION="us-east1"           # Match your existing service region
SERVICE_NAME_BACKEND="cport"
SERVICE_NAME_FRONTEND="translation-frontend"

echo "🚀 Deploying Ultra-Low Latency Translation App to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy backend
echo "🔨 Building and deploying backend..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME_BACKEND ./Dockerfile.backend

gcloud run deploy $SERVICE_NAME_BACKEND \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME_BACKEND \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3001 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 100 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,PORT=3001,REDIS_CACHE_ENABLED=true,CONVERSATION_CACHE_ENABLED=true,GOOGLE_STT_ENABLED=true,FAST_MODE=true"

# Get backend URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME_BACKEND --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

# Update frontend environment
echo "🔧 Updating frontend environment..."
sed -i.bak "s|VITE_API_BASE=.*|VITE_API_BASE=$BACKEND_URL|g" Dockerfile.frontend

# Build and deploy frontend
echo "🔨 Building and deploying frontend..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME_FRONTEND ./Dockerfile.frontend

gcloud run deploy $SERVICE_NAME_FRONTEND \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME_FRONTEND \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 1000 \
  --timeout 60

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME_FRONTEND --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed at: $FRONTEND_URL"

echo ""
echo "🎉 Deployment Complete!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Update your environment variables in Google Cloud Run console"
echo "2. Set up Redis Cloud or use Google Cloud Memorystore"
echo "3. Configure custom domain if needed"
echo "4. Test the ultra-low latency features!"
