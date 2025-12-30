# 003 Use Native OS TTS Initially

*   **Date:** 2025-12-30
*   **Status:** Accepted
*   **Decision:** Use **Native OS TTS (`expo-speech`)** for the initial release (v1), **encapsulated behind a generic TTS Adapter Interface** to ensure future extensibility.
*   **Context:**
    *   **Cost & Speed:** The primary goal for v1 is to deliver a usable product quickly with minimal operating costs. Commercial cloud TTS APIs (OpenAI, AWS Polly) are prohibitively expensive for long-form reading (entire books).
    *   **Usability:** The app must work offline and have near-zero latency when finding/starting playback.
    *   **Future Vision:** Users desire "Natural" sounding voices. We have internal capabilities/interest in **Chatterbox** (On-device ONNX models or Self-hosted Cloud) which can provide high-quality inference without the per-character cost of public APIs.
*   **Options:**
    1.  **Native OS TTS (Selected for v1):**
        *   *Pros:* Free, Offline, Zero Latency, Privacy-preserving.
        *   *Cons:* "Robotic" quality compared to neural models.
    2.  **Public Cloud APIs (OpenAI/ElevenLabs):**
        *   *Pros:* Best-in-class audio.
        *   *Cons:* Very expensive for long books. Requires constant internet. High latency.
    3.  **Chatterbox (Future Target):**
        *   *Variant A (On-Device):* Running ONNX models locally (e.g. CoreML). Zero cost, offline, high quality. *Risks:* High memory usage, battery drain, complex implementation.
        *   *Variant B (Self-Hosted Cloud):* Hosting our own inference (e.g. GPU container). Lower cost than APIs, but requires infrastructure management.
*   **Consequences:**
    *   **Architecture:** We must implement a **TTS Adapter Interface**. The rest of the app should not know *which* engine is speaking.
        *   interface: `speak(text)`, `pause()`, `setRate()`, `onProgress(callback)`.
    *   **Migration Path:** This allows us to ship v1 next week with `NativeAdapter`, and later swap in `ChatterboxAdapter` (On-Device) purely as an implementation detail, without rewriting the UI or Book logic.
