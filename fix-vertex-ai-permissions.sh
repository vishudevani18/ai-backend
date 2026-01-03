#!/bin/bash

# Quick fix script for Vertex AI permissions
# This script grants permissions to the correct service account used by Cloud Run

set -e

PROJECT_ID="ai-photo-studio-18"
REGION="asia-south1"
SERVICE_NAME="saas-backend"

# The service account that deploy.sh creates and uses
SERVICE_ACCOUNT="${SERVICE_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=========================================="
echo "Fixing Vertex AI Permissions"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Service Account: ${SERVICE_ACCOUNT}"
echo ""

# Step 1: Enable Vertex AI API
echo "Step 1: Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com --project=${PROJECT_ID} || echo "API may already be enabled"
echo "✓ Done"
echo ""

# Step 2: Grant Vertex AI User role
echo "Step 2: Granting 'Vertex AI User' role..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"
echo "✓ Done"
echo ""

# Step 3: Verify
echo "Step 3: Verifying permissions..."
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)" | grep -i aiplatform || echo "⚠️  Could not find aiplatform role (may need to wait for propagation)"

echo ""
echo "=========================================="
echo "✅ Permissions granted!"
echo "=========================================="
echo ""
echo "Wait 30-60 seconds for IAM changes to propagate, then test your endpoint."
echo ""
echo "If it still doesn't work, check:"
echo "1. Cloud Run service is using: ${SERVICE_ACCOUNT}"
echo "2. Vertex AI API is enabled in project"
echo "3. Wait a bit longer for IAM propagation"
echo ""

