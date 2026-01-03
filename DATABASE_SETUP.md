# Database Setup Guide

This guide covers database setup for the GCP Cloud SQL deployment.

## Overview

The application uses **Cloud SQL PostgreSQL** with automatic connection via Unix socket. Database migrations are handled automatically by TypeORM, and the super admin user is created on application startup.

## Prerequisites

- GCP project with Cloud SQL API enabled
- Cloud SQL instance created
- VPC connector configured (for Cloud Run connectivity)

## Initial Setup

### 1. Create Cloud SQL Instance

```bash
gcloud sql instances create postgres-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=asia-south1 \
  --network=default \
  --no-assign-ip
```

**Note**: `--no-assign-ip` creates a private IP-only instance (more secure).

### 2. Create Database

```bash
gcloud sql databases create ai_photo_studio_db --instance=postgres-db
```

### 3. Create Database User

```bash
gcloud sql users create dbuser \
  --instance=postgres-db \
  --password=YOUR_SECURE_PASSWORD
```

**Important**: Save the password securely. You'll need it for the `env` secret in Secret Manager.

### 4. Configure VPC Connector

The VPC connector allows Cloud Run to connect to the private Cloud SQL instance:

```bash
gcloud compute networks vpc-access connectors create vpc-connector \
  --region=asia-south1 \
  --subnet=default \
  --min-instances=0 \
  --max-instances=2 \
  --machine-type=e2-micro
```

## Database Schema Management

### Automatic Schema Synchronization

The database schema is **automatically synchronized** from TypeORM entities using `synchronize: true` in development. This means:

- Tables are automatically created/updated based on entity definitions
- No manual migrations needed for now
- Perfect for fresh database setup and development

**Note**: When you're ready for production migrations, you can:
1. Set `synchronize: false` in `database.module.ts`
2. Generate migrations from your entities
3. Run migrations manually or via Cloud Run Jobs

## Super Admin Creation

The super admin user is **automatically created** on application startup if it doesn't exist. The credentials are read from environment variables:

- `SUPER_ADMIN_EMAIL`: Super admin email
- `SUPER_ADMIN_PASSWORD`: Super admin password

These should be included in your `env` secret in Secret Manager.

## Connection Configuration

The application connects to Cloud SQL using a Unix socket:

```
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

Example:
```
DB_HOST=/cloudsql/ai-photo-studio-18:asia-south1:postgres-db
```

This is configured automatically in the deployment script.

## Environment Variables

Add these to your `env` secret in Secret Manager:

```json
{
  "DB_HOST": "/cloudsql/ai-photo-studio-18:asia-south1:postgres-db",
  "DB_PORT": "5432",
  "DB_USERNAME": "dbuser",
  "DB_PASSWORD": "your-secure-password",
  "DB_DATABASE": "ai_photo_studio_db"
}
```

## Verification

### Check Database Connection

After deployment, check the application logs:

```bash
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --format json | grep -i "database\|connection"
```

### Connect to Database (for debugging)

Use Cloud SQL Proxy:

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Connect
./cloud-sql-proxy ai-photo-studio-18:asia-south1:postgres-db

# In another terminal, connect with psql
psql -h 127.0.0.1 -U dbuser -d ai_photo_studio_db
```

## Troubleshooting

### Connection Refused

- Verify VPC connector is running: `gcloud compute networks vpc-access connectors describe vpc-connector --region=asia-south1`
- Check Cloud Run service has VPC connector configured
- Verify Cloud SQL instance has private IP enabled

### Authentication Failed

- Verify database user exists: `gcloud sql users list --instance=postgres-db`
- Check password in Secret Manager matches database user password
- Verify `DB_USERNAME` matches the actual database user

### Database Not Found

- Verify database exists: `gcloud sql databases list --instance=postgres-db`
- Check `DB_DATABASE` environment variable matches actual database name

## Security Best Practices

- ✅ Use private IP-only Cloud SQL instance
- ✅ Use dedicated service account with least-privilege roles
- ✅ Store credentials in Secret Manager (not in code)
- ✅ Use strong passwords for database users
- ✅ Enable SSL for external connections (not needed for Unix socket)

## Cost Optimization

- Use `db-g1-small` tier for development/staging
- Scale up only when needed for production
- Use connection pooling (configured in `database.config.ts`)
- Monitor connection usage to avoid hitting limits

Estimated cost: ₹600-₹800/month for `db-g1-small` in India region
