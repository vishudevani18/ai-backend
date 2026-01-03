#!/bin/bash

# Grant Vertex AI permissions to Cloud Run service account
# This fixes the 403 Permission Denied error when calling Vertex AI from Cloud Run

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-ai-photo-studio-18}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-saas-backend}"

echo -e "${GREEN}Granting Vertex AI permissions to Cloud Run service account...${NC}"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Get the service account used by Cloud Run
echo -e "${YELLOW}Fetching Cloud Run service account...${NC}"
SERVICE_ACCOUNT=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="value(spec.template.spec.serviceAccountName)" 2>/dev/null || echo "")

# If no custom service account, use default Compute Engine service account
if [ -z "$SERVICE_ACCOUNT" ]; then
  PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo -e "${YELLOW}No custom service account found. Using default: ${SERVICE_ACCOUNT}${NC}"
else
  echo -e "${GREEN}Found service account: ${SERVICE_ACCOUNT}${NC}"
fi

# Also check for the custom service account that deploy.sh creates
CUSTOM_SA="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"
if [ "$SERVICE_ACCOUNT" != "$CUSTOM_SA" ]; then
  echo -e "${YELLOW}Note: Your deploy script uses: ${CUSTOM_SA}${NC}"
  echo -e "${YELLOW}If Cloud Run is using this account, we'll grant permissions to both.${NC}"
fi

# Grant Vertex AI User role to the service account Cloud Run is using
echo ""
echo -e "${YELLOW}Granting 'Vertex AI User' role to: ${SERVICE_ACCOUNT}${NC}"
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user" \
  --condition=None

# Also grant to custom service account if different
if [ "$SERVICE_ACCOUNT" != "$CUSTOM_SA" ]; then
  echo ""
  echo -e "${YELLOW}Also granting 'Vertex AI User' role to: ${CUSTOM_SA}${NC}"
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${CUSTOM_SA}" \
    --role="roles/aiplatform.user" \
    --condition=None
fi

# Enable Vertex AI API if not already enabled
echo ""
echo -e "${YELLOW}Checking if Vertex AI API is enabled...${NC}"
if ! gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" | grep -q aiplatform; then
  echo -e "${YELLOW}Enabling Vertex AI API...${NC}"
  gcloud services enable aiplatform.googleapis.com --project=${PROJECT_ID}
  echo -e "${GREEN}✓ Vertex AI API enabled${NC}"
else
  echo -e "${GREEN}✓ Vertex AI API is already enabled${NC}"
fi

echo ""
echo -e "${GREEN}✅ Successfully granted Vertex AI permissions!${NC}"
echo ""
echo -e "${YELLOW}Verifying permissions...${NC}"
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT} AND bindings.role:roles/aiplatform.user" \
  --format="table(bindings.role)" || echo -e "${RED}⚠️  Could not verify permissions. Please check manually.${NC}"

echo ""
echo -e "${YELLOW}Note: IAM changes may take up to 60 seconds to propagate.${NC}"
echo -e "${YELLOW}Please wait a moment before testing your endpoint again.${NC}"

