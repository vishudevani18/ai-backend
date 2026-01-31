# Workload Identity Federation Setup Guide

This guide will walk you through setting up Workload Identity Federation (WIF) for secure, keyless authentication from GitHub Actions to Google Cloud Platform. This setup is **reusable across all three services**: backend, admin panel, and webapp.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Access to Google Cloud Console with project admin permissions
- [ ] `gcloud` CLI installed and authenticated
- [ ] Access to GitHub repositories (backend, admin panel, webapp)
- [ ] GitHub organization/owner name and repository names ready

## 🎯 What This Setup Does

- ✅ Creates a shared Workload Identity Pool (used by all services)
- ✅ Sets up OIDC provider for GitHub Actions
- ✅ Creates a deployment service account (`github-deployer`)
- ✅ Grants necessary permissions for deployments
- ✅ Binds GitHub repositories to the service account
- ✅ Eliminates the need for service account keys

## ❓ Why Do We Need All 3 Repositories?

**Question:** "Why do we need 3 repo names when this repo is only for backend? The other 2 repos have different source code."

**Answer:** Even though each repository has different source code, they all:
- Deploy to the **same GCP project** (`ai-photo-studio-18`)
- Use the **same Workload Identity Pool** (shared setup)
- Need **separate IAM bindings** so GitHub Actions in each repo can authenticate

**How it works:**
1. **One shared WIF pool** - Created once, used by all repos
2. **One shared service account** (`github-deployer`) - Used by all repos
3. **Three separate IAM bindings** - One for each repository:
   - `vishudevani18/ai-backend` → Can authenticate
   - `vishudevani18/ai-admin` → Can authenticate
   - `vishudevani18/ai-web-app` → Can authenticate

**Benefits:**
- ✅ One-time setup for all three repos
- ✅ Same authentication method across all services
- ✅ Each repo can only deploy its own service (security)
- ✅ Easy to add more repos later

**Note:** Each repository will have its own GitHub Actions workflow file, but they all use the same WIF configuration (same secrets: `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT`).

## 📝 Information You'll Need

Before starting, gather this information:

1. **GCP Project ID**: `ai-photo-studio-18` ✅
2. **GCP Project Number**: `1081390748098` ✅
3. **GitHub Organization/Owner**: `vishudevani18` ✅
4. **Repository Names** (GitHub repository names, NOT GCP service names):
   - Backend: `vishudevani18/ai-backend` ✅
   - Admin Panel: `vishudevani18/ai-admin` ✅
   - Webapp: `vishudevani18/ai-web-app` ✅

### 🔍 How to Find Your GitHub Information

**GitHub Organization/Owner Name:**
- This is your GitHub username or organization name
- Look at your repository URL: `https://github.com/YOUR_ORG_OR_USERNAME/repo-name`
- Examples: `mycompany`, `johndoe`, `my-org`
- **NOT in GCP** - this is your GitHub account/organization name

**Repository Names (GitHub Repositories):**
- These are your **GitHub repository names**, NOT GCP service names
- Format: `organization-or-username/repository-name`
- Examples:
  - `mycompany/ai-backend` (GitHub repo)
  - `mycompany/admin-panel` (GitHub repo)
  - `mycompany/webapp` (GitHub repo)
- **Where to find:** Go to your GitHub repository → Look at the URL or repository name at the top
- **NOT the same as:** GCP Cloud Run service names (like `saas-backend`, `admin-panel`, etc.)

**Example:**
- If your GitHub repo URL is: `https://github.com/mycompany/ai-backend`
- Then your repository name is: `mycompany/ai-backend`
- Organization/Owner: `mycompany`
- Repository: `ai-backend`

---

## Step 1: Get Project Number

First, we need the GCP project number (different from project ID).

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe ai-photo-studio-18 --format="value(projectNumber)")
echo "Project Number: ${PROJECT_NUMBER}"
```

**Your Project Number:** `1081390748098`

- [x] Project number retrieved: `1081390748098`

---

## Step 2: Create Workload Identity Pool

This creates a shared pool that all your GitHub repositories will use.

```bash
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --display-name="GitHub Actions Pool (Shared)" \
  --project="ai-photo-studio-18"
```

**Expected Output:** You should see a success message confirming the pool was created.

- [ ] Workload Identity Pool created successfully

---

## Step 3: Create OIDC Provider

This connects GitHub Actions to your GCP project via OpenID Connect.

```bash
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository!=null" \
  --project="ai-photo-studio-18"
```

**What this does:**
- `issuer-uri`: GitHub's OIDC endpoint
- `attribute-mapping`: Maps GitHub repository info to GCP attributes
  - `google.subject=assertion.sub`: Maps GitHub subject to GCP subject
  - `attribute.repository=assertion.repository`: Maps repository name for IAM bindings
- `attribute-condition`: Security condition that ensures repository attribute is present
  - `assertion.repository!=null`: Only allows authentication when repository information is provided

**Note:** 
- We only map `attribute.repository` (not `attribute.ref`) since we're not enforcing branch-based restrictions
- The `attribute-condition` adds an extra security layer by requiring repository information
- This allows any branch/tag/PR from the authorized repository to authenticate, which is appropriate for our use case

- [ ] OIDC Provider created successfully

---

## Step 4: Create Service Account for GitHub Actions

This creates a new service account specifically for GitHub Actions deployments. **This is separate from `saas-backend-sa` which runs your Cloud Run service.**

```bash
# Create the service account
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer (Shared)" \
  --project="ai-photo-studio-18"
