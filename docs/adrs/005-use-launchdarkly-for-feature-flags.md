# 005 Use LaunchDarkly for Feature Flags

*   **Date:** 2025-12-30
*   **Status:** Accepted
*   **Decision:** Use **LaunchDarkly** for feature flagging and management.
*   **Context:**
    *   **Continuous Delivery:** We follow a CI/CD approach where code is merged frequently. We need to decouple *deployment* (code on device) from *release* (feature visible to user).
    *   **Risk Mitigation:** Complex features (like specific TTS engines or PDF support) should be rolled out gradually or hidden behind flags during development.
    *   **Configuration:** We need to remotely configure values (e.g., API endpoints, limits) without shipping a new app binary.
*   **Options:**
    1.  **LaunchDarkly (Selected):**
        *   *Pros:* Industry standard, excellent React Native SDK, supports complex targeting (User ID, Device Version), real-time updates.
        *   *Cons:* Paid service (though has free/starter tiers), requires network to fetch initial flags (though caches well).
    2.  **Firebase Remote Config:**
        *   *Pros:* Free, integrated with Analytics.
        *   *Cons:* Updates can be slow (caching policies), less developer-centric DX for true "Feature Flagging" (vs A/B testing).
    3.  **Environment Variables / Hardcoded Config:**
        *   *Pros:* Simple.
        *   *Cons:* Requires a new App Store build to change anything. High risk.
*   **Consequences:**
    *   **Implementation:** We will wrap the LaunchDarkly SDK in a `FeatureFlagProvider` to expose hooks like `useFeatureFlag('new-tts-engine')`.
    *   **Workflow:** Engineers must wrap new work in flags. Old flags must be cleaned up periodically to avoid technical debt.
    *   **Safety:** We can "Kill Switch" broken features instantly without waiting for Apple App Store review.
