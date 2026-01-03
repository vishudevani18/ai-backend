import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Fetches environment variables from GCP Secret Manager and loads them
 * This should be called before NestJS ConfigModule initializes in production
 *
 * Secret name is determined by:
 * 1. SECRET_NAME environment variable (set at Cloud Run deployment time)
 * 2. Defaults to "env" if not set
 *
 * @param projectId - GCP Project ID (defaults to process.env.GCP_PROJECT_ID or auto-detected)
 * @param secretName - Secret name (defaults to process.env.SECRET_NAME or "env")
 * @returns Promise<void>
 */
export async function loadEnvFromSecretManager(
  projectId?: string,
  secretName?: string,
): Promise<void> {
  // Only run in production
  // Note: All Cloud Run deployments (green-test, green-deploy, blue-prod) use NODE_ENV=production
  // The distinction between test/prod is made via SECRET_NAME (test-env vs env)
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Determine secret name: use parameter, then SECRET_NAME env var, then default to "env"
  const finalSecretName = secretName || process.env.SECRET_NAME || 'env';

  try {
    // Initialize Secret Manager client
    const client = new SecretManagerServiceClient();

    // Auto-detect project ID if not provided
    if (!projectId) {
      projectId = process.env.GCP_PROJECT_ID;
      if (!projectId) {
        // Try to get from metadata service (works in Cloud Run)
        try {
          const metadataResponse = await fetch(
            'http://metadata.google.internal/computeMetadata/v1/project/project-id',
            {
              headers: { 'Metadata-Flavor': 'Google' },
            },
          );
          if (metadataResponse.ok) {
            projectId = await metadataResponse.text();
          }
        } catch (error) {
          // Silent fail, will throw below if still not set
        }
      }
    }

    if (!projectId) {
      throw new Error('GCP Project ID is required. Set GCP_PROJECT_ID environment variable.');
    }

    // Construct the secret name
    const secretPath = `projects/${projectId}/secrets/${finalSecretName}/versions/latest`;

    // Access the secret version
    let version;
    try {
      [version] = await client.accessSecretVersion({
        name: secretPath,
      });
    } catch (apiError: unknown) {
      const error = apiError as Error & { code?: string };
      throw new Error(
        `Failed to access secret "${finalSecretName}": ${error?.message || 'Unknown error'}. Check IAM permissions for service account.`,
      );
    }

    // Get the secret payload
    const secretPayload = version.payload?.data?.toString();
    if (!secretPayload) {
      throw new Error('Secret payload is empty');
    }

    // Parse the secret (expecting JSON format)
    let envVars: Record<string, string>;
    try {
      envVars = JSON.parse(secretPayload);
    } catch (parseError) {
      // Fallback: Try parsing as KEY=VALUE format
      envVars = parseKeyValueFormat(secretPayload);
    }

    // Set all environment variables from the secret
    for (const [key, value] of Object.entries(envVars)) {
      if (value !== null && value !== undefined && value !== '') {
        process.env[key] = String(value);
      }
    }

    // Verify critical variables are set
    const requiredVars = [
      'DB_PASSWORD',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DB_USERNAME',
      'DB_DATABASE',
    ];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables in secret: ${missingVars.join(', ')}`,
      );
    }
  } catch (error) {
    console.error('Failed to load environment variables from Secret Manager:', error.message);
    throw error;
  }
}

/**
 * Parse KEY=VALUE format (newline-separated)
 * @param payload - Secret payload as string
 * @returns Record of key-value pairs
 */
function parseKeyValueFormat(payload: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  const lines = payload.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue; // Skip empty lines and comments
    }

    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) {
      continue; // Skip lines without =
    }

    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();

    // Remove quotes if present
    const unquotedValue = value.replace(/^["']|["']$/g, '');

    if (key) {
      envVars[key] = unquotedValue;
    }
  }

  return envVars;
}
