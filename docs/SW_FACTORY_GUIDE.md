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

## 2. Coding Standards & Architecture

### 2.1 File Structure (Flat Architecture)
**CRITICAL:** This project does **NOT** use a `src/` directory. All source code resides at the project root to simplify imports and build configuration.

*   `./App.tsx`: Main entry point.
*   `./types.ts`: Central type definitions (Data Models).
*   `./components/`: React UI components.
*   `./services/`: External integrations (Gemini, Odoo).
*   `./utils/`: Shared utilities.

### 2.2 Localization (Spanish & Currency)
The application target audience is Spanish-speaking (Latam/Spain).
*   **Locale:** strictly `es-ES` for formatting (Periods for thousands, commas for decimals).
*   **Formatting Utility:** ALWAYS use `utils/formatting.ts` for displaying numbers.
    *   `formatCurrency(value, currency)` -> e.g., "1.000,00 €"
    *   `formatNumber(value)` -> e.g., "1.200"
*   **UI Labels:** All hardcoded text must be in **Spanish**.

### 2.3 State Management
*   **Data:** The app uses `initialDeals`, `initialContacts`, etc. in `types.ts` as the mock database.
*   **Exchange Rates:** Managed globally in `App.tsx` and passed down to `CanvasWorkspace` for multi-currency calculations.

## 3. Development Workflow

The SW Factory operates on a "Local First" principle. All features must be verifiable locally before pushing to the remote repository.

### 3.1 Running the App
To start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
# Server will start at http://localhost:5173
```

### 3.2 AI Service Mocking
The `services/geminiService.ts` handles AI calls. If no API key is present, the service includes fallback/mock returns to ensure the UI does not break during offline development.

## 4. Code Quality & Testing

Before committing changes, the Factory Agent must ensure the build is stable.

### 4.1 Linting
Ensure code style consistency:
```bash
# Check for errors
npm run lint
```

### 4.2 Production Build Simulation
To ensure the app packages correctly for the DevOps team:

```bash
# 1. Build the production bundle
npm run build

# 2. Preview the build locally (serves the 'dist' folder)
npm run preview
```
*If `npm run build` fails, the commit is rejected.*

## 5. Git Handover Protocol

The SW Factory hands off code to DevOps via Git commits.

1.  **Stage Changes:** `git add .`
2.  **Commit:** Use Conventional Commits.
    *   `feat: added multi-currency support to deal card`
    *   `fix: moved formatting utils to root`
    *   `chore: translated sidebar to spanish`
3.  **Push:**
    *   `git push origin feature/my-feature` (for PR)
    *   `git push origin main` (only if authorized for direct release)

---
**Status:** Operational Guide Active.
**Next Step:** Await tasks from Product Owner.