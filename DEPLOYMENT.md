## 🚀 Quick Start (Automated)

**For complete automated setup, use:**
```bash
./setup-gcp.sh
```

This interactive script will guide you through:
1. Infrastructure setup (Cloud SQL, Storage, VPC, etc.)
2. Application deployment
3. Database migrations
4. Verification

**For database setup only:**
```bash
./setup-database.sh
```

**For migrations only:**
```bash
./run-migrations.sh
```

---

## 📋 Manual Setup Steps

Step 1: Project & Region Setup
gcloud config set project ai-photo-studio-18
gcloud config set run/region asia-south1

Step 2: Enable Required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com

Step 3: Artifact Registry (Docker Images)

Container Registry (gcr.io) is deprecated.
Artifact Registry is required.

gcloud artifacts repositories create backend-repo \
  --repository-format=docker \
  --location=asia-south1

Step 4: Cloud SQL (PostgreSQL)

**Note**: Your instance `postgres-db` already exists. Skip creation if already done.

4.1 Create Instance (Private IP Only) - SKIP IF EXISTS
```bash
gcloud sql instances create postgres-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=asia-south1 \
  --network=default \
  --no-assign-ip
```

💰 Cost: ~₹600–₹800/month

db-g1-small is the cheapest reliable tier for production.

4.2 Create Database & App User - SKIP IF EXISTS

⚠️ Do NOT use postgres superuser in production

**Your existing setup:**
- Instance: `postgres-db`
- Database: `ai_photo_studio_db` ✅
- User: `dbuser` ✅

If creating new:
```bash
gcloud sql databases create ai_photo_studio_db --instance=postgres-db

gcloud sql users create dbuser \
  --instance=postgres-db \
  --password=STRONG_DB_PASSWORD
```

Save the password securely.

Step 5: Cloud Storage (Private Bucket)

**Note**: Your bucket `ai-photo-studio-18-app-storage` already exists. Skip if already done.

```bash
gsutil mb -p ai-photo-studio-18 -l asia-south1 gs://ai-photo-studio-18-app-storage
```

Storage Rules

❌ Bucket is NOT public

✅ Files accessed only via signed URLs

❌ No CDN (unnecessary for MVP)

Step 6: Serverless VPC Connector

**Note**: Your VPC connector `vpc-connector` already exists in `asia-south1`. Skip if already done.

Required for private Cloud SQL access.

```bash
gcloud compute networks vpc-access connectors create vpc-connector \
  --region=asia-south1 \
  --subnet=default \
  --min-instances=0 \
  --max-instances=2 \
  --machine-type=e2-micro
```

💰 Cost: ~₹80–₹150/month

Step 7: Dedicated Service Account (Security)

**Note**: Service account will be created automatically by `deploy.sh` if it doesn't exist.

Create a least-privilege service account for Cloud Run.

```bash
gcloud iam service-accounts create saas-backend-sa \
  --display-name="SaaS Backend Service Account"
```

Grant required roles:

```bash
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

**Important**: Secret access is granted per-secret (more secure), not at project level.

Step 8: Secret Manager - Single "env" Secret

**New Approach**: All environment variables are stored in a single "env" secret as JSON.

8.1 Create the "env" Secret

Create a JSON file with all your environment variables. See `ENV_VARIABLES_LIST.md` for the complete list.

Example `env.json`:
```json
{
  "NODE_ENV": "production",
  "PORT": "8080",
  "DB_HOST": "/cloudsql/ai-photo-studio-18:asia-south1:postgres-db",
  "DB_PORT": "5432",
  "DB_USERNAME": "dbuser",
  "DB_PASSWORD": "your-secure-db-password",
  "DB_DATABASE": "ai_photo_studio_db",
  "JWT_SECRET": "your-super-secure-jwt-secret-min-32-chars",
  "JWT_REFRESH_SECRET": "your-super-secure-refresh-secret-min-32-chars",
  "STORAGE_PROVIDER": "gcs",
  "GCS_BUCKET_NAME": "ai-photo-studio-18-app-storage",
  "GCS_PROJECT_ID": "ai-photo-studio-18",
  "GEMINI_API_KEY": "your-gemini-api-key"
}
```

Create the secret:
```bash
gcloud secrets create env --data-file=env.json
```

8.2 Update the Secret (When Needed)

To update environment variables, create a new version:
```bash
# Edit your env.json file
nano env.json

