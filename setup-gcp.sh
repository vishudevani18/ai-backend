#!/bin/bash

# Complete GCP Setup Script
# Automates all GCP infrastructure setup, deployment, and database initialization

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ======================
# Configuration
# ======================
PROJECT_ID="${GCP_PROJECT_ID:-ai-photo-studio-18}"
REGION="${GCP_REGION:-asia-south1}"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GCP Complete Setup Automation       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo ""

# ======================
# Preconditions
# ======================
if ! command -v gcloud &>/dev/null; then
    echo -e "${RED}❌ gcloud CLI not installed${NC}"
    echo "Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

gcloud config set project "${PROJECT_ID}" >/dev/null

# ======================
# Menu
# ======================
echo -e "${GREEN}What would you like to do?${NC}"
echo ""
echo "1. Complete Setup (Infrastructure + Deploy + Migrations)"
echo "2. Infrastructure Only (Cloud SQL, Storage, VPC, etc.)"
echo "3. Deploy Application Only"
echo "4. Run Database Migrations Only"
echo "5. Setup Database (Create DB + Run Migrations)"
echo "6. Verify Setup"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo -e "${GREEN}Running complete setup...${NC}"
        STEP_INFRA=true
        STEP_DEPLOY=true
        STEP_MIGRATE=true
        ;;
    2)
        echo -e "${GREEN}Setting up infrastructure only...${NC}"
        STEP_INFRA=true
        ;;
    3)
        echo -e "${GREEN}Deploying application only...${NC}"
        STEP_DEPLOY=true
        ;;
    4)
        echo -e "${GREEN}Running migrations only...${NC}"
        STEP_MIGRATE=true
        ;;
    5)
        echo -e "${GREEN}Setting up database only...${NC}"
        STEP_DB_SETUP=true
        ;;
    6)
        echo -e "${GREEN}Verifying setup...${NC}"
        STEP_VERIFY=true
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# ======================
# Step 1: Infrastructure Setup
# ======================
if [ "${STEP_INFRA}" = "true" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step 1: Infrastructure Setup${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Enable APIs
    echo -e "${GREEN}Enabling required APIs...${NC}"
    gcloud services enable \
        run.googleapis.com \
        sqladmin.googleapis.com \
        artifactregistry.googleapis.com \
        secretmanager.googleapis.com \
        vpcaccess.googleapis.com \
        cloudbuild.googleapis.com \
        storage.googleapis.com \
        --quiet
    
    # Artifact Registry
    echo -e "${GREEN}Checking Artifact Registry...${NC}"
    if ! gcloud artifacts repositories describe backend-repo --location="${REGION}" &>/dev/null; then
        gcloud artifacts repositories create backend-repo \
            --repository-format=docker \
            --location="${REGION}"
        echo -e "${GREEN}✓ Artifact Registry created${NC}"
    else
        echo -e "${GREEN}✓ Artifact Registry exists${NC}"
    fi
    
    # Cloud Storage
    echo -e "${GREEN}Checking Cloud Storage bucket...${NC}"
    BUCKET_NAME="${PROJECT_ID}-app-storage"
    if ! gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
        gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${BUCKET_NAME}"
        echo -e "${GREEN}✓ Cloud Storage bucket created${NC}"
    else
        echo -e "${GREEN}✓ Cloud Storage bucket exists${NC}"
    fi
    
    # VPC Connector
    echo -e "${GREEN}Checking VPC Connector...${NC}"
    if ! gcloud compute networks vpc-access connectors describe vpc-connector \
        --region="${REGION}" &>/dev/null; then
        gcloud compute networks vpc-access connectors create vpc-connector \
            --region="${REGION}" \
            --subnet=default \
            --min-instances=0 \
            --max-instances=2 \
            --machine-type=e2-micro
        echo -e "${GREEN}✓ VPC Connector created${NC}"
    else
        echo -e "${GREEN}✓ VPC Connector exists${NC}"
    fi
    
    # Cloud SQL (check only, creation is manual)
    echo -e "${GREEN}Checking Cloud SQL instance...${NC}"
    if gcloud sql instances describe postgres-db &>/dev/null; then
        echo -e "${GREEN}✓ Cloud SQL instance exists${NC}"
    else
        echo -e "${YELLOW}⚠ Cloud SQL instance not found${NC}"
        echo "Create it manually:"
        echo "gcloud sql instances create postgres-db \\"
        echo "  --database-version=POSTGRES_15 \\"
        echo "  --tier=db-g1-small \\"
        echo "  --region=${REGION} \\"
        echo "  --network=default \\"
        echo "  --no-assign-ip"
    fi
    
    echo -e "${GREEN}✓ Infrastructure setup complete${NC}"
fi

# ======================
# Step 2: Deploy Application
# ======================
if [ "${STEP_DEPLOY}" = "true" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step 2: Deploy Application${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "./deploy.sh" ]; then
        chmod +x ./deploy.sh
        AUTO_RUN_MIGRATIONS=false ./deploy.sh
    else
        echo -e "${RED}❌ deploy.sh not found${NC}"
        exit 1
    fi
fi

# ======================
# Step 3: Database Setup
# ======================
if [ "${STEP_DB_SETUP}" = "true" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step 3: Database Setup${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "./setup-database.sh" ]; then
        chmod +x ./setup-database.sh
        ./setup-database.sh
    else
        echo -e "${YELLOW}⚠ setup-database.sh not found. Running migrations only...${NC}"
        STEP_MIGRATE=true
    fi
fi

# ======================
# Step 4: Run Migrations
# ======================
if [ "${STEP_MIGRATE}" = "true" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step 4: Run Database Migrations${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "./run-migrations.sh" ]; then
        chmod +x ./run-migrations.sh
        ./run-migrations.sh
    else
        echo -e "${RED}❌ run-migrations.sh not found${NC}"
        exit 1
    fi
fi

# ======================
# Step 5: Verify Setup
# ======================
if [ "${STEP_VERIFY}" = "true" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step 5: Verify Setup${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "./verify-gcp-setup.sh" ]; then
        chmod +x ./verify-gcp-setup.sh
        ./verify-gcp-setup.sh
    else
        echo -e "${YELLOW}⚠ verify-gcp-setup.sh not found${NC}"
    fi
fi

# ======================
# Summary
# ======================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SERVICE_URL=$(gcloud run services describe saas-backend \
    --region="${REGION}" \
    --format="value(status.url)" 2>/dev/null || echo "")

if [ -n "${SERVICE_URL}" ]; then
    echo "Service URL: ${SERVICE_URL}"
    echo "Health Check: ${SERVICE_URL}/api/v1/health"
    echo "Swagger Docs: ${SERVICE_URL}/api/v1/docs"
    echo ""
fi

echo "Useful commands:"
echo "  View logs: gcloud logging read \"resource.type=cloud_run_revision\" --limit=50"
echo "  Run migrations: ./run-migrations.sh"
echo "  Redeploy: ./deploy.sh"
echo "  Verify setup: ./verify-gcp-setup.sh"

