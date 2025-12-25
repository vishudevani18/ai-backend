# Environment Variables List

This document lists all environment variables that should be included in the GCP Secret Manager "env" secret.

The "env" secret should be a JSON object containing all key-value pairs. Example:

```json
{
  "NODE_ENV": "production",
  "PORT": "8080",
  "DB_HOST": "/cloudsql/ai-photo-studio-18:asia-south1:postgres-db",
  "DB_PASSWORD": "your-password",
  "JWT_SECRET": "your-jwt-secret",
  ...
}
```

## Required Variables

These variables are **required** for the application to run in production.

### Application
- `NODE_ENV` - Environment mode (must be `production` for GCP)
- `PORT` - Application port (default: `8080`)

### Database (Cloud SQL PostgreSQL)
- `DB_HOST` - Database host (Cloud SQL Unix socket: `/cloudsql/PROJECT:REGION:INSTANCE`)
- `DB_PORT` - Database port (default: `5432`)
- `DB_USERNAME` - Database username (e.g., `dbuser`)
- `DB_PASSWORD` - Database password (required, store securely)
- `DB_DATABASE` - Database name (e.g., `ai_photo_studio_db`)

### JWT Authentication
- `JWT_SECRET` - Secret key for JWT access tokens (required, must be strong)
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh tokens (required, must be strong)
- `JWT_EXPIRES_IN` - Access token expiration (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: `7d`)

### Storage (GCS)
- `STORAGE_PROVIDER` - Storage provider (must be `gcs` for GCP)
- `GCS_BUCKET_NAME` - GCS bucket name (e.g., `ai-photo-studio-18-app-storage`)
- `GCS_PROJECT_ID` - GCP project ID (e.g., `ai-photo-studio-18`)
- `GOOGLE_APPLICATION_CREDENTIALS` - GCS service account key file (optional, not needed in Cloud Run - uses service account automatically)
- `GCS_CDN_BASE_URL` - CDN base URL (default: `https://storage.googleapis.com`)

**Note**: S3 and Cloudinary storage providers are configured but not implemented. Only GCS is used.

---

## Optional Variables

These variables are optional but may be required for specific features.

### Application Configuration
- `BASE_URL` - Base URL of the application (Cloud Run service URL)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated, default: `http://localhost:8080`)
- `LOG_LEVEL` - Logging level (`error`, `warn`, `info`, `debug`, default: `info`)
- `LOG_FILE` - Log file path (default: `logs/app.log`)

### Security
- `CSRF_ENABLED` - Enable CSRF protection (default: `false`, set to `true` for production)
- `HELMET_ENABLED` - Enable Helmet security headers (default: `true`)

### Rate Limiting
- `THROTTLE_TTL` - Throttle time window in seconds (default: `60`)
- `THROTTLE_LIMIT` - Maximum requests per window (default: `100`)

### File Upload
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: `10485760` = 10MB)
- `UPLOAD_PATH` - Local upload path (default: `./uploads`, not used with GCS)

### Gemini AI (Optional - Required for AI features)
- `GEMINI_API_KEY` - Google Gemini API key (optional, but required for AI features)
- `GEMINI_API_URL` - Gemini API endpoint (default: `https://generativelanguage.googleapis.com/v1beta`)

### Stripe Payment (Optional - Required for payment features)
- `STRIPE_SECRET_KEY` - Stripe secret key (optional, required for payments)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (optional, required for webhooks)

### Redis Cache (Optional - Recommended for production)
- `REDIS_HOST` - Redis host (Cloud Memorystore private IP, e.g., `10.x.x.x`)
- `REDIS_PORT` - Redis port (default: `6379`)
- `REDIS_PASSWORD` - Redis password (optional, leave empty if AUTH disabled)
- `REDIS_DB` - Redis database number (default: `0`)
- `REDIS_DEFAULT_TTL` - Default cache TTL in seconds (default: `3600`)
- `REDIS_MAX_ITEMS` - Maximum cached items (default: `1000`)