# Add new version
gcloud secrets versions add env --data-file=env.json
```

The application automatically fetches the latest version on startup.

**Benefits**:
- ✅ Single secret to manage
- ✅ Easy to update (just add new version)
- ✅ Version history for rollback
- ✅ All variables in one place

**Note**: The application fetches this secret at startup in production. No need to mount individual secrets.

Step 9: Build Docker Image

**Note**: This is handled automatically by `deploy.sh`. Manual build:

```bash
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/ai-photo-studio-18/backend-repo/saas-backend \
  --file Dockerfile.gcp
```

Step 10: Deploy to Cloud Run

**Recommended**: Use `./deploy.sh` which handles everything automatically.

**Auto-run migrations after deployment:**
```bash
AUTO_RUN_MIGRATIONS=true ./deploy.sh
```

Manual deployment:

```bash
gcloud run deploy saas-backend \
  --image asia-south1-docker.pkg.dev/ai-photo-studio-18/backend-repo/saas-backend \
  --region asia-south1 \
  --service-account saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --port 8080 \
  --vpc-connector vpc-connector \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances ai-photo-studio-18:asia-south1:postgres-db \
  --set-env-vars NODE_ENV=production,DB_HOST=/cloudsql/ai-photo-studio-18:asia-south1:postgres-db,DB_PORT=5432,DB_USERNAME=dbuser,DB_DATABASE=ai_photo_studio_db,STORAGE_PROVIDER=gcs,GCS_BUCKET_NAME=ai-photo-studio-18-app-storage,GCS_PROJECT_ID=ai-photo-studio-18,GCP_PROJECT_ID=ai-photo-studio-18
```

Step 11: Run Database Migrations

**Recommended**: Use the automated script:

```bash
./run-migrations.sh
```

This script will:
- Create/update the Cloud Run migration job
- Execute migrations automatically
- Show migration status and logs

**Manual Method** (if needed):

Create Migration Job:
```bash
gcloud run jobs create migrate-db \
  --image asia-south1-docker.pkg.dev/ai-photo-studio-18/backend-repo/saas-backend \
  --region asia-south1 \
  --service-account saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com \
  --set-cloudsql-instances ai-photo-studio-18:asia-south1:postgres-db \
  --set-env-vars NODE_ENV=production,DB_HOST=/cloudsql/ai-photo-studio-18:asia-south1:postgres-db,DB_PORT=5432,DB_USERNAME=dbuser,DB_DATABASE=ai_photo_studio_db \
  --set-env-vars GCP_PROJECT_ID=ai-photo-studio-18 \
  --command npm \
  --args run,migration:run
```

Execute:
```bash
gcloud run jobs execute migrate-db --region asia-south1
```

Step 12: Verify Deployment
gcloud run services describe saas-backend \
  --region asia-south1 \
  --format='value(status.url)'


Test health endpoint:

curl https://YOUR_SERVICE_URL/api/v1/health

Redis (❌ Deferred)

Redis is NOT enabled initially because:

Minimum cost: ~₹2,500/month

MVP does not need it

OTP can be handled via DB with TTL

👉 Add Redis only when traffic grows

Monthly Cost (India – Estimated)
Service	Cost
Cloud Run	₹0 – ₹800
Cloud SQL	₹600 – ₹800
Cloud Storage	₹50 – ₹200
VPC Connector	₹80 – ₹150
Total	₹900 – ₹2,000 / month
Security Checklist (Applied)

✅ Private Cloud SQL (no public IP)

✅ Dedicated service account

✅ Secrets in Secret Manager

✅ Private GCS bucket

✅ Signed URLs only

✅ Scale-to-zero enabled

Next Steps (Optional)

Custom domain mapping

CI/CD with Cloud Build

Redis (later)

Monitoring & alerts

Final Notes

This setup is production-safe

Scales automatically

Extremely cost-efficient

Ideal for first GCP deployment