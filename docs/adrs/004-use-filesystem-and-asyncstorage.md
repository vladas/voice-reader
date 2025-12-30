# 004 Use FileSystem and AsyncStorage for Persistence

*   **Date:** 2025-12-30
*   **Status:** Accepted
*   **Decision:** Use **FileSystem** for storing ebook files and **AsyncStorage** for library metadata and reading progress.
*   **Context:**
    *   **Data Types:** The app handles two distinct types of data:
        1.  **Heavy Assets:** EPUB files (can be 1MB to 100MB+).
        2.  **Structured Metadata:** List of imported books (title, author, cover path) and user state (current CFI location, theme settings).
    *   **Scale:** v1 is a personal reader. Expecting < 500 books, not millions of records.
    *   **Complexity:** We want to avoid the overhead of setting up a full SQL database (Snake/SQLite) or Realm if simple key-value storage suffices.
*   **Options:**
    1.  **FileSystem + AsyncStorage (Selected):**
        *   *Mechanism:* Copy imported books to `FileSystem.documentDirectory`. Store the index (array of book objects) in a single JSON blob in AsyncStorage.
        *   *Pros:* Extremely simple, zero native dependencies beyond standard Expo modules.
        *   *Cons:* `AsyncStorage` is slow for massive datasets, but fine for a few hundred items.
    2.  **SQLite (`expo-sqlite`):**
        *   *Pros:* Relational queries, scalable.
        *   *Cons:* Requires writing SQL, migrations, and ORM boilerplate. Overkill for v1.
    3.  **Core Data / Realm:**
        *   *Cons:* High complexity.
*   **Consequences:**
    *   **Simplicity:** We can implement a `BookRepository` that simply reads/writes a JSON file or Async Storage key.
    *   **Performance:** Loading the entire library list is instant for small collections. If the user imports 5,000 books, we might need to migrate to SQLite (ADR-005), but for v1, this is the optimal "Do Simple Things" approach.
    *   **Storage Management:** We must ensure we delete the physical file from FileSystem when the user "Deletes" a book from the UI.
