# 001 React Native with Expo as Mobile Framework

*   **Date:** 2025-12-30
*   **Status:** Accepted
*   **Decision:** Use **React Native with Expo (Managed Workflow)**.

## Context
We are building a mobile "VoiceReader" app. We need a balance between development speed, distinct UI customizability, and access to native device features (TTS, File System). The goal is a high-quality "minimum lovable product" (MLP) quickly.

## Options
1.  **React Native (Bare/CLI):** Standard approach. Offers full control but requires managing Xcode/Android Studio projects manually. Slower build times/setup.
2.  **Swift/Kotlin (Native):** Best performance and APIs. High maintenance (two codebases), slower feature parity.
3.  **Flutter:** Great UI performance. Requires Dart (learning curve) and a different ecosystem.
4.  **Expo (Managed Workflow):** Wrapper around React Native. Pre-configured native modules (`expo-speech`, `expo-file-system`), fast refresh, no native build folder management for v1.

## Consequences
*   **Positive:**
    *   Rapid development cycle (Expo Go).
    *   Access to high-quality libraries for our core needs (`expo-speech` for TTS, `expo-document-picker` for loading books).
    *   Consistent cross-platform behavior.
    *   Ease of Over-the-Air (OTA) updates for quick bug fixes.
*   **Negative:**
    *   Native dependency limitations (though "Config Plugins" solve most of this).
    *   Slightly larger app binary size.
    *   Binding to Expo SDK release cycles.
