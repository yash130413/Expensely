# Expensely — AI Assisted Development Log

**AI tools used:** Cursor, Antigravity, ChatGPT

### Development timeline

- **Day 0 — Project setup & architecture**
    - Initialize React 19 + Vite + TailwindCSS frontend
    - Initialize Node.js + Express backend
    - Decide auth strategy: Firebase Authentication + JWT for API protection
    - Create MongoDB Atlas cluster + Mongoose connection
- **Day 1 — Core data models & CRUD**
    - Implement User, Expense, Budget schemas
    - Build expenses CRUD APIs and client pages
    - Add React Query patterns for fetch, cache, optimistic updates
- **Day 2 — Analytics & UX**
    - Add dashboard + analytics with Chart.js
    - Add filtering, date ranges, category breakdowns
    - Add offline-first storage for drafts and queued requests (IndexedDB)
- **Day 3 — Groups & shared expenses**
    - Implement Group and SharedExpense schemas
    - Add group management UI and settlement flows
    - Handle permissions and membership checks on backend
- **Day 4 — Receipt scanning (OCR)**
    - Integrate Tesseract.js flow for receipt parsing
    - Add server endpoint for normalized parsing + validation
    - Build “review extracted fields” UI before creating an Expense
- **Day 5 — Deployment & stabilization**
    - Deploy frontend to Vercel, backend to Render
    - Add logging, env var checks, CORS hardening
    - Add Vitest + RTL coverage for critical flows

### Prompt categories

- **Architecture & planning**
- **Backend APIs and database modeling**
- **Frontend UI and state management**
- **Authentication and security**
- **OCR extraction and parsing**
- **Offline support and sync**
- **Deployment and environment config**
- **Testing and QA**

### Backend development prompts

- “Given an Express + Mongoose API, generate a clean `Expense` schema for: amount, currency, category, merchant, date, notes, receiptImageUrl, createdBy (User ref), groupId (optional). Include indexes for `createdBy` + `date`.”
- “Write an Express route handler for `GET /api/expenses` that supports query params: `from`, `to`, `category`, `groupId`, `minAmount`, `maxAmount`, and returns paginated results. Use Mongoose filters safely.”
- “Design a consistent error format for the API (statusCode, code, message, details) and show middleware for handling validation errors and JWT failures.”
- “Implement `/api/budgets` endpoints with a rule: budgets are unique per user per month. Show schema constraints and upsert flow.”
- “Add server-side authorization: only allow an expense update if `expense.createdBy === req.user.id` or the user is a member of `expense.groupId`. Provide code.”

### Frontend development prompts

- “Generate React Router routes for: Dashboard, Expenses, Budgets, Analytics, Groups, Receipt Scanner, Login. Add a protected route wrapper that checks Firebase auth state and a server JWT.”
- “Create a React Query setup with an Axios instance that attaches the server JWT and refreshes it when expired.”
- “Build an Expenses page UI using Tailwind with: search, category filter, date range, and a drawer modal for add/edit expense. Include form validation patterns.”
- “Implement optimistic updates for expense creation and rollback on server error. Show how to keep the analytics charts in sync.”
- “Propose a PWA-friendly offline UX: show a banner when offline, queue new expenses in IndexedDB, and sync when connectivity returns.”

### Authentication prompts

- “Describe an auth flow where users sign in with Firebase Google login, then the frontend calls `/api/auth/session` to exchange Firebase ID token for a server JWT. Provide API + client code sketches.”
- “List the security checks required on the backend to verify the Firebase ID token before issuing the JWT. Include token verification using Firebase Admin SDK.”
- “Create a JWT middleware for Express with role support in the token claims (user, admin). Also show how to rotate JWT signing keys safely.”
- “Give CORS and cookie/header recommendations for a Vercel frontend calling a Render backend. Include local dev settings.”

### OCR integration prompts

- “Design the end-to-end OCR flow: user uploads/captures receipt → Tesseract.js extracts text → parse into fields → user reviews → create expense. Provide a step-by-step UI plan.”
- “Write a robust receipt parsing approach that handles common patterns: totals, taxes, dates, and multi-currency symbols. Include fallback rules and confidence scoring.”
- “Create an API contract for `/api/ocr/parse` that accepts raw OCR text + optional locale and returns normalized fields (merchant, date, line items, total, currency, confidence).”
- “How do we prevent duplicate expenses from repeated scans? Propose a dedupe strategy using hash of merchant + date + total + last4 of card (if present).”

### Deployment prompts

- “Generate a production-ready environment variable checklist for Vercel (frontend) and Render (backend): API base URL, Firebase config, MongoDB URI, JWT secret, allowed origins.”
- “Write a Render deployment guide for Express: build command, start command, Node version pinning, health check endpoint, and logs.”
- “Show how to structure Axios base URL switching across dev/staging/prod with Vite env variables.”
- “Propose monitoring and alerting basics for this stack (request errors, latency, Mongo connection issues).”

### Testing prompts

- “Create a Vitest + React Testing Library test plan for: login redirect behavior, expenses CRUD UI, optimistic updates, and offline queue behavior.”
- “Write example tests for an Expenses form: validation, submit success, submit failure, and maintaining form state after an error.”
- “Suggest backend tests (unit + integration) for: JWT middleware, expenses filters, group authorization, and OCR parsing edge cases.”
- “Define a minimal CI checklist: lint, typecheck, unit tests, build, and a smoke test against a deployed preview.”

### Human contributions and manual engineering decisions

- **Architecture decisions**
    - Choose Firebase Authentication for fast, reliable Google login and avoid building password auth.
    - Use JWT-protected APIs to keep backend authorization explicit and auditable.
    - Prefer React Query for caching, request dedupe, and mutation handling across the app.
- **Security decisions**
    - Enforce server-side ownership checks even if the UI hides actions.
    - Validate and normalize user input at the API boundary (amounts, dates, currencies).
- **UX and product decisions**
    - Add a “review extracted receipt fields” step to prevent OCR mistakes from polluting data.
    - Make offline mode explicit with queued actions and clear sync status.
- **Data modeling decisions**
    - Separate `Group` and `SharedExpense` to keep personal expenses simple and add collaboration only when needed.
    - Keep expenses immutable for audit in shared contexts, using adjustments rather than destructive edits when appropriate.
- **Performance decisions**
    - Index expenses by user + date for fast dashboard queries.
    - Avoid heavy OCR work on the main thread by using workers where feasible.
- **Deployment decisions**
    - Split frontend and backend deployments to reduce coupling and simplify rollbacks.
    - Add a `/health` endpoint for Render health checks and basic uptime monitoring.