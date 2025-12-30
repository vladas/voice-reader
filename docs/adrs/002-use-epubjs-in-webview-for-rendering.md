# 002 Use Epub.js in WebView for E-book Rendering

*   **Date:** 2025-12-30
*   **Status:** Accepted
*   **Decision:** Use **`epub.js`** running within a **WebView** configured for continuous scrolling.
*   **Context:**
    *   **Multi-Format Strategy:** We need to support EPUBs now, but plan for PDFs and Websites later. These formats handle rendering differently (Reflowable DOM vs Fixed Canvas).
    *   **Continuous Scroll:** A core requirement is reading in a continuous vertical scroll mode, rather than traditional pagination.
    *   **Synchronized Highlighting:** We must highlight the specific text segment being read by the TTS engine.
*   **Options:**
    1.  **Native Parser (React Native Text):** Extract raw text and render using native Views.
        *   *Pros:* High performance, native scroll feel.
        *   *Cons:* Loss of formatting (publisher styling, lists, images). Implementing text highlighting requires complex coordinate mapping (mapping audio time to character index to screen X/Y).
    2.  **`epub.js` (Paginated):** The default mode.
        *   *Pros:* Robust.
        *   *Cons:* Does not support vertical continuous scrolling seamlessly.
    3.  **`epub.js` (Continuous Manager) + WebView (Selected):**
        *   *Pros:* Handles parsing and publisher styling perfectly. Supports vertical scroll (manager: "continuous").
        *   *Highlighting Capabilities:* Leverages the DOM. We can use `epub.js`'s CFI (Canonical Fragment Identifier) system to identify text ranges and inject `<span class="highlight">` tags. The browser engine handles the complex geometry of wrapping text highlights across lines, which is difficult to do natively.
*   **Consequences:**
    *   **Positive:**
        *   **Future Proofing:** By using a WebView wrapper, we can implement a Strategy pattern. `EpubReader` uses WebView/epubjs. Future `PdfReader` can use a different underlying engine while sharing the same app-level "Player" interface.
        *   **Standard Highlighting:** Using DOM manipulation for highlights is robust.
        *   **Rich Formatting:** Preserves the "soul" of the book (fonts, layout) without effort.
    *   **Negative:**
        *   **Performance:** WebView has a memory overhead. Large chapters in "continuous" mode may require virtualization logic to prevent DOM bloat.
        *   **Complexity:** Requires a message bridge between React Native (App Logic) and WebView (Render Logic).
