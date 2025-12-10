# Rucio CRM: DevOps & Infrastructure Architecture
> **Target Audience:** Antigravity App (Vibe Coding Platform) / DevOps Engineering
> **Context:** Cloud Native Deployment & Workspace Integration

## 1. Infrastructure Architecture (Google Cloud Platform)

The application is designed as a stateless containerized Single Page Application (SPA) served via Nginx, deployed to Google Cloud Run for auto-scaling and zero-maintenance infrastructure.

### 1.1 Compute & Networking
*   **Runtime:** Google Cloud Run (Fully Managed).
*   **Region:** `us-central1` (Low latency for primary user base) or `europe-west1` (GDPR compliance).
*   **Container Registry:** Google Artifact Registry (Docker format).
*   **Load Balancing:** Native Cloud Run Load Balancing with automatic HTTPS termination.

### 1.2 Security & Secrets
*   **Secret Manager:**
    *   `GEMINI_API_KEY`: Injected at runtime as an environment variable.
    *   `OAUTH_CLIENT_SECRET`: For Google Workspace server-side flows (future state).
*   **IAM:**
    *   `Cloud Run Service Agent`: Minimal permissions.
    *   `DevOps Service Account`: Permission to push to Artifact Registry and `run.services.update`.

## 2. Google Workspace Deep Integration

To enable the "Deep Integration" features (Calendar, Gmail, Drive), the project requires a GCP Project with the Google Workspace APIs enabled.

### 2.1 OAuth Scopes Configuration
The application requires the following scopes in the OAuth Consent Screen:
*   `https://www.googleapis.com/auth/calendar.events.readonly` (Context for Battle Cards)
*   `https://www.googleapis.com/auth/gmail.readonly` (Email scraping for CRM updates)
*   `https://www.googleapis.com/auth/drive.readonly` (Linking assets to deals)
*   `https://www.googleapis.com/auth/userinfo.email` (Identity)

### 2.2 Data Governance
*   **Data Residency:** All customer data processed by the Rucio Intelligence engine (Gemini) is transient unless explicitly saved to the CRM state.

## 3. CI/CD Pipeline Rules

The DevOps agent (Antigravity) is responsible for the transition from Code to Cloud.

### 3.1 Pipeline Triggers
*   **Push to `dev` branch:** Triggers "Staging" deployment.
    *   Target: `rucio-crm-staging` (Cloud Run Service)
*   **Push to `main` branch:** Triggers "Production" deployment.
    *   Target: `rucio-crm-prod` (Cloud Run Service)

### 3.2 Build Steps (Cloud Build / GitHub Actions)
1.  **Checkout:** Pull code from repository.
2.  **Lint/Test:** Run `npm run lint` and `npm run build` (Defined in SW Factory).
3.  **Build Container:**
    ```bash
    docker build -t us-central1-docker.pkg.dev/[PROJECT]/rucio-repo/app:$COMMIT_SHA .
    ```
4.  **Push:** Push image to Artifact Registry.
5.  **Deploy:**
    ```bash
    gcloud run deploy rucio-crm \
      --image us-central1-docker.pkg.dev/[PROJECT]/rucio-repo/app:$COMMIT_SHA \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-secrets="API_KEY=projects/[PROJECT_ID]/secrets/GEMINI_API_KEY:latest"
    ```

## 4. Environment Variables Strategy

*   **Build Time (`ARG`):**
    *   `VITE_APP_VERSION`: Injected during Docker build.
*   **Runtime (`ENV`):**
    *   `API_KEY`: The Google GenAI API key. **MUST NOT** be hardcoded in the Docker image. It must be injected via Secret Manager mount or environment variable injection during `gcloud run deploy`.

---
**Status:** Architecture Definition Approved.
**Action:** Configure GCP Project and enable Artifact Registry.