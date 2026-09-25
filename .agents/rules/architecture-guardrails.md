# Architectural Guardrails & System Directives

These guardrails are permanent, non-negotiable architectural constraints for all development on the **Shelf Life** project. All future agent turns and engineers must adhere to them strictly.

---

### 1. PROJECT INDEX MANDATE
The AI must **ALWAYS read [`PROJECT_INDEX.md`](file:///d:/Users/bfezu/Coding%20Projects/Shelf_Life/PROJECT_INDEX.md) before writing or modifying any code** to locate existing utilities, types, singletons, and schemas to prevent duplicate implementations.
- Before introducing any new function, model, or helper, verify whether a canonical version already exists in the index.
- If a new module, singleton, engine, or store is introduced or modified, immediately regenerate the index via `npm run index`.

---

### 2. DUMB UI / UNIDIRECTIONAL DATA FLOW
UI components must remain **clean presentation layers**.
- Business logic, hardware I/O, network requests/polling, file parsing, and state transitions **MUST** live in headless stores (e.g., Zustand/XState, reactive store modules) or core engine services.
- Components only subscribe to state slices and emit user action intents.
- No direct database/storage access (`localStorage`, `IndexedDB`, `fetch`) directly embedded in presentation templates or component render trees.

---

### 3. ZERO COMPONENT TIMERS
The AI is **strictly FORBIDDEN** from using `setInterval` or `setTimeout` inside UI components (React/Alpine/vanilla view templates) for application mechanics, reading session duration tracking, cooldowns, or core logic.
- All clocks and tickers must run inside dedicated headless services, Web Workers, or dedicated headless custom hooks.
- Components only display formatted ticker/duration values emitted by these services.

---

### 4. CHECK BEFORE CREATING
Before declaring any new state, ref, event listener, or utility function, the AI **MUST** verify whether an existing store, manager, or hook already handles it.
- **Duplicate state is an architectural error.**
- Never create parallel sources of truth for book records, session metrics, reading speeds, or modal states.
- If existing functionality is insufficient, refactor or extend the existing canonical store rather than creating an ad-hoc local state duplicate.

---

### 5. THE 400-LINE COMPONENT CEILING
**No UI file may exceed 400 lines of code.**
- The moment a feature or view grows larger than 400 lines, the AI must proactively decompose it into focused sub-components, dedicated sub-views, or modular tabs rather than allowing monolithic mega-files.
- Legacy monolithic files (such as `app.js` and `index.html`) must be incrementally carved into modular headless stores and view components during active feature development.
