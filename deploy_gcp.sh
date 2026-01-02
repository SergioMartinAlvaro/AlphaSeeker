#!/bin/bash

# --- GCLOUD COMMAND RESOLUTION ---
# Intentar encontrar gcloud en el PATH, si no, usar la ruta absoluta común en macOS
if command -v gcloud &> /dev/null; then
    GCLOUD_CMD="gcloud"
elif [ -f "$HOME/google-cloud-sdk/bin/gcloud" ]; then
    GCLOUD_CMD="$HOME/google-cloud-sdk/bin/gcloud"
else
    echo "ERROR: 'gcloud' command not found."
    echo "Please ensure Google Cloud SDK is installed and in your PATH."
    exit 1
fi

echo "Using gcloud from: $GCLOUD_CMD"

# Configuration
PROJECT_ID=$($GCLOUD_CMD config get-value project)
# Region set to Madrid (europe-southwest1).
# NOTE: VM in Madrid is NOT covered by "Always Free" (US only), but covered by Trial Credits.
REGION="us-central1" 
ZONE="${REGION}-a"

SERVICE_NAME_API="alphaseeker-llm-cloud"
SERVICE_NAME_SCRAPER="python-scraper"
VM_NAME="n8n-server"

# --- Machine Type Selection ---
# STRICT FREE TIER: e2-micro is the ONLY instance type in the "Always Free" program.
# Note: It has limited RAM (1GB). We will add a SWAP file to prevent crashes.
MACHINE_TYPE="e2-micro" 

if [ -z "$PROJECT_ID" ]; then
    echo "ERROR: No Google Cloud Project selected."
    echo "Run 'gcloud init' or 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

echo "=== Deploying AlphaSeeker STRICT FREE TIER (Cloud Run + VM) ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Zone: $ZONE"
echo "Machine: $MACHINE_TYPE (Always Free Eligible)"
echo ""

# 0. Enable APIs
echo "--- Enabling Required GCP APIs ---"
$GCLOUD_CMD services enable run.googleapis.com compute.googleapis.com generativelanguage.googleapis.com cloudbuild.googleapis.com
echo "✅ APIs Enabled"

# 1. Ask for Gemini API Key if not present
if [ -z "$GEMINI_API_KEY" ]; then
    echo -n "Enter your Google Gemini API Key (from https://aistudio.google.com): "
    read -s GEMINI_API_KEY
    echo ""
fi

# 2. Deploy LLM API Cloud (Cloud Run)
echo "--- Deploying Cloud LLM API (Gemini-backed) ---"
$GCLOUD_CMD run deploy $SERVICE_NAME_API \
    --source ./llm-api-cloud \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars GEMINI_API_KEY="$GEMINI_API_KEY" \
    --memory 512Mi \
    --cpu 1 \
    --port 8080

API_URL=$($GCLOUD_CMD run services describe $SERVICE_NAME_API --region $REGION --format 'value(status.url)')
echo "✅ LLM API deployed at: $API_URL"

# 3. Deploy Scraper (Cloud Run)
echo "--- Deploying Scraper Service ---"
$GCLOUD_CMD run deploy $SERVICE_NAME_SCRAPER \
    --source ./scraper \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --port 8080

SCRAPER_URL=$($GCLOUD_CMD run services describe $SERVICE_NAME_SCRAPER --region $REGION --format 'value(status.url)')
echo "✅ Scraper deployed at: $SCRAPER_URL"

# 4. Build and Deploy Backend (Cloud Run)
echo "--- Building Backend Image ---"
$GCLOUD_CMD builds submit ./alphaseeker-web \
    --config=cloudbuild.backend.yaml

echo "--- Deploying Backend Service ---"
$GCLOUD_CMD run deploy alphaseeker-backend \
    --image gcr.io/$PROJECT_ID/alphaseeker-backend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --set-env-vars NODE_ENV=production,PORT=3000 \
    --port 3000

