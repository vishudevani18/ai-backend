#!/bin/bash

# GCP Cloud Run Deployment Script
# Deploys NestJS backend to Cloud Run (Production Ready)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ======================
# Configuration
# ======================
PROJECT_ID="${GCP_PROJECT_ID:-ai-photo-studio-18}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-saas-backend}"
ARTIFACT_REGISTRY="${ARTIFACT_REGISTRY:-backend-repo}"

IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}"

CLOUD_SQL_INSTANCE="${CLOUD_SQL_INSTANCE:-${PROJECT_ID}:${REGION}:postgres-db}"
VPC_CONNECTOR="${VPC_CONNECTOR:-vpc-connector}"
GCS_BUCKET="${GCS_BUCKET:-${PROJECT_ID}-app-storage}"

# Optional Redis
REDIS_HOST="${REDIS_HOST:-}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

echo -e "${GREEN}Starting Cloud Run deployment...${NC}"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Service : ${SERVICE_NAME}"
echo ""

# ======================
# Preconditions
# ======================
if ! command -v gcloud &>/dev/null; then
    echo -e "${RED}❌ gcloud CLI not installed${NC}"
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated. Run:${NC} gcloud auth login"
    exit 1
fi

gcloud config set project "${PROJECT_ID}" >/dev/null

# ======================
# Enable APIs
# ======================
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    vpcaccess.googleapis.com \
    cloudbuild.googleapis.com \
    storage.googleapis.com

# ======================
# Docker Auth
# ======================
echo -e "${GREEN}Configuring Docker authentication...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ======================
# Artifact Registry
# ======================
echo -e "${GREEN}Checking Artifact Registry...${NC}"
if ! gcloud artifacts repositories describe "${ARTIFACT_REGISTRY}" \
    --location="${REGION}" &>/dev/null; then
    gcloud artifacts repositories create "${ARTIFACT_REGISTRY}" \
        --repository-format=docker \
        --location="${REGION}"
    echo -e "${GREEN}✓ Artifact Registry created${NC}"
else
    echo -e "${GREEN}✓ Artifact Registry exists${NC}"
fi

# ======================
# Build Image (FIXED)
# ======================
echo -e "${GREEN}Building Docker image...${NC}"
gcloud builds submit -t "${IMAGE_NAME}" .

# ======================
# Service Account
# ======================
SERVICE_ACCOUNT="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${GREEN}Checking service account...${NC}"
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" &>/dev/null; then
    gcloud iam service-accounts create "${SERVICE_NAME}-sa" \
        --display-name="Cloud Run Backend Service Account"

    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/cloudsql.client"

    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/storage.objectAdmin"

    # Grant access to the single "env" secret
    if gcloud secrets describe "env" &>/dev/null; then
        gcloud secrets add-iam-policy-binding "env" \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/secretmanager.secretAccessor" >/dev/null
        echo -e "${GREEN}✓ Granted access to 'env' secret${NC}"
    else
        echo -e "${YELLOW}⚠️  'env' secret not found. Create it before deployment.${NC}"
    fi

    echo -e "${GREEN}✓ Service account created${NC}"
else
    echo -e "${GREEN}✓ Service account exists${NC}"
fi

# ======================
# Environment Variables
# ======================
ENV_VARS="NODE_ENV=production,\
STORAGE_PROVIDER=gcs,\
GCS_BUCKET_NAME=${GCS_BUCKET},\
GCS_PROJECT_ID=${PROJECT_ID},\
GCS_CDN_BASE_URL=https://storage.googleapis.com,\
DB_HOST=/cloudsql/${CLOUD_SQL_INSTANCE},\
DB_PORT=5432,\
DB_USERNAME=dbuser,\
DB_DATABASE=ai_photo_studio_db,\
CSRF_ENABLED=true,\
HELMET_ENABLED=true,\
LOG_LEVEL=info"

if [ -n "${REDIS_HOST}" ]; then
    ENV_VARS="${ENV_VARS},REDIS_HOST=${REDIS_HOST},REDIS_PORT=${REDIS_PORT}"
    [ -n "${REDIS_PASSWORD}" ] && ENV_VARS="${ENV_VARS},REDIS_PASSWORD=${REDIS_PASSWORD}"
    echo -e "${YELLOW}Redis enabled${NC}"
else
    echo -e "${YELLOW}Redis not configured${NC}"
fi

# ======================
# Deploy
# ======================
echo -e "${GREEN}Deploying to Cloud Run...${NC}"

gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_NAME}" \
    --region "${REGION}" \
    --platform managed \
    --service-account "${SERVICE_ACCOUNT}" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 80 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --port 8080 \
    --set-env-vars "${ENV_VARS},GCP_PROJECT_ID=${PROJECT_ID}" \
    --add-cloudsql-instances "${CLOUD_SQL_INSTANCE}" \
    --vpc-connector "${VPC_CONNECTOR}" \
    --vpc-egress private-ranges-only

# ======================
# Output
# ======================
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region "${REGION}" \
    --format="value(status.url)")

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "Service URL: ${SERVICE_URL}"
echo ""

# ======================
# Optional: Run Migrations
# ======================
if [ "${AUTO_RUN_MIGRATIONS}" = "true" ]; then
    echo -e "${GREEN}Running database migrations...${NC}"
    if [ -f "./run-migrations.sh" ]; then
        chmod +x ./run-migrations.sh
        ./run-migrations.sh
    else
        echo -e "${YELLOW}⚠ run-migrations.sh not found. Run migrations manually:${NC}"
        echo "./run-migrations.sh"
    fi
else
    echo "Next steps:"
    echo "1. Run DB migrations: ./run-migrations.sh"
    echo "   Or set AUTO_RUN_MIGRATIONS=true to run automatically"
    echo "2. Test: curl ${SERVICE_URL}/api/v1/health"
    echo "3. Swagger: ${SERVICE_URL}/api/v1/docs"
fi
