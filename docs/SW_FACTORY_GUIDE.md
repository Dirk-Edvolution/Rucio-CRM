# Rucio CRM: Software Factory Guidelines
> **Target Audience:** Claude Code Agent / Frontend Developers
> **Environment:** Local Workstation (Debian Linux) & Visual Studio Code

## 1. Local Environment Setup (Debian Linux)

This guide assumes a Debian-based environment (Debian 11/12 or Ubuntu 20.04+).

### 1.1 Prerequisites
Ensure the workstation has the following installed:

```bash
# 1. Update Repositories
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v18 LTS or v20 LTS required)
# Using NodeSource for up-to-date versions
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Git
sudo apt install -y git

# 4. Global Dependencies (Optional but recommended)
sudo npm install -g typescript vite
```

### 1.2 Project Initialization
Clone and setup the repo locally:

```bash
# Install dependencies
npm install
```

### 1.3 Local Configuration (.env)
Create a `.env.local` file in the root directory to emulate production secrets.
**Note:** This file is git-ignored. DO NOT commit it.

```properties
# .env.local
# Get a free key from aistudio.google.com
VITE_API_KEY=AIzaSy...YourKeyHere
```

## 2. Development Workflow

The SW Factory operates on a "Local First" principle. All features must be verifiable locally before pushing to the remote repository.

### 2.1 Running the App
To start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
# Server will start at http://localhost:5173
```

### 2.2 Mocking Strategy
*   **Data:** The app currently uses `initialDeals` and `initialContacts` in `src/types.ts` as the database.
*   **AI Service:** The `services/geminiService.ts` handles AI calls. If no API key is present, it should fail gracefully or mock the response (ensure robust error handling).

## 3. Code Quality & Testing

Before committing changes, the Factory Agent must ensure the build is stable.

### 3.1 Linting
Ensure code style consistency:
```bash
# Check for errors
npm run lint
```

### 3.2 Production Build Simulation
To ensure the app packages correctly for the DevOps team:

```bash
# 1. Build the production bundle
npm run build

# 2. Preview the build locally (serves the 'dist' folder)
npm run preview
```
*If `npm run build` fails, the commit is rejected.*

## 4. Git Handover Protocol

The SW Factory hands off code to DevOps via Git commits.

1.  **Stage Changes:** `git add .`
2.  **Commit:** Use Conventional Commits.
    *   `feat: added magic dropzone`
    *   `fix: resolved sidebar overlap`
    *   `chore: updated dependencies`
3.  **Push:**
    *   `git push origin feature/my-feature` (for PR)
    *   `git push origin main` (only if authorized for direct release)

## 5. Troubleshooting Common Debian Issues

*   **EACCES errors:** Avoid running npm with `sudo`. If permissions are broken, run:
    ```bash
    sudo chown -R $USER:$(id -gn $USER) ~/.npm
    ```
*   **System Limit Watchers:** If Vite complains about file watchers:
    ```bash
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
    ```

---
**Status:** Operational Guide Active.
**Next Step:** Await tasks from Product Owner.