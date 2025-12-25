#!/usr/bin/env node

/**
 * Migration Wrapper Script for Cloud Run Jobs
 * 
 * Loads environment variables from GCP Secret Manager before running migrations.
 * This is needed because Cloud Run Jobs don't automatically load secrets as env vars.
 * 
 * Usage: node scripts/migrate-with-secrets.js
 */

const { execSync } = require('child_process');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function loadSecretsAndRunMigrations() {
  // Only load from Secret Manager in production
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('Loading environment variables from Secret Manager...');
      
      const projectId = process.env.GCP_PROJECT_ID;
      if (!projectId) {
        throw new Error('GCP_PROJECT_ID environment variable is required');
      }

      const client = new SecretManagerServiceClient();
      const secretPath = `projects/${projectId}/secrets/env/versions/latest`;

      const [version] = await client.accessSecretVersion({
        name: secretPath,
      });

      const secretPayload = version.payload?.data?.toString();
      if (!secretPayload) {
        throw new Error('Secret payload is empty');
      }

      // Parse JSON secret
      let envVars;
      try {
        envVars = JSON.parse(secretPayload);
      } catch (parseError) {
        // Fallback: Try KEY=VALUE format
        envVars = {};
        const lines = secretPayload.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const equalIndex = trimmed.indexOf('=');
          if (equalIndex === -1) continue;
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
          if (key) envVars[key] = value;
        }
      }

      // Set environment variables
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== null && value !== undefined && value !== '') {
          process.env[key] = String(value);
        }
      }

      console.log('Environment variables loaded from Secret Manager');
    } catch (error) {
      console.error('Failed to load secrets from Secret Manager:', error.message);
      process.exit(1);
    }
  }

  // Verify required variables
  const requiredVars = ['DB_PASSWORD', 'DB_USERNAME', 'DB_DATABASE', 'DB_HOST'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Run migrations using the built data-source
  console.log('Running database migrations...');
  try {
    execSync('node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed');
    process.exit(1);
  }
}

loadSecretsAndRunMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
