#!/bin/bash

# Branch-Aware Cloud Run Deployment Script
# Handles green-test, green-deploy, and blue-prod deployments with traffic splitting

set -euo pipefail

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
SERVICE_NAME="${SERVICE_NAME:-saas-backend}"
ARTIFACT_REGISTRY="${ARTIFACT_REGISTRY_REPO:-backend-repo}"

IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY}/${SERVICE_NAME}"

CLOUD_SQL_INSTANCE="${CLOUD_SQL_INSTANCE:-${PROJECT_ID}:${REGION}:postgres-db}"
VPC_CONNECTOR="${VPC_CONNECTOR:-vpc-connector}"
GCS_BUCKET="${GCS_BUCKET:-${PROJECT_ID}-app-storage}"

# Deployment configuration from environment (set by GitHub Actions)
REVISION_TAG="${REVISION_TAG:-blue-prod}"
SECRET_NAME="${SECRET_NAME:-env}"
DEPLOYMENT_REVISION="${DEPLOYMENT_REVISION:-${REVISION_TAG}}"
TRAFFIC_PERCENT="${TRAFFIC_PERCENT:-100}"

SERVICE_ACCOUNT="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${GREEN}Starting Cloud Run deployment...${NC}"
echo "Project          : ${PROJECT_ID}"
echo "Region           : ${REGION}"
echo "Service          : ${SERVICE_NAME}"
echo "Revision Tag     : ${REVISION_TAG}"
echo "Secret Name      : ${SECRET_NAME}"
echo "Deployment Rev   : ${DEPLOYMENT_REVISION}"
echo "Traffic          : ${TRAFFIC_PERCENT}%"
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
# Environment Variables
# ======================
# Base environment variables (no secrets - all loaded at runtime from Secret Manager)
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
LOG_LEVEL=info,\
GCP_PROJECT_ID=${PROJECT_ID},\
DEPLOYMENT_REVISION=${DEPLOYMENT_REVISION}"

# Add SECRET_NAME only if it's not the default 'env'
if [ "${SECRET_NAME}" != "env" ]; then
    ENV_VARS="${ENV_VARS},SECRET_NAME=${SECRET_NAME}"
fi

# ======================
# Deploy with Revision Tag
# ======================
echo -e "${GREEN}Deploying to Cloud Run with tag: ${REVISION_TAG}...${NC}"

# Build base deployment command
BASE_DEPLOY_CMD="gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:${REVISION_TAG} \
    --region ${REGION} \
    --platform managed \
    --service-account ${SERVICE_ACCOUNT} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 80 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --port 8080 \
    --set-env-vars ${ENV_VARS} \
    --add-cloudsql-instances ${CLOUD_SQL_INSTANCE} \
    --vpc-connector ${VPC_CONNECTOR} \
    --vpc-egress private-ranges-only \
    --tag ${REVISION_TAG}"

# Handle traffic splitting based on revision tag
case "${REVISION_TAG}" in
    green-test)
        # Deploy with no traffic (preview only)
        echo -e "${YELLOW}Deploying green-test with 0% traffic (preview)${NC}"
        eval "${BASE_DEPLOY_CMD} --no-traffic"
        ;;
    green-deploy)
        # Deploy with tag, then split traffic: 10% to green-deploy, 90% to blue-prod
        echo -e "${YELLOW}Deploying green-deploy with 10% canary traffic${NC}"
        eval "${BASE_DEPLOY_CMD}"
        echo -e "${GREEN}Updating traffic split: 10% green-deploy, 90% blue-prod${NC}"
        gcloud run services update-traffic ${SERVICE_NAME} \
            --region ${REGION} \
            --to-tags green-deploy=10,blue-prod=90
        ;;
    blue-prod)
        # Deploy with tag, then route 100% traffic to blue-prod
        echo -e "${GREEN}Deploying blue-prod with 100% production traffic${NC}"
        eval "${BASE_DEPLOY_CMD}"
        echo -e "${GREEN}Updating traffic split: 100% blue-prod${NC}"
        gcloud run services update-traffic ${SERVICE_NAME} \
            --region ${REGION} \
            --to-tags blue-prod=100
        ;;
    *)
        echo -e "${RED}Unknown revision tag: ${REVISION_TAG}${NC}"
        exit 1
        ;;
esac

# ======================
# Output
# ======================
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region "${REGION}" \
    --format="value(status.url)")

# Get revision URL for tagged revision
# Note: Tags in Cloud Run are separate from revision names, so we get the latest revision
# which should be the one we just deployed with the tag
REVISION_URL=$(gcloud run revisions list \
    --service "${SERVICE_NAME}" \
    --region "${REGION}" \
    --limit 1 \
    --format="value(status.url)" 2>/dev/null || echo "")

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "Service URL      : ${SERVICE_URL}"
if [ -n "${REVISION_URL}" ]; then
    echo "Revision URL     : ${REVISION_URL}"
fi
echo "Revision Tag     : ${REVISION_TAG}"
echo "Traffic          : ${TRAFFIC_PERCENT}%"
echo "Secret           : ${SECRET_NAME}"
echo ""

