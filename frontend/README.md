# Expensely

A full-stack personal finance tracker with offline support, receipt scanning via OCR, budget management, analytics, and group expense splitting.

## Features

- **Expense Tracking** — add, edit, and delete expenses with category tagging
- **Budget Management** — set monthly budgets, track variance, and view history
- **Receipt Scanner** — upload or photograph a receipt; OCR auto-fills title, amount, date, and merchant
- **Analytics** — spending breakdown by category, monthly bar chart, and cumulative trend line
- **Group Expenses** — create groups, add members, split costs equally or by custom share, and settle up
- **Offline Support** — full read/write when offline via IndexedDB; changes sync automatically when back online
- **PWA** — installable on mobile and desktop, with service worker caching for fast loads

---

## Project Structure

```
Expensely/
├── backend/          # Express API + MongoDB
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   └── server.js
└── Expensely/        # React frontend (Vite + Tailwind)
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── lib/
    │   ├── pages/
    │   └── tests/
    └── vite.config.js
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| State / Data | TanStack Query v5 |
| Charts | Chart.js + react-chartjs-2 |
| OCR | Tesseract.js |
| Offline DB | IndexedDB via `idb` |
| Auth | Firebase Authentication |
| Backend | Node.js, Express 5 |
| Database | MongoDB via Mongoose |
| Auth tokens | JSON Web Tokens |
| Testing | Vitest |
| Deployment | Vercel (backend + frontend) |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Firebase project (for authentication)

### 1. Clone the repo

```bash
git clone <repo-url>
cd Expensely
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd Expensely
cp .env.local.example .env.local
# Fill in your values in .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |

### Frontend — `Expensely/.env.local`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_FIREBASE_*` | Firebase web SDK config values |

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login / register via Firebase token |
| GET | `/api/auth/profile` | Get current user profile |
| GET | `/api/expenses` | List all expenses for the user |
| POST | `/api/expenses` | Create a new expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/budgets` | List budgets (optionally filtered by `?month=YYYY-MM`) |
| POST | `/api/budgets` | Upsert a monthly budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| POST | `/api/ocr/upload` | Save OCR-extracted data |
| GET | `/api/groups` | List groups for a user |
| POST | `/api/groups` | Create a group |
| POST | `/api/groups/:id/members` | Add a member to a group |
| DELETE | `/api/groups/:id/members/:userId` | Remove a member |
| GET | `/api/shared-expenses/group/:id` | List shared expenses for a group |
| POST | `/api/shared-expenses` | Add a shared expense |
| POST | `/api/shared-expenses/group/:id/settle` | Settle all expenses in a group |
| GET | `/api/shared-expenses/group/:id/summary` | Get balance summary for a group |

---

## Testing

Both projects use Vitest. All tests are unit tests — no database or network required.

```bash
# Backend (20 tests)
cd backend && npm test

# Frontend (15 tests)
cd Expensely && npm test
```

See [TESTING.md](../TESTING.md) for full documentation on test files, what each test covers, and known compatibility notes.

---

## Deployment

Both projects deploy to Vercel as two separate projects from the same repository.

### Backend — `backend/`

1. In the Vercel dashboard, create a new project and set the **Root Directory** to `backend`
2. Vercel will detect `backend/vercel.json` automatically — no further build config needed
3. Add the following environment variables in the Vercel project settings:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret string |
| `FIREBASE_PROJECT_ID` | From Firebase Console |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account JSON |
| `FIREBASE_CLIENT_EMAIL` | From Firebase service account JSON |
| `NODE_ENV` | `production` |

4. After deployment, copy the assigned URL (e.g. `https://expensely-backend.vercel.app`)

### Frontend — `Expensely/`

1. In the Vercel dashboard, create a second new project and set the **Root Directory** to `Expensely`
2. Vercel will detect `Expensely/vercel.json` automatically
3. Add the following environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-backend>.vercel.app/api` |
| `VITE_FIREBASE_API_KEY` | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | From Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | From Firebase Console |

---

## Offline Behaviour

When the device loses connectivity:

- Expenses are read from and written to IndexedDB
- Every create / update / delete is queued in a sync queue
- When the device comes back online, the queue is automatically flushed to the server
- Pending-sync items are marked in the UI with an indicator

The sync logic is in `src/lib/sync.js` and the IndexedDB layer is in `src/lib/db.js`.
