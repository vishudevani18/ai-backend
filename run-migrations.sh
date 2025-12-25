#!/bin/bash

# =====================================================
# Cloud Run Job: Run Database Migrations (PRODUCTION)
# - Injects Secret Manager env BEFORE app boot
# - Attaches Cloud SQL
# - Runs TypeORM migrations safely
# =====================================================

set -e

# ======================
# Colors
# ======================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ======================
# Configuration
# ======================
PROJECT_ID="${GCP_PROJECT_ID:-ai-photo-studio-18}"
REGION="${GCP_REGION:-asia-south1}"
JOB_NAME="${MIGRATION_JOB_NAME:-migrate-db}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-saas-backend}"
ARTIFACT_REGISTRY="${ARTIFACT_REGISTRY:-backend-repo}"

IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}"
CLOUD_SQL_INSTANCE="${CLOUD_SQL_INSTANCE:-${PROJECT_ID}:${REGION}:postgres-db}"
SERVICE_ACCOUNT="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${GREEN}🚀 Running database migrations via Cloud Run Job${NC}"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Job     : ${JOB_NAME}"
echo ""

# ======================
# Preconditions
# ======================
if ! command -v gcloud &>/dev/null; then
  echo -e "${RED}❌ gcloud CLI not installed${NC}"
  exit 1
fi

gcloud config set project "${PROJECT_ID}" >/dev/null

# ======================
# Environment Variables
# ======================
# Only NON-SECRET values here
ENV_VARS="NODE_ENV=production,\
GCP_PROJECT_ID=${PROJECT_ID},\
DB_HOST=/cloudsql/${CLOUD_SQL_INSTANCE},\
DB_PORT=5432,\
DB_USERNAME=dbuser,\
DB_DATABASE=ai_photo_studio_db"

# ======================
# Secrets (CRITICAL)
# ======================
# Load full env JSON from Secret Manager
SECRETS="env=env:latest"

# ======================
# Create or Update Job
# ======================
if gcloud run jobs describe "${JOB_NAME}" --region="${REGION}" &>/dev/null; then
  echo -e "${YELLOW}⚠ Migration job exists — updating...${NC}"

  gcloud run jobs update "${JOB_NAME}" \
    --region="${REGION}" \
    --image="${IMAGE_NAME}" \
    --service-account="${SERVICE_ACCOUNT}" \
    --set-cloudsql-instances="${CLOUD_SQL_INSTANCE}" \
    --set-env-vars="${ENV_VARS}" \
    --set-secrets="${SECRETS}" \
     --command="npm" \
     --args="run,migration:run:prod" \
    --max-retries=1 \
    --task-timeout=600

  echo -e "${GREEN}✓ Migration job updated${NC}"
else
  echo -e "${GREEN}Creating migration job...${NC}"

  gcloud run jobs create "${JOB_NAME}" \
    --region="${REGION}" \
    --image="${IMAGE_NAME}" \
    --service-account="${SERVICE_ACCOUNT}" \
    --set-cloudsql-instances="${CLOUD_SQL_INSTANCE}" \
    --set-env-vars="${ENV_VARS}" \
    --set-secrets="${SECRETS}" \
     --command="npm" \
     --args="run,migration:run:prod" \
    --max-retries=1 \
    --task-timeout=600

  echo -e "${GREEN}✓ Migration job created${NC}"
fi

# ======================
# Execute Migrations
# ======================
echo ""
echo -e "${GREEN}📦 Executing database migrations...${NC}"

gcloud run jobs execute "${JOB_NAME}" \
  --region="${REGION}" \
  --wait

echo ""
echo -e "${GREEN}✅ Database migrations completed successfully!${NC}"
echo ""
echo "View logs:"
echo "gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${JOB_NAME}\" --limit=50"