BACKEND_URL=$($GCLOUD_CMD run services describe alphaseeker-backend --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

# 5. Build and Deploy Frontend (Cloud Run)
echo "--- Building Frontend Image ---"
# We need to know the Backend URL and n8n URL (VM IP) for the build.
# Warning: VM_IP might be empty if we skipped creation.
if [ -z "$VM_IP" ]; then
    VM_IP=$($GCLOUD_CMD compute instances describe $VM_NAME --zone $ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
fi
N8N_URL="http://$VM_IP:5678"

echo "Building Frontend with API_URL=$BACKEND_URL and N8N_URL=$N8N_URL"

$GCLOUD_CMD builds submit ./alphaseeker-web \
    --config=cloudbuild.frontend.yaml \
    --substitutions=_BACKEND_URL=$BACKEND_URL/api,_N8N_URL=$N8N_URL

echo "--- Deploying Frontend Service ---"
$GCLOUD_CMD run deploy alphaseeker-frontend \
    --image gcr.io/$PROJECT_ID/alphaseeker-frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --port 80

FRONTEND_URL=$($GCLOUD_CMD run services describe alphaseeker-frontend --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed at: $FRONTEND_URL"

# 4. create/Check n8n VM (Compute Engine)
echo "--- Provisioning n8n Server (Compute Engine) ---"

# Check if VM exists
if $GCLOUD_CMD compute instances describe $VM_NAME --zone $ZONE > /dev/null 2>&1; then
    echo "⚠️  VM '$VM_NAME' already exists. Skipping creation."
    VM_IP=$($GCLOUD_CMD compute instances describe $VM_NAME --zone $ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
else
    echo "Creating VM '$VM_NAME' ($MACHINE_TYPE)..."
    echo "Adding 2GB SWAP to handle n8n on 1GB RAM..."
    
    # Create VM with Docker installed AND SWAP configured
    # e2-micro only has 1GB RAM, n8n needs more breathing room.
    $GCLOUD_CMD compute instances create $VM_NAME \
        --zone=$ZONE \
        --machine-type=$MACHINE_TYPE \
        --image-family=cos-stable \
        --image-project=cos-cloud \
        --boot-disk-size=30GB \
        --boot-disk-type=pd-standard \
        --metadata=startup-script="#!/bin/bash
# 1. Disable update-engine to save resources
systemctl stop update-engine
systemctl mask update-engine

# 2. Create 2GB Swap file (Critical for e2-micro)
fallocate -l 2G /var/swapfile
chmod 600 /var/swapfile
mkswap /var/swapfile
swapon /var/swapfile

# 3. Run n8n
docker run -d \
  --name n8n \
  --restart always \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_HOST=0.0.0.0 \
  -e WEBHOOK_URL=http://localhost:5678 \
  -e N8N_SECURE_COOKIE=false \
  docker.n8n.io/n8nio/n8n" \
        --tags=n8n-server

    echo "✅ VM Created."
    
    # Create Firewall Rule to open port 5678
    echo "Configuring Firewall for port 5678..."
    if ! $GCLOUD_CMD compute firewall-rules describe allow-n8n > /dev/null 2>&1; then
        $GCLOUD_CMD compute firewall-rules create allow-n8n \
            --allow tcp:5678 \
            --target-tags=n8n-server \
            --description="Allow n8n access"
        echo "✅ Firewall rule created."
    fi

    # Wait a bit for IP allocation
    sleep 5
    VM_IP=$($GCLOUD_CMD compute instances describe $VM_NAME --zone $ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
fi

echo ""
echo "=== Deployment Complete ==="
echo "---------------------------------------------------"
echo "1. LLM API URL:      $API_URL/analyze-batch"
echo "2. Scraper URL:      $SCRAPER_URL/scrape"
echo ""
echo "3. n8n Interface:    http://$VM_IP:5678"
echo "   (Wait 1-2 minutes for the VM to start Docker)"
echo "---------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Open http://$VM_IP:5678 in your browser."
echo "2. Set up your admin account."
echo "3. Import your workflow JSON."
echo "4. Update the HTTP Request nodes with the URLs above."
