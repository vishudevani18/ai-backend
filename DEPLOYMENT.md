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

8. **Set Up Workload Identity Federation (One-Time Setup for All Services)**

This setup creates a shared WIF pool that can be used by all three services (backend, admin panel, webapp). You only need to do this once.

**Important:** There are two different service accounts:
- `saas-backend-sa@...` - Used by Cloud Run at runtime (already created above, **DO NOT DELETE**)
- `github-deployer@...` - New service account for GitHub Actions deployments (create below)

#### Step 1: Get Project Number

```bash
# Get project number (needed for IAM bindings)
PROJECT_NUMBER=$(gcloud projects describe ai-photo-studio-18 --format="value(projectNumber)")
echo "Project Number: ${PROJECT_NUMBER}"
```

#### Step 2: Create Shared Workload Identity Pool

```bash
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool (Shared)" \
  --project="ai-photo-studio-18"
```

#### Step 3: Create Shared OIDC Provider

```bash
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository!=null" \
  --project="ai-photo-studio-18"
```

**Note:** 
- We only map `attribute.repository` (not `attribute.ref`) since we're not enforcing branch-based restrictions
- The `attribute-condition="assertion.repository!=null"` adds an extra security layer by requiring repository information
- This allows any branch/tag/PR from the authorized repository to authenticate, which is appropriate for our use case

#### Step 4: Create Service Account for GitHub Actions

```bash
# Create new service account for GitHub Actions deployments
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer (Shared)" \
  --project="ai-photo-studio-18"

# Grant required roles for deployments
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

#### Step 5: Get WIF Provider Resource Name

```bash
# Get the full resource name for GitHub secrets
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --project="ai-photo-studio-18" \
  --format="value(name)"
```

This will output something like: `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

Save this value - you'll need it for GitHub secrets.

#### Step 6: Bind GitHub Repositories to Service Account

For each repository (backend, admin panel, webapp), bind the repository to the shared service account:

**Replace `YOUR_ORG/REPO_NAME` with your actual repository paths.**

```bash
# Backend repository
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_ORG/ai-backend" \
  --project="ai-photo-studio-18"

# Admin panel repository (replace YOUR_ORG/admin-panel with actual repo)
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_ORG/admin-panel" \
  --project="ai-photo-studio-18"

# Webapp repository (replace YOUR_ORG/webapp with actual repo)
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_ORG/webapp" \
  --project="ai-photo-studio-18"
```

**Example:** If your GitHub organization is `mycompany` and repositories are `mycompany/ai-backend`, `mycompany/admin-panel`, and `mycompany/webapp`, use:
- `mycompany/ai-backend`
- `mycompany/admin-panel`
- `mycompany/webapp`

## GitHub Actions Setup

### Workload Identity Federation (WIF) Authentication

This project uses **Workload Identity Federation (WIF)** for secure, keyless authentication to Google Cloud Platform. This is the recommended approach that eliminates the need for long-lived service account keys.

**Benefits:**
- ✅ No service account keys to manage
- ✅ Automatic credential rotation
- ✅ Short-lived access tokens
- ✅ Shared setup across all services (backend, admin panel, webapp)

### Required Secrets

Configure the following secrets in GitHub (Settings → Secrets and variables → Actions):

**Shared Secrets** (same value for all repositories - backend, admin panel, webapp):
- `WIF_PROVIDER`: Workload Identity Provider resource name (e.g., `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider`)
- `WIF_SERVICE_ACCOUNT`: Service account email for impersonation (e.g., `github-deployer@ai-photo-studio-18.iam.gserviceaccount.com`)

**Service-Specific Secrets** (different per service):
- `GCP_PROJECT_ID`: Google Cloud project ID (e.g., `ai-photo-studio-18`)
- `GCP_REGION`: Deployment region (e.g., `asia-south1`)
- `ARTIFACT_REGISTRY_REPO`: Artifact Registry repo name (e.g., `backend-repo`, `admin-repo`, `webapp-repo`)
- `SERVICE_NAME`: Cloud Run service name (e.g., `saas-backend`, `admin-panel`, `webapp`)
- `CLOUD_SQL_INSTANCE`: Cloud SQL instance connection string
- `VPC_CONNECTOR`: VPC connector name (e.g., `vpc-connector`)
- `GCS_BUCKET`: GCS bucket name

**Note:** The old `GCP_SERVICE_ACCOUNT_KEY` secret is no longer needed and should be removed after WIF is set up and tested.

### Adding Additional Repositories

To add a new repository (e.g., admin panel or webapp) to the existing WIF setup:

