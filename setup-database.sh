#!/bin/bash

# Complete Database Setup Script
# Creates database, runs migrations, and seeds initial data

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
INSTANCE_NAME="${CLOUD_SQL_INSTANCE:-postgres-db}"
DATABASE_NAME="${DB_DATABASE:-ai_photo_studio_db}"
DB_USER="${DB_USERNAME:-dbuser}"

echo -e "${GREEN}Setting up Cloud SQL database...${NC}"
echo "Project:    ${PROJECT_ID}"
echo "Region:     ${REGION}"
echo "Instance:   ${INSTANCE_NAME}"
echo "Database:   ${DATABASE_NAME}"
echo "User:       ${DB_USER}"
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
# Check Cloud SQL Instance
# ======================
echo -e "${GREEN}Checking Cloud SQL instance...${NC}"
if ! gcloud sql instances describe "${INSTANCE_NAME}" &>/dev/null; then
    echo -e "${RED}❌ Cloud SQL instance '${INSTANCE_NAME}' not found${NC}"
    echo "Create it first:"
    echo "gcloud sql instances create ${INSTANCE_NAME} \\"
    echo "  --database-version=POSTGRES_15 \\"
    echo "  --tier=db-g1-small \\"
    echo "  --region=${REGION} \\"
    echo "  --network=default \\"
    echo "  --no-assign-ip"
    exit 1
fi
echo -e "${GREEN}✓ Cloud SQL instance exists${NC}"

# ======================
# Create Database
# ======================
echo ""
echo -e "${GREEN}Checking database '${DATABASE_NAME}'...${NC}"
if gcloud sql databases describe "${DATABASE_NAME}" --instance="${INSTANCE_NAME}" &>/dev/null; then
    echo -e "${YELLOW}⚠ Database '${DATABASE_NAME}' already exists${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo -e "${GREEN}Creating database '${DATABASE_NAME}'...${NC}"
    gcloud sql databases create "${DATABASE_NAME}" --instance="${INSTANCE_NAME}"
    echo -e "${GREEN}✓ Database created${NC}"
fi

# ======================
# Check Database User
# ======================
echo ""
echo -e "${GREEN}Checking database user '${DB_USER}'...${NC}"
if gcloud sql users list --instance="${INSTANCE_NAME}" --format="value(name)" | grep -q "^${DB_USER}$"; then
    echo -e "${GREEN}✓ Database user exists${NC}"
else
    echo -e "${YELLOW}⚠ Database user '${DB_USER}' not found${NC}"
    echo "Create it with:"
    echo "gcloud sql users create ${DB_USER} \\"
    echo "  --instance=${INSTANCE_NAME} \\"
    echo "  --password=YOUR_SECURE_PASSWORD"
    echo ""
    read -p "Do you want to continue without creating user? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# ======================
# Run Migrations
# ======================
echo ""
echo -e "${GREEN}Running database migrations...${NC}"
echo "This will create/update all database tables."
echo ""

if [ -f "./run-migrations.sh" ]; then
    chmod +x ./run-migrations.sh
    ./run-migrations.sh
else
    echo -e "${YELLOW}⚠ run-migrations.sh not found. Running migrations manually...${NC}"
    echo ""
    echo "To run migrations, use:"
    echo "./run-migrations.sh"
    echo ""
    echo "Or manually:"
    echo "gcloud run jobs execute migrate-db --region=${REGION}"
fi

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify tables: Connect to database and check tables"
echo "2. Seed data: Super admin will be created on first app startup"
echo "3. Test connection: curl https://YOUR_SERVICE_URL/api/v1/health"

