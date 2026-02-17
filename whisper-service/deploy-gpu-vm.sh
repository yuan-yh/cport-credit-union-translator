#!/bin/bash
# =============================================================================
# Deploy Faster Whisper Service to Google Cloud Compute Engine GPU VM
# =============================================================================

set -e

PROJECT_ID="solid-choir-472118-q6"
ZONE="us-central1-b"  # L4 GPUs available here
INSTANCE_NAME="cport-whisper-gpu"
MACHINE_TYPE="g2-standard-4"  # 4 vCPUs, 16GB RAM, includes L4 GPU
GPU_TYPE=""  # g2 machines have built-in L4 GPU
GPU_COUNT=0
IMAGE_FAMILY="pytorch-2-7-cu128-ubuntu-2204-nvidia-570"
IMAGE_PROJECT="deeplearning-platform-release"

echo "============================================================"
echo "Deploying Faster Whisper Service to GPU VM"
echo "============================================================"
echo "Project: $PROJECT_ID"
echo "Zone: $ZONE"
echo "Machine: $MACHINE_TYPE + $GPU_TYPE"
echo ""

# Check if instance already exists
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID &>/dev/null; then
    echo "Instance $INSTANCE_NAME already exists."
    echo "Use 'gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE' to delete first."
    exit 1
fi

# Create the VM with GPU
# g2-standard-4 includes built-in NVIDIA L4 GPU
echo "Creating GPU VM (g2-standard-4 with L4 GPU)..."
gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --maintenance-policy=TERMINATE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-balanced \
    --metadata-from-file=startup-script=startup-script.sh \
    --tags=http-server,whisper-service \
    --scopes=cloud-platform

echo ""
echo "Waiting for VM to start..."
sleep 30

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "============================================================"
echo "GPU VM Created Successfully!"
echo "============================================================"
echo "Instance: $INSTANCE_NAME"
echo "External IP: $EXTERNAL_IP"
echo "Service URL: http://$EXTERNAL_IP:8080"
echo ""
echo "Set this environment variable in Cloud Run:"
echo "FASTER_WHISPER_URL=http://$EXTERNAL_IP:8080"
echo ""
echo "To check status:"
echo "  curl http://$EXTERNAL_IP:8080/health"
echo ""
echo "To SSH into the VM:"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "To view logs:"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE -- 'docker logs whisper-service'"
echo ""

# Create firewall rule if it doesn't exist
if ! gcloud compute firewall-rules describe allow-whisper-service --project=$PROJECT_ID &>/dev/null; then
    echo "Creating firewall rule..."
    gcloud compute firewall-rules create allow-whisper-service \
        --project=$PROJECT_ID \
        --allow=tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=whisper-service \
        --description="Allow Whisper service traffic"
fi

echo "Done!"
