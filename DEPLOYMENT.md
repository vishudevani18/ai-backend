# Deployment Guide

## Overview

This project uses **GitHub Actions** for automated CI/CD deployment to Google Cloud Run. The deployment process is fully automated and handles branch-based deployments with traffic splitting.

## Deployment Architecture

- **Single Cloud Run Service**: `saas-backend`
- **Revision Tags**:
  - `green-test` (preview, 0% traffic)
  - `green-deploy` (canary, 10% traffic)
  - `blue-prod` (production, 100% traffic)
- **Secret Management**: Uses GCP Secret Manager (`test-env` for green-test, `env` for others)

## Quick Start

### Automated Deployment via GitHub Actions

Deployments are automatically triggered when you push to specific branches:

1. **Push to `green-test`** → Deploys with 0% traffic (preview)
2. **Push to `green-deploy`** → Deploys with 10% canary traffic
3. **Push to `blue-prod`** → Deploys with 100% production traffic

### Manual Deployment (if needed)

If you need to deploy manually, use the deployment script:

```bash
cd deploy
chmod +x deploy.sh
./deploy.sh
```

Set the following environment variables:
- `REVISION_TAG` (green-test, green-deploy, or blue-prod)
- `SECRET_NAME` (test-env for green-test, env for others)
- `DEPLOYMENT_REVISION` (same as REVISION_TAG)
- `GCP_PROJECT_ID`, `GCP_REGION`, `SERVICE_NAME`, etc.

## Prerequisites

### GCP Setup

1. **Enable Required APIs**:
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  aiplatform.googleapis.com
```

2. **Create Artifact Registry**:
```bash
gcloud artifacts repositories create backend-repo \
  --repository-format=docker \
  --location=asia-south1
```

3. **Create Cloud SQL Instance** (if not exists):
```bash
gcloud sql instances create postgres-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=asia-south1 \
  --network=default \
  --no-assign-ip
```

4. **Create Database and User**:
```bash
gcloud sql databases create ai_photo_studio_db --instance=postgres-db
gcloud sql users create dbuser \
  --instance=postgres-db \
  --password=YOUR_SECURE_PASSWORD
```

5. **Create VPC Connector**:
```bash
gcloud compute networks vpc-access connectors create vpc-connector \
  --region=asia-south1 \
  --subnet=default \
  --min-instances=0 \
  --max-instances=2 \
  --machine-type=e2-micro
```

6. **Create Service Account**:
```bash
gcloud iam service-accounts create saas-backend-sa \
  --display-name="Cloud Run Backend Service Account"

# Grant required roles
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

7. **Create Secrets in Secret Manager**:
   - `env` secret: Production environment variables (JSON format)
   - `test-env` secret: Test environment variables (JSON format)

   Grant access to service account:
```bash
gcloud secrets add-iam-policy-binding env \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding test-env \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## GitHub Actions Setup

### Required Secrets

Configure the following secrets in GitHub (Settings → Secrets and variables → Actions):

- `GCP_PROJECT_ID`: Google Cloud project ID
- `GCP_REGION`: Deployment region (e.g., `asia-south1`)
- `ARTIFACT_REGISTRY_REPO`: Artifact Registry repo name (e.g., `backend-repo`)
- `SERVICE_NAME`: Cloud Run service name (e.g., `saas-backend`)
- `CLOUD_SQL_INSTANCE`: Cloud SQL instance connection string
- `VPC_CONNECTOR`: VPC connector name (e.g., `vpc-connector`)
- `GCS_BUCKET`: GCS bucket name
- `GCP_SERVICE_ACCOUNT_KEY`: Base64-encoded service account JSON key

### Authentication

The workflow uses service account authentication. You can either:
1. Use a service account key (stored in `GCP_SERVICE_ACCOUNT_KEY` secret)
2. Use Workload Identity Federation (recommended for production)

## Deployment Flow

### 1. Green-Test (Preview)
- Triggered by: Push to `green-test` branch
- Traffic: 0% (preview only)
- Secret: `test-env`
- Purpose: QA and validation without affecting users

### 2. Green-Deploy (Canary)
- Triggered by: Push to `green-deploy` branch
- Traffic: 10% (90% stays on blue-prod)
- Secret: `env`
- Purpose: Real user traffic testing with easy rollback

### 3. Blue-Prod (Production)
- Triggered by: Push to `blue-prod` branch
- Traffic: 100%
- Secret: `env`
- Purpose: Full production rollout

## Environment Variables

All environment variables are loaded from GCP Secret Manager at runtime. The secrets should contain:

- Database credentials (`DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`)
- JWT secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`)
- Storage configuration (`GCS_BUCKET_NAME`, `GCS_PROJECT_ID`)
- API keys (`GEMINI_API_KEY`, etc.)
- Other application configuration

See `ENV_VARIABLES_LIST.md` for the complete list.

## Verification

After deployment, verify the service:

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe saas-backend \
  --region asia-south1 \
  --format="value(status.url)")

# Test health endpoint
curl ${SERVICE_URL}/api/v1/health

# Check Swagger docs
open ${SERVICE_URL}/api/v1/docs
```

## Troubleshooting

### Service won't start
- Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 50`
- Verify secrets are accessible: Check IAM permissions on secrets
- Verify database connectivity: Check Cloud SQL instance and VPC connector

### Database connection errors
- Verify `DB_HOST` uses Unix socket format: `/cloudsql/PROJECT:REGION:INSTANCE`
- Check VPC connector is working
- Verify service account has `roles/cloudsql.client` role

### Secret loading errors
- Verify secret exists: `gcloud secrets list`
- Check service account has `roles/secretmanager.secretAccessor` on the secret
- Verify `SECRET_NAME` environment variable is set correctly

## Security Notes

- ✅ All secrets are loaded at runtime from Secret Manager (never in Docker image)
- ✅ Service account uses least-privilege IAM roles
- ✅ No secrets in GitHub Actions logs
- ✅ Traffic splitting allows safe rollback

## Cost Optimization

- Cloud Run scales to zero when not in use
- Minimum instances set to 0 for cost savings
- Database uses `db-g1-small` tier
- VPC connector uses `e2-micro` with min-instances=0

Estimated monthly cost: ₹900-₹2,000 (India region)
