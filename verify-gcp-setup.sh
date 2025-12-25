#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GCP Setup Verification (Final)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Project & region
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="asia-south1"

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ No GCP project set${NC}"
  echo "Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo -e "${GREEN}✓ Project:${NC} ${PROJECT_ID}"
echo ""

# Authentication
echo -e "${BLUE}Checking authentication...${NC}"
gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .
echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Cloud SQL
echo -e "${BLUE}Checking Cloud SQL...${NC}"
INSTANCE=$(gcloud sql instances list \
  --filter="name:postgres-db AND region:${REGION}" \
  --format="value(name)")

if [ -z "$INSTANCE" ]; then
  echo -e "${RED}❌ Cloud SQL instance not found${NC}"
else
  echo -e "${GREEN}✓ Cloud SQL instance exists${NC}"

  gcloud sql databases list --instance=postgres-db \
    --filter="name:ai_photo_studio_db" \
    --format="value(name)" | grep -q . \
    && echo -e "${GREEN}✓ Database exists${NC}" \
    || echo -e "${YELLOW}⚠ Database missing${NC}"

  gcloud sql users list --instance=postgres-db \
    --filter="name:dbuser" \
    --format="value(name)" | grep -q . \
    && echo -e "${GREEN}✓ DB user exists${NC}" \
    || echo -e "${YELLOW}⚠ DB user missing${NC}"
fi
echo ""

# GCS Bucket
echo -e "${BLUE}Checking GCS bucket...${NC}"
BUCKET_NAME="${PROJECT_ID}-app-storage"

if gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
    echo -e "${GREEN}✓ Bucket exists: ${BUCKET_NAME}${NC}"
    
    CORS_CONFIG=$(gsutil cors get "gs://${BUCKET_NAME}" 2>/dev/null || echo "[]")
    if [ "$CORS_CONFIG" = "[]" ]; then
        echo -e "${YELLOW}  ⚠ CORS not configured${NC}"
    else
        echo -e "${GREEN}  ✓ CORS configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Bucket not found: ${BUCKET_NAME}${NC}"
    echo "   Run: gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${BUCKET_NAME}"
fi
echo ""

# Artifact Registry
echo -e "${BLUE}Checking Artifact Registry...${NC}"
ARTIFACT_REGISTRY="backend-repo"
if gcloud artifacts repositories describe ${ARTIFACT_REGISTRY} --location=${REGION} &>/dev/null; then
    echo -e "${GREEN}✓ Artifact Registry exists${NC}"
else
    echo -e "${RED}❌ Artifact Registry missing${NC}"
    echo "   Run: gcloud artifacts repositories create ${ARTIFACT_REGISTRY} --repository-format=docker --location=${REGION}"
fi
echo ""


# VPC Connector
echo -e "${BLUE}Checking VPC Connector...${NC}"
gcloud compute networks vpc-access connectors list \
  --region=${REGION} \
  --filter="name:vpc-connector" \
  --format="value(name)" | grep -q . \
  && echo -e "${GREEN}✓ VPC Connector exists${NC}" \
  || echo -e "${RED}❌ VPC Connector missing${NC}"
echo ""

# Secrets
echo -e "${BLUE}Checking 'env' secret...${NC}"
if gcloud secrets describe "env" &>/dev/null; then
  echo -e "${GREEN}✓ 'env' secret exists${NC}"
  
  # Check if secret has a version
  VERSION_COUNT=$(gcloud secrets versions list "env" --format="value(name)" 2>/dev/null | wc -l)
  if [ "$VERSION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}  ✓ Secret has ${VERSION_COUNT} version(s)${NC}"
  else
    echo -e "${YELLOW}  ⚠ Secret exists but has no versions${NC}"
  fi
else
  echo -e "${RED}❌ Missing secret: env${NC}"
  echo "   Create it with: gcloud secrets create env --data-file=env.json"
  echo "   See ENV_VARIABLES_LIST.md for required variables"
fi
echo ""

# IAM
echo -e "${BLUE}Checking IAM...${NC}"
PN=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
SA="${PN}-compute@developer.gserviceaccount.com"
echo -e "${GREEN}✓ Service account:${NC} ${SA}"

gcloud projects get-iam-policy "$PROJECT_ID" \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SA} AND bindings.role:roles/storage.objectAdmin" \
  --format="value(bindings.role)" | grep -q . \
  && echo -e "${GREEN}✓ Storage access OK${NC}" \
  || echo -e "${YELLOW}⚠ Storage access missing${NC}"

# Check service account for Cloud Run (saas-backend-sa)
SERVICE_ACCOUNT="saas-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"
if gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" &>/dev/null; then
  echo -e "${GREEN}✓ Cloud Run service account exists${NC}"
  
  # Check secret access for the service account
  gcloud secrets get-iam-policy "env" 2>/dev/null | grep -q "${SERVICE_ACCOUNT}" \
    && echo -e "${GREEN}✓ 'env' secret access granted to service account${NC}" \
    || echo -e "${YELLOW}⚠ 'env' secret access not granted to service account${NC}"
else
  echo -e "${YELLOW}⚠ Cloud Run service account not found${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Verification finished – results are reliable${NC}"
echo -e "${BLUE}========================================${NC}"
