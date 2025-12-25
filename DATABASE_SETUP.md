# Database Setup Guide

This guide covers database setup, migrations, and automation for the GCP deployment.

## 🎯 Quick Start

### Automated Setup (Recommended)

```bash
# Complete database setup (create DB + run migrations)
./setup-database.sh

# Or just run migrations (if DB already exists)
./run-migrations.sh
```

## 📋 Available Scripts

### 1. `setup-database.sh`
Complete database setup including:
- ✅ Check Cloud SQL instance
- ✅ Create database (if not exists)
- ✅ Verify database user
- ✅ Run migrations

**Usage:**
```bash
./setup-database.sh
```

### 2. `run-migrations.sh`
Runs database migrations using Cloud Run Jobs:
- ✅ Creates/updates Cloud Run migration job
- ✅ Executes migrations
- ✅ Shows status and logs

**Usage:**
```bash
./run-migrations.sh
```

### 3. `setup-gcp.sh`
Complete GCP setup automation:
- ✅ Infrastructure setup
- ✅ Application deployment
- ✅ Database migrations
- ✅ Verification

**Usage:**
```bash
./setup-gcp.sh
```

## 🔧 Manual Migration Commands

### Create Migration Job

```bash
gcloud run jobs create migrate-db \
  --image asia-south1-docker.pkg.dev/ai-photo-studio-18/backend-repo/saas-backend \
  --region asia-south1 \
  --service-account saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com \
  --set-cloudsql-instances ai-photo-studio-18:asia-south1:postgres-db \
  --set-env-vars NODE_ENV=production,DB_HOST=/cloudsql/ai-photo-studio-18:asia-south1:postgres-db,DB_PORT=5432,DB_USERNAME=dbuser,DB_DATABASE=ai_photo_studio_db,GCP_PROJECT_ID=ai-photo-studio-18 \
  --command npm \
  --args run,migration:run \
  --max-retries=1 \
  --task-timeout=600
```

### Execute Migrations

```bash
gcloud run jobs execute migrate-db --region asia-south1 --wait
```

### View Migration Logs

```bash
gcloud logging read \
  "resource.type=cloud_run_job AND resource.labels.job_name=migrate-db AND resource.labels.location=asia-south1" \
  --limit=50 \
  --format=json
```

## 📊 Database Operations

### Check Database Connection

```bash
# Connect via Cloud SQL Proxy (local)
gcloud sql connect postgres-db --user=dbuser --database=ai_photo_studio_db
```

### List Tables

```sql
\dt
```

### Check Migration Status

The application tracks migrations in the `migrations` table. You can check:

```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

## 🔄 Migration Workflow

### 1. Generate New Migration (Local)

```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

### 2. Review Migration File

Check the generated migration in `src/database/migrations/`

### 3. Deploy Application

```bash
./deploy.sh
```

### 4. Run Migrations

```bash
./run-migrations.sh
```

## 🚨 Troubleshooting

### Migration Fails

1. **Check logs:**
   ```bash
   gcloud logging read \
     "resource.type=cloud_run_job AND resource.labels.job_name=migrate-db" \
     --limit=100
   ```

2. **Common issues:**
   - Missing environment variables in Secret Manager
   - Database connection issues
   - Migration conflicts

3. **Revert migration (if needed):**
   ```bash
   # Note: Revert must be done manually via SQL or local connection
   ```

### Database Connection Issues

1. **Verify Cloud SQL instance:**
   ```bash
   gcloud sql instances describe postgres-db
   ```

2. **Check service account permissions:**
   ```bash
   gcloud projects get-iam-policy ai-photo-studio-18 \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com"
   ```

3. **Verify VPC connector:**
   ```bash
   gcloud compute networks vpc-access connectors describe vpc-connector --region=asia-south1
   ```

## 📝 Initial Data

### Super Admin

The super admin user is automatically created on application startup via the seed script:
- Location: `src/database/seeds/create-super-admin.seed.ts`
- Credentials: Set in Secret Manager `env` secret:
  - `SUPER_ADMIN_EMAIL`
  - `SUPER_ADMIN_PASSWORD`

### Manual Seeding (if needed)

You can add custom seed scripts in `src/database/seeds/` and call them from `main.ts` or create a separate Cloud Run job.

## 🔐 Security Notes

1. **Database credentials** are stored in Secret Manager `env` secret
2. **No public IP** - Database is only accessible via VPC connector
3. **Least privilege** - Service account has minimal required permissions
4. **Migrations run in isolated job** - Separate from main application

## 📚 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [ENV_VARIABLES_LIST.md](./ENV_VARIABLES_LIST.md) - Environment variables reference
- [README.md](./README.md) - Project overview

