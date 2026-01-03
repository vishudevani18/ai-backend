# Quick Fix: Vertex AI Permission Denied Error

## The Problem

You're getting this error:
```
Permission 'aiplatform.endpoints.predict' denied
```

## The Solution

Your Cloud Run service uses a **custom service account**: `saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com`

You need to grant permissions to **this specific service account**, not the default Compute Engine one.

## Quick Fix (Run This Command)

```bash
# Grant Vertex AI permissions to the correct service account
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Enable Vertex AI API (if not already enabled)
gcloud services enable aiplatform.googleapis.com --project=ai-photo-studio-18
```

## Verify It Worked

```bash
# Check if permissions are granted
gcloud projects get-iam-policy ai-photo-studio-18 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com" \
  --format="table(bindings.role)" | grep aiplatform
```

You should see `roles/aiplatform.user` in the output.

## Wait and Test

1. **Wait 30-60 seconds** for IAM changes to propagate
2. Test your endpoint again
3. If it still fails, check:
   - The service account in Cloud Run console matches: `saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com`
   - Vertex AI API is enabled: `gcloud services list --enabled | grep aiplatform`

## Using Google Cloud Console

1. Go to [IAM & Admin → IAM](https://console.cloud.google.com/iam-admin/iam)
2. Find: `saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com`
3. Click **Edit** (pencil icon)
4. Click **ADD ANOTHER ROLE**
5. Select **Vertex AI User** (`roles/aiplatform.user`)
6. Click **SAVE**

## Why This Happened

The deployment process creates a custom service account (`saas-backend-sa`) for security, but Vertex AI permissions need to be granted separately. The service account is created during initial GCP setup, and Vertex AI permissions should be added at that time.

**Note**: When setting up the service account initially, make sure to grant the `roles/aiplatform.user` role along with other required roles.

