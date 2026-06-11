# Expensely – Technical Documentation

## 1. System Architecture

### 1.1 High-level architecture

- **Client:** React web application (PWA capable)
- **API layer:** Axios-based API client in the frontend
- **Server:** Node.js + Express.js backend
- **Database:** MongoDB Atlas accessed via Mongoose
- **Auth:** Firebase Authentication for user sign-in, plus JWT to protect backend APIs

### 1.2 Component flow

React frontend

↓

Axios API layer

↓

Express backend

↓

MongoDB Atlas

## 2. Frontend Architecture

### 2.1 Technology stack

- React 19
- Vite
- TailwindCSS
- React Router
- React Query
- Chart.js
- Firebase Authentication
- Tesseract.js
- IndexedDB (idb)
- PWA support

### 2.2 Routing and pages

**Pages (routes) listed in the source:**

- Dashboard
- Expenses
- Budgets
- Analytics
- Groups
- Receipt Scanner
- Login

**Routing mechanism:** React Router

### 2.3 Data fetching and state

- **Server state / caching:** React Query
- **API calls:** Axios API layer (see section 8)
- **Offline persistence:** IndexedDB via idb (see section 7)

### 2.4 Visualization

- **Charts:** Chart.js (used by Analytics and/or Dashboard as applicable)

### 2.5 OCR feature integration

- Uses Tesseract.js in the OCR flow described in section 6

## 3. Backend Architecture

### 3.1 Technology stack

- Node.js
- Express.js
- JWT authentication
- MongoDB Atlas
- Mongoose

### 3.2 API route structure

The backend exposes the following route groups:

- `/api/auth`
- `/api/expenses`
- `/api/budgets`
- `/api/ocr`
- `/api/groups`
- `/api/shared-expenses`

### 3.3 Responsibilities

- **Authentication and authorization:** JWT-protected APIs (see section 5)
- **Domain services:** Expense tracking, budgets, groups, shared expenses
- **OCR support:** `/api/ocr` route group (implementation details not specified)

## 4. Database Design

### 4.1 Database technology

- MongoDB Atlas
- Mongoose ODM

### 4.2 Data models

Models listed in the source:

- User
- Expense
- Budget
- Group
- SharedExpense

### 4.3 Model details

- **Not specified:** Field-level schemas, indexes, relationships, and validation rules

## 5. Authentication Flow

### 5.1 Stated flow

Firebase Authentication

↓

JWT protected APIs

### 5.2 Documented behavior (from source)

- Users authenticate using **Firebase Authentication**.
- Backend APIs are protected using **JWT**.

### 5.3 Not specified

- JWT issuance mechanism and lifecycle (who issues the JWT, token exchange details)
- Refresh strategy and token expiration settings
- How Firebase identity is mapped to backend users

## 6. OCR Flow

### 6.1 Stated flow

Tesseract.js

↓

Extract receipt data

↓

Create expense entry

### 6.2 Not specified

- OCR execution location details (client vs server responsibilities beyond the above)
- Field extraction rules, validation, and error handling
- How extracted data maps to the Expense model

## 7. Offline Sync Architecture

### 7.1 Offline capability

- **Offline support:** Present
- **Local storage:** IndexedDB (idb)
- **PWA support:** Present

### 7.2 Not specified

- Sync triggers (background, on reconnect, manual)
- Conflict resolution strategy
- Queueing model for offline writes
- Data consistency guarantees and retry policies

## 8. API Layer Design

### 8.1 Client API layer

- The frontend uses an **Axios API layer** to communicate with the Express backend.

### 8.2 Server API

- Express route groups under `/api/*` (see section 3.2)

### 8.3 Not specified

- Endpoint-level contracts (request/response schemas)
- Error handling conventions
- Pagination, filtering, sorting patterns
- API versioning strategy

## 9. Security Design

### 9.1 Authentication and protection

- Backend APIs are **JWT-protected**.
- User sign-in uses **Firebase Authentication**.

### 9.2 Not specified

- Authorization model (roles, permissions, resource ownership checks)
- Input validation and sanitization approach
- Rate limiting, abuse prevention, and logging strategy
- Secrets management, CORS policy, and security headers

## 10. Testing Strategy

### 10.1 Frontend testing

- Vitest
- React Testing Library

### 10.2 Not specified

- Backend testing approach (framework, coverage targets)
- End-to-end testing strategy
- Test environments and CI setup

## 11. Deployment Architecture

### 11.1 Hosting

- **Frontend:** Vercel
- **Backend:** Render

### 11.2 Database

- MongoDB Atlas

### 11.3 Not specified

- Environment variable strategy and secret storage details
- Deployment pipelines (manual vs CI/CD)
- Observability (monitoring, tracing, logs)

## 12. Scalability Considerations

### 12.1 Current scalability levers implied by architecture

- React Query can reduce redundant network calls through caching.
- MongoDB Atlas provides a managed database platform.
- Separately deployed frontend (Vercel) and backend (Render) allow independent scaling.

### 12.2 Not specified

- Horizontal scaling strategy for the backend
- Database indexing and performance strategy
- Caching strategy beyond client-side caching
- Background job processing for OCR or async workflows
- Rate limits and multi-tenant considerations

---

### Appendix A: Feature inventory (from source)

- Firebase Google login
- OCR receipt scanning
- Expense tracking
- Budget management
- Analytics dashboard
- Offline support
- Group expense tracking
- Shared expense settlement