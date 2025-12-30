# 006 Use GitHub Actions for CI/CD

*   **Date:** 2025-12-30
*   **Status:** Accepted
*   **Decision:** Use **GitHub Actions** for Continuous Integration and Deployment.
*   **Context:**
    *   **Automation:** We need to verify code quality (lint, test) on every push and eventually automate deployment to Expo/App Store.
    *   **Integration:** The code is hosted on GitHub.
*   **Options:**
    1.  **GitHub Actions (Selected):**
        *   *Pros:* Zero setup (integrated with repo), free tier for public/small private repos, massive marketplace of actions (`expo-github-action`).
        *   *Cons:* Can get expensive if build minutes scale up (though sufficient for v1).
    2.  **CircleCI / Travis:**
        *   *Pros:* Advanced caching and parallelism.
        *   *Cons:* Separate account, billing, and configuration.
    3.  **Expo Application Services (EAS) Build:**
        *   *Pros:* The "Native" way to build Expo apps.
        *   *Note:* We *will* use EAS for the actual *Build* step (compiling the binary), but GitHub Actions will act as the *Orchestrator* (running tests, linting, and triggering the EAS build).
*   **Consequences:**
    *   **Configuration:** We define workflows in `.github/workflows`.
    *   **Secrets:** We must manage repository secrets (EXPO_TOKEN, etc.) in GitHub Settings.