```

- [ ] Service account `github-deployer` created

---

## Step 5: Grant IAM Roles to Service Account

Grant the necessary permissions for deployments.

```bash
# Grant Cloud Run admin role (deploy services)
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant Artifact Registry writer role (push Docker images)
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Grant Service Account User role (impersonate service accounts)
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Grant Cloud SQL client role (connect to databases)
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Storage Object Admin role (access GCS buckets)
gcloud projects add-iam-policy-binding ai-photo-studio-18 \
  --member="serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

**What each role does:**
- `roles/run.admin`: Deploy and manage Cloud Run services
- `roles/artifactregistry.writer`: Push Docker images to Artifact Registry
- `roles/iam.serviceAccountUser`: Impersonate service accounts (needed for deployments)
- `roles/cloudsql.client`: Connect to Cloud SQL instances
- `roles/storage.objectAdmin`: Access Google Cloud Storage buckets

- [ ] All IAM roles granted successfully

---

## Step 6: Get WIF Provider Resource Name

Get the full resource name that you'll use in GitHub secrets.

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --project="ai-photo-studio-18" \
  --format="value(name)"
```

**Expected Output:** Based on your project number, it will be:
```
projects/1081390748098/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

**Action:** Copy this entire value - you'll need it for GitHub secrets.

**Your WIF Provider:** `projects/1081390748098/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

- [ ] WIF Provider resource name copied: `projects/1081390748098/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

---

## Step 7: Bind GitHub Repositories to Service Account

For each repository, bind it to the service account. **Replace `YOUR_ORG` and repository names with your actual values.**

### 7a. Backend Repository

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/1081390748098/locations/global/workloadIdentityPools/github-pool/attribute.repository/vishudevani18/ai-backend" \
  --project="ai-photo-studio-18"
```

- [ ] Backend repository bound: `vishudevani18/ai-backend`

### 7b. Admin Panel Repository

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/1081390748098/locations/global/workloadIdentityPools/github-pool/attribute.repository/vishudevani18/ai-admin" \
  --project="ai-photo-studio-18"
```

- [ ] Admin panel repository bound: `vishudevani18/ai-admin`

### 7c. Webapp Repository

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@ai-photo-studio-18.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/1081390748098/locations/global/workloadIdentityPools/github-pool/attribute.repository/vishudevani18/ai-web-app" \
  --project="ai-photo-studio-18"
```

- [ ] Webapp repository bound: `vishudevani18/ai-web-app`

---

## Step 8: Add GitHub Secrets

Add the required secrets to each GitHub repository.

### Secrets to Add (Same for All Repositories)

For **each repository** (backend, admin panel, webapp):

1. Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

2. Add these two secrets:

   **Secret 1: `WIF_PROVIDER`**
   - **Name:** `WIF_PROVIDER`
   - **Value:** `projects/1081390748098/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

   **Secret 2: `WIF_SERVICE_ACCOUNT`**
   - **Name:** `WIF_SERVICE_ACCOUNT`
   - **Value:** `github-deployer@ai-photo-studio-18.iam.gserviceaccount.com`

### Checklist

- [ ] Backend repository: `WIF_PROVIDER` added
- [ ] Backend repository: `WIF_SERVICE_ACCOUNT` added
- [ ] Admin panel repository: `WIF_PROVIDER` added
- [ ] Admin panel repository: `WIF_SERVICE_ACCOUNT` added
- [ ] Webapp repository: `WIF_PROVIDER` added
- [ ] Webapp repository: `WIF_SERVICE_ACCOUNT` added

---

## Step 9: Verify Workflow Files

Ensure your workflow files use WIF authentication. The workflow should look like this:

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

**Note:** The backend workflow has already been updated. Verify it matches the above.

- [ ] Backend workflow verified/updated
- [ ] Admin panel workflow verified/updated (if exists)
- [ ] Webapp workflow verified/updated (if exists)

---

## Step 10: Test Deployment

Test that WIF authentication works by triggering a deployment.

1. **Push to a test branch** (e.g., `green-test`) or create a test commit
2. **Check GitHub Actions logs** for the deployment
3. **Verify authentication succeeds** - you should see no errors about credentials

### What to Look For

✅ **Success indicators:**
- No errors about "invalid credentials"
- Authentication step completes successfully
- Deployment proceeds normally

❌ **If you see errors:**
- Check that `WIF_PROVIDER` secret matches exactly (including project number)
- Verify `WIF_SERVICE_ACCOUNT` is correct
- Ensure repository IAM binding was successful (Step 7)
- Check that service account has required roles (Step 5)

- [ ] Test deployment successful
- [ ] No authentication errors in logs

---

## Step 11: Cleanup Old Authentication (After Verification)