1. **Add IAM binding for the new repository:**
   ```bash
   # Replace YOUR_ORG/NEW_REPO with actual repository path
   gcloud iam service-accounts add-iam-policy-binding \
     github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_ORG/NEW_REPO" \
     --project="ai-photo-studio-18"
   ```

2. **Add GitHub secrets to the new repository:**
   - Go to the repository → Settings → Secrets and variables → Actions
   - Add `WIF_PROVIDER` (same value as other repositories)
   - Add `WIF_SERVICE_ACCOUNT` (same value as other repositories)
   - Add service-specific secrets (GCP_PROJECT_ID, GCP_REGION, ARTIFACT_REGISTRY_REPO, SERVICE_NAME, etc.)

3. **Use the same workflow authentication step:**
   ```yaml
   permissions:
     contents: read
     id-token: write
   
   steps:
     - name: Checkout code
       uses: actions/checkout@v4
   
     - name: Authenticate to Google Cloud (WIF)
       id: auth
       uses: google-github-actions/auth@v2
       with:
         workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
         service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
   
     - name: Set up Cloud SDK
       uses: google-github-actions/setup-gcloud@v2
   ```

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

## Cleanup: Remove Old Service Account Keys

**⚠️ IMPORTANT: Only perform cleanup AFTER WIF is working and tested!**

After successfully migrating to WIF and verifying deployments work, you can clean up the old service account key authentication.

### Step 1: Verify WIF is Working

1. Test a deployment with WIF authentication
2. Verify the deployment succeeds
3. Confirm no errors in GitHub Actions logs

### Step 2: List Existing Service Account Keys

Find which service account was used for GitHub Actions and list its keys:

```bash
# Option 1: If you used saas-backend-sa for GitHub Actions
gcloud iam service-accounts keys list \
  --iam-account=saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"

# Option 2: If you created a separate service account for deployments
# (check your GitHub secrets or GCP console to find the service account email)
gcloud iam service-accounts keys list \
  --iam-account=YOUR_DEPLOYMENT_SA@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"
```

### Step 3: Delete Service Account Keys

**⚠️ WARNING: Only delete keys that were used for GitHub Actions, NOT keys used by Cloud Run!**

```bash
# Delete a specific key by KEY_ID (from the list above)
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=SERVICE_ACCOUNT_EMAIL@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"
```

**⚠️ DO NOT delete keys if:**
- The service account is used by Cloud Run at runtime (`saas-backend-sa`)
- You're unsure which key is which
- The key might be used elsewhere

### Step 4: Remove GitHub Secrets

After confirming WIF works, remove the old secret from all repositories:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Delete the `GCP_SERVICE_ACCOUNT_KEY` secret
3. Repeat for all three repositories (backend, admin panel, webapp)

### Step 5: (Optional) Delete Old Deployment Service Account

**Only if you created a separate service account solely for GitHub Actions deployments:**

If you created a dedicated service account (not `saas-backend-sa`) just for GitHub Actions and it's no longer needed:

```bash
# First, verify it's not used anywhere else
gcloud projects get-iam-policy ai-photo-studio-18 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:OLD_DEPLOYMENT_SA@ai-photo-studio-18.iam.gserviceaccount.com"

# If confirmed unused, delete it
gcloud iam service-accounts delete OLD_DEPLOYMENT_SA@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"
```

**⚠️ DO NOT delete `saas-backend-sa`** - it's used by Cloud Run at runtime!

### What to Keep vs. Remove

**✅ KEEP (Do Not Delete):**
- Service Account `saas-backend-sa@...` (used by Cloud Run at runtime)
- IAM Roles on `saas-backend-sa` (all existing roles remain unchanged)
- All GCP Resources (Cloud Run, Cloud SQL, Artifact Registry, etc.)
- All GitHub Secrets except `GCP_SERVICE_ACCOUNT_KEY`

**❌ REMOVE (After WIF is Working):**
- Service Account Keys (any keys created for GitHub Actions authentication)
- GitHub Secret `GCP_SERVICE_ACCOUNT_KEY` (from all repositories)
- Old Deployment Service Account (only if separate and confirmed unused)

## Security Notes

- ✅ All secrets are loaded at runtime from Secret Manager (never in Docker image)
- ✅ Service account uses least-privilege IAM roles
- ✅ No secrets in GitHub Actions logs
- ✅ Traffic splitting allows safe rollback
- ✅ **Workload Identity Federation eliminates long-lived credentials**
- ✅ **Automatic credential rotation with short-lived tokens**
- ✅ **No service account keys to manage or rotate**

## Cost Optimization

- Cloud Run scales to zero when not in use
- Minimum instances set to 0 for cost savings
- Database uses `db-g1-small` tier
- VPC connector uses `e2-micro` with min-instances=0

Estimated monthly cost: ₹900-₹2,000 (India region)