### WhatsApp Business API (Optional - Required for WhatsApp features)

#### Meta Direct (WhatsApp Business API)
- `WHATSAPP_PROVIDER` - Provider type (`meta-direct`, `msg91`, `gupshup`, default: `meta-direct`)
- `WHATSAPP_API_URL` - API endpoint (default: `https://graph.facebook.com/v18.0`)
- `WHATSAPP_ACCESS_TOKEN` - Meta access token
- `WHATSAPP_PHONE_NUMBER_ID` - Phone number ID
- `WHATSAPP_BUSINESS_ACCOUNT_ID` - Business account ID
- `WHATSAPP_APP_ID` - Meta app ID
- `WHATSAPP_APP_SECRET` - Meta app secret

#### MSG91 BSP Provider
- `MSG91_API_KEY` - MSG91 API key
- `MSG91_SENDER_ID` - MSG91 sender ID

#### Gupshup BSP Provider
- `GUPSHUP_API_KEY` - Gupshup API key
- `GUPSHUP_APP_NAME` - Gupshup app name

#### WhatsApp Templates
- `WHATSAPP_OTP_SIGNUP_TEMPLATE` - OTP signup template name (default: `otp_signup`)
- `WHATSAPP_OTP_RESET_TEMPLATE` - OTP reset template name (default: `otp_reset_password`)

### Super Admin (Optional - Only for initial setup)
- `SUPER_ADMIN_EMAIL` - Super admin email address
- `SUPER_ADMIN_PASSWORD` - Super admin password (min 8 characters)

### GCP Configuration
- `GCP_PROJECT_ID` - GCP project ID (auto-detected in Cloud Run, but can be set explicitly)

---

## Example Complete JSON

Here's a complete example of the "env" secret JSON structure:

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
  "JWT_EXPIRES_IN": "15m",
  "JWT_REFRESH_SECRET": "your-super-secure-refresh-secret-min-32-chars",
  "JWT_REFRESH_EXPIRES_IN": "7d",
  "STORAGE_PROVIDER": "gcs",
  "GCS_BUCKET_NAME": "ai-photo-studio-18-app-storage",
  "GCS_PROJECT_ID": "ai-photo-studio-18",
  "GCS_CDN_BASE_URL": "https://storage.googleapis.com",
  "BASE_URL": "https://saas-backend-xxxxx-as.a.run.app",
  "CORS_ORIGIN": "https://yourdomain.com,https://app.yourdomain.com",
  "LOG_LEVEL": "info",
  "CSRF_ENABLED": "true",
  "HELMET_ENABLED": "true",
  "GEMINI_API_KEY": "your-gemini-api-key",
  "STRIPE_SECRET_KEY": "sk_live_your_stripe_key",
  "STRIPE_WEBHOOK_SECRET": "whsec_your_webhook_secret",
  "GCP_PROJECT_ID": "ai-photo-studio-18",
  "SUPER_ADMIN_EMAIL": "superadmin@yourdomain.com",
  "SUPER_ADMIN_PASSWORD": "your-secure-password"
}
```

---

## Creating/Updating the Secret

### Create the Secret (First Time)

1. Create a JSON file with all your environment variables:
   ```bash
   # Create env.json with all variables
   nano env.json
   ```

2. Create the secret:
   ```bash
   gcloud secrets create env --data-file=env.json
   ```

### Update the Secret (New Version)

When you need to update environment variables:

1. Update your JSON file:
   ```bash
   nano env.json
   ```

2. Add a new version:
   ```bash
   gcloud secrets versions add env --data-file=env.json
   ```

3. The application will automatically use the latest version on next deployment/restart.

---

## Notes

- All values in the JSON must be strings (even numbers like `PORT` should be `"8080"` not `8080`)
- The application will parse numeric strings automatically
- Boolean values should be strings: `"true"` or `"false"`
- Never commit the `env.json` file to version control
- Use strong, unique secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` (minimum 32 characters)
- The secret is automatically fetched at application startup in production
- Development/test environments continue to use `.env` files (no GCP dependency)