**⚠️ IMPORTANT: Only do this AFTER WIF is confirmed working!**

### 11a. Identify Old Service Account Keys

List keys that were used for GitHub Actions:

```bash
# Option 1: If you used saas-backend-sa for GitHub Actions
gcloud iam service-accounts keys list \
  --iam-account=saas-backend-sa@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"

# Option 2: If you created a separate service account for deployments
# Replace YOUR_DEPLOYMENT_SA with the actual service account name
gcloud iam service-accounts keys list \
  --iam-account=YOUR_DEPLOYMENT_SA@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"
```

**⚠️ WARNING:** Only delete keys that were used for GitHub Actions, NOT keys used by Cloud Run!

- [ ] Old service account keys identified

### 11b. Delete Old Service Account Keys

```bash
# Replace KEY_ID and SERVICE_ACCOUNT_EMAIL with actual values
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=SERVICE_ACCOUNT_EMAIL@ai-photo-studio-18.iam.gserviceaccount.com \
  --project="ai-photo-studio-18"
```

**⚠️ DO NOT delete if:**
- The service account is used by Cloud Run at runtime (`saas-backend-sa`)
- You're unsure which key is which
- The key might be used elsewhere

- [ ] Old service account keys deleted (if applicable)

### 11c. Remove GitHub Secret

Remove the old `GCP_SERVICE_ACCOUNT_KEY` secret from all repositories:

1. Go to: **Repository → Settings → Secrets and variables → Actions**
2. Find `GCP_SERVICE_ACCOUNT_KEY`
3. Click the delete button (trash icon)
4. Confirm deletion

Repeat for all three repositories.

- [ ] Backend repository: `GCP_SERVICE_ACCOUNT_KEY` removed
- [ ] Admin panel repository: `GCP_SERVICE_ACCOUNT_KEY` removed
- [ ] Webapp repository: `GCP_SERVICE_ACCOUNT_KEY` removed

### 11d. (Optional) Delete Old Deployment Service Account

**Only if you created a separate service account solely for GitHub Actions:**

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

- [ ] Old deployment service account deleted (if applicable)

---

## ✅ Setup Complete!

Congratulations! You've successfully set up Workload Identity Federation. Your GitHub Actions workflows now use secure, keyless authentication.

### What You've Accomplished

- ✅ Created shared WIF pool for all services
- ✅ Set up OIDC provider for GitHub Actions
- ✅ Created deployment service account with proper permissions
- ✅ Bound all repositories to the service account
- ✅ Added GitHub secrets
- ✅ Tested and verified deployment
- ✅ Cleaned up old authentication methods

### Benefits

- 🔒 **No long-lived credentials** - tokens are short-lived and automatically rotated
- 🔄 **Automatic rotation** - no manual key management needed
- 🎯 **Repository-level access control** - each repo can only access what it's allowed
- 📦 **Reusable setup** - same configuration works for all services
- 🛡️ **Enhanced security** - follows Google's recommended best practices

---

## 🆘 Troubleshooting

### Error: "Permission denied" or "Access denied"

**Possible causes:**
1. Repository IAM binding not created (Step 7)
2. Service account missing required roles (Step 5)
3. Incorrect `WIF_PROVIDER` secret value

**Solution:**
- Verify repository binding: `gcloud iam service-accounts get-iam-policy github-deployer@ai-photo-studio-18.iam.gserviceaccount.com --project="ai-photo-studio-18"`
- Check service account roles: `gcloud projects get-iam-policy ai-photo-studio-18 --flatten="bindings[].members" --filter="bindings.members:serviceAccount:github-deployer@ai-photo-studio-18.iam.gserviceaccount.com"`
- Verify `WIF_PROVIDER` secret matches exactly (including project number)

### Error: "Invalid workload identity provider"

**Possible causes:**
1. Incorrect `WIF_PROVIDER` secret value
2. Provider not created successfully

**Solution:**
- Re-run Step 6 to get the correct provider name
- Verify provider exists: `gcloud iam workload-identity-pools providers describe github-provider --location="global" --workload-identity-pool="github-pool" --project="ai-photo-studio-18"`

### Error: "Service account not found"

**Possible causes:**
1. Service account not created
2. Incorrect `WIF_SERVICE_ACCOUNT` secret value

**Solution:**
- Verify service account exists: `gcloud iam service-accounts describe github-deployer@ai-photo-studio-18.iam.gserviceaccount.com --project="ai-photo-studio-18"`
- Ensure `WIF_SERVICE_ACCOUNT` secret is exactly: `github-deployer@ai-photo-studio-18.iam.gserviceaccount.com`

---

## 📚 Additional Resources

- [Google Cloud Workload Identity Federation Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [google-github-actions/auth Action](https://github.com/google-github-actions/auth)

---

## 📝 Notes

- The `github-deployer` service account is separate from `saas-backend-sa` which runs your Cloud Run service
- The WIF pool is shared across all services - you only create it once
- Each repository needs its own IAM binding (Step 7)
- The same `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` values are used in all repositories

---

**Last Updated:** After completing this guide, your setup is production-ready! 🚀
