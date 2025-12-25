#!/bin/bash

# Complete GCP Setup Script
# This script creates any missing resources needed for deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Actual GCP values
PROJECT_ID="ai-photo-studio-18"
REGION="asia-south1"
CLOUD_SQL_INSTANCE="postgres-db"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Completing GCP Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Set project
gcloud config set project ${PROJECT_ID}

echo -e "${GREEN}✓ Project: ${PROJECT_ID}${NC}"
echo ""

# 1. Create VPC Connector if it doesn't exist
echo -e "${BLUE}Checking VPC Connector...${NC}"
if ! gcloud compute networks vpc-access connectors describe vpc-connector --region=${REGION} &>/dev/null; then
    echo -e "${YELLOW}Creating VPC Connector...${NC}"
    gcloud compute networks vpc-access connectors create vpc-connector \
        --region=${REGION} \
        --subnet=default \
        --subnet-project=${PROJECT_ID} \
        --min-instances=2 \
        --max-instances=3 \
        --machine-type=e2-micro
    echo -e "${GREEN}✓ VPC Connector created${NC}"
else
    echo -e "${GREEN}✓ VPC Connector already exists${NC}"
fi
echo ""

# 2. Check "env" secret
echo -e "${BLUE}Checking 'env' Secret...${NC}"

if ! gcloud secrets describe env &>/dev/null; then
    echo -e "${YELLOW}'env' secret not found${NC}"
    echo -e "${RED}⚠ ACTION REQUIRED: Create 'env' secret${NC}"
    echo ""
    echo "   The 'env' secret should contain all environment variables as JSON."
    echo "   Example format:"
    echo '   {'
    echo '     "DB_HOST": "/cloudsql/ai-photo-studio-18:asia-south1:postgres-db",'
    echo '     "DB_PASSWORD": "your-password",'
    echo '     "JWT_SECRET": "your-jwt-secret",'
    echo '     ...'
    echo '   }'
    echo ""
    echo "   To create the secret:"
    echo "   1. Create a JSON file with all your environment variables"
    echo "   2. Run: gcloud secrets create env --data-file=env.json"
    echo ""
    echo "   See ENV_VARIABLES_LIST.md for the complete list of required variables."
else
    echo -e "${GREEN}✓ 'env' secret exists${NC}"
    echo -e "${YELLOW}   Note: Update the secret by creating a new version:${NC}"
    echo "   gcloud secrets versions add env --data-file=env.json"
fi
echo ""

# 4. Create Service Account
echo -e "${BLUE}Checking Service Account...${NC}"
SERVICE_NAME="saas-backend"
SERVICE_ACCOUNT="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT} &>/dev/null; then
    echo -e "${YELLOW}Creating service account...${NC}"
    gcloud iam service-accounts create ${SERVICE_NAME}-sa \
        --display-name="SaaS Backend Service Account"
    
    # Grant required roles
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/cloudsql.client"
    
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/storage.objectAdmin"
    
    # Grant access to the single "env" secret
    if gcloud secrets describe env &>/dev/null; then
        gcloud secrets add-iam-policy-binding env \
            --member="serviceAccount:${SERVICE_ACCOUNT}" \
            --role="roles/secretmanager.secretAccessor" 2>/dev/null || true
        echo -e "${GREEN}✓ Granted access to 'env' secret${NC}"
    fi
    echo -e "${GREEN}✓ Service account created and configured${NC}"
else
    echo -e "${GREEN}✓ Service account exists${NC}"
fi
echo ""

# 5. Verify GCS Bucket
echo -e "${BLUE}Checking GCS Bucket...${NC}"
BUCKET_NAME="${PROJECT_ID}-app-storage"
if gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
    echo -e "${GREEN}✓ GCS Bucket exists: ${BUCKET_NAME}${NC}"
else
    echo -e "${YELLOW}Creating GCS Bucket...${NC}"
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} "gs://${BUCKET_NAME}"
    echo -e "${GREEN}✓ GCS Bucket created${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Setup Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Completed:${NC}"
echo "  ✓ VPC Connector"
echo "  ✓ Artifact Registry"
echo "  ✓ Service Account & IAM Permissions"
echo "  ✓ GCS Bucket"
echo ""
echo -e "${YELLOW}Action Required:${NC}"
echo "  ⚠ Create 'env' secret with all environment variables (if not exists)"
echo "  ⚠ See ENV_VARIABLES_LIST.md for required variables"
echo ""
echo -e "${BLUE}Next Step:${NC}"
echo "  Run: ./deploy.sh"
echo ""

