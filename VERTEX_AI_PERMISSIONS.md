# Vertex AI Permissions Setup

## Problem

When deploying to Cloud Run, you may encounter this error:

```
Permission 'aiplatform.endpoints.predict' denied on resource '//aiplatform.googleapis.com/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/gemini-2.5-flash-image'
```

This happens because the Cloud Run service account doesn't have the necessary permissions to call Vertex AI APIs.

## Solution

Grant the Cloud Run service account the required Vertex AI permissions.

### Step 1: Identify Your Cloud Run Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run** → Your service
3. Check the **Service account** field (usually `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`)

Alternatively, find it using gcloud:

```bash
gcloud run services describe YOUR_SERVICE_NAME \
  --region=YOUR_REGION \
  --format="value(spec.template.spec.serviceAccountName)"
```

If no custom service account is set, it uses the default Compute Engine service account:
```
{PROJECT_NUMBER}-compute@developer.gserviceaccount.com
```

### Step 2: Grant Vertex AI Permissions

You have two options:

#### Option A: Grant "Vertex AI User" Role (Recommended)

This role provides all necessary permissions for using Vertex AI models:

```bash
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:{SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/aiplatform.user"
```

Replace `{SERVICE_ACCOUNT_EMAIL}` with your actual service account email.

#### Option B: Grant "AI Platform Developer" Role

Alternative role that also works:

```bash
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:{SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/ml.developer"
```

### Step 3: Verify Permissions

After granting permissions, wait a few seconds for IAM changes to propagate, then test your endpoint again.

### Step 4: Using Google Cloud Console (Alternative)

1. Go to [IAM & Admin → IAM](https://console.cloud.google.com/iam-admin/iam)
2. Find your Cloud Run service account
3. Click **Edit** (pencil icon)
4. Click **ADD ANOTHER ROLE**
5. Select **Vertex AI User** (`roles/aiplatform.user`)
6. Click **SAVE**

## Required Permissions

The service account needs at least one of these permissions:
- `aiplatform.endpoints.predict` - To call Vertex AI prediction endpoints
- `aiplatform.models.predict` - To use Vertex AI models

These are included in:
- `roles/aiplatform.user` (recommended)
- `roles/ml.developer` (alternative)

## Troubleshooting

### Still Getting 403 Errors?

1. **Wait for IAM propagation**: IAM changes can take up to 60 seconds to propagate
2. **Check the service account**: Ensure you granted permissions to the correct service account
3. **Verify project ID**: Make sure `GCP_PROJECT_ID` environment variable matches your GCP project
4. **Check location**: Ensure `VERTEX_AI_LOCATION` (default: `us-central1`) matches where the model is available

### Check Current Permissions

To see what permissions your service account has:

```bash
gcloud projects get-iam-policy ai-photo-studio-18 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:{SERVICE_ACCOUNT_EMAIL}" \
  --format="table(bindings.role)"
```

## Additional Notes

- **Local Development**: Works because your local `gcloud` credentials have broader permissions
- **Production**: Must explicitly grant permissions to the service account
- **Security**: The `roles/aiplatform.user` role is scoped to Vertex AI operations only, following the principle of least privilege

