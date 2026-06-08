# Expensely — Testing Documentation

## Overview

Expensely uses [Vitest](https://vitest.dev/) as the test framework across both the backend and frontend. All tests are unit tests — no database connections or real network calls are made.

| Project | Test Files | Tests | Environment |
|---|---|---|---|
| `backend/` | 3 | 20 | Node.js |
| `Expensely/` (frontend) | 2 | 15 | jsdom |
| **Total** | **5** | **35** | |

---

## Running Tests

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd Expensely
npm test
```

### Watch mode (re-runs on file change)

```bash
npm run test:watch
```

### Coverage report

```bash
npm run test:coverage
```

---

## Configuration

### Backend — `backend/vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'vmForks',
  }
});
```

- `environment: 'node'` — tests run in a plain Node.js context, no browser globals
- `pool: 'vmForks'` — required for compatibility with Node.js v25+; uses VM-isolated child processes instead of worker threads

### Frontend — `Expensely/vite.config.js` (test section)

```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/tests/setup.js',
  pool: 'vmForks',
}
```

- `environment: 'jsdom'` — simulates a browser DOM for React/browser API tests
- `globals: true` — makes `describe`, `it`, `expect` available without importing
- `setupFiles` — runs `setup.js` before each test file to load `@testing-library/jest-dom` matchers
- `pool: 'vmForks'` — same Node.js v25+ compatibility requirement as backend

---

## Test Files

### Backend

#### `backend/tests/auth.test.js` — JWT Auth Utilities (5 tests)

Tests the token generation and verification logic used by the auth middleware.

| Test | What it checks |
|---|---|
| generateToken returns a non-empty string | Token is a non-empty string |
| verifyToken decodes a valid token correctly | Decoded payload contains `userId` and `firebaseUid` |
| verifyToken returns null for invalid token | Malformed token returns `null` |
| verifyToken returns null for tampered token | Signature mismatch returns `null` |
| token contains userId and firebaseUid in payload | `toMatchObject` check on decoded payload |

No mocks needed — `jsonwebtoken` is used directly with a fixed test secret (`'test-secret'`).

---

#### `backend/tests/expenses.test.js` — Expense Logic (7 tests)

Tests Mongoose-style query patterns using a fully mocked `Expense` model object (no real database).

| Test | What it checks |
|---|---|
| find returns list of expenses for user | Returns all expenses, first item has correct title |
| find returns empty array when user has no expenses | Empty array for unknown user |
| findByIdAndUpdate returns updated expense | Updated fields are reflected in result |
| findByIdAndUpdate returns null for non-existent expense | Returns `null` for missing ID |
| findByIdAndDelete returns deleted expense | Deleted document is returned |
| findByIdAndDelete returns null for non-existent id | Returns `null` for missing ID |
| expense amount must be a positive number | Valid/invalid amount boundary logic |

Mock setup:
```js
const Expense = {
  find: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
};
```

---

#### `backend/tests/budgets.test.js` — Budget Logic (8 tests)

Tests Mongoose-style query patterns using a fully mocked `Budget` model object.

| Test | What it checks |
|---|---|
| find returns all budgets for a user | Returns 2 budgets for user1 |
| find with month filter returns specific budget | Filtered result has correct `budgetAmount` |
| findOneAndUpdate upserts a new budget | New document created with correct fields |
| findOneAndUpdate updates existing budget | Existing `budgetAmount` is updated |
| findByIdAndDelete removes a budget | Deleted document is returned |
| findByIdAndDelete returns null for missing budget | Returns `null` for unknown ID |
| budget percentage calculation is correct | `(spent / budget) * 100` rounds to 80% |
| over-budget variance is negative | `budget - spent` is negative when over budget |

Mock setup mirrors the same pattern as expenses — `Budget.find` returns a chainable object with a `.sort()` mock to simulate Mongoose's query builder.

---

### Frontend

#### `Expensely/src/tests/ocr.test.js` — OCR Parsing Utilities (8 tests)

Tests the three pure text-parsing functions from `src/lib/ocr.js`. The functions are inlined directly in the test file so no import or `Tesseract.js` execution is needed. `tesseract.js` itself is mocked to avoid worker/WASM loading in jsdom.

| Test | What it checks |
|---|---|
| parseMerchantName extracts first line as merchant | First non-empty line is returned |
| parseMerchantName returns empty string for empty text | Empty string input → empty string output |
| parseTotalAmount extracts total from keyword line | `Total: 250` → `250` |
| parseTotalAmount extracts grand total | `Grand Total: 450.50` → `450.5` |
| parseTotalAmount falls back to largest amount | Largest decimal number when no keyword matches |
| parseTotalAmount returns null for no amounts | No numeric content → `null` |
| parseDate extracts DD/MM/YYYY format | Result matches `YYYY-MM-DD` ISO format |
| parseDate returns today for no date found | Falls back to today's date |

---

#### `Expensely/src/tests/sync.test.js` — Sync Utilities (7 tests)

Tests `syncPendingActions`, `syncFromServer`, and `isOnline` from `src/lib/sync.js`.

Both `src/lib/api.js` and `src/lib/db.js` are fully mocked so no real HTTP requests or IndexedDB access occurs.

| Test | What it checks |
|---|---|
| syncPendingActions returns 0 synced when queue is empty | Empty queue → `{ synced: 0, failed: 0 }` |
| syncPendingActions processes CREATE_EXPENSE action | Calls `expensesApi.create` with payload, increments `synced` |
| syncPendingActions processes DELETE_EXPENSE action | Calls `expensesApi.delete` with `_id`, increments `synced` |
| syncPendingActions counts failed when API throws | Network error increments `failed`, not `synced` |
| syncFromServer saves expenses and budgets locally | Calls `saveLocalExpenses` and `saveLocalBudgets`, returns `true` |
| syncFromServer returns false on network failure | API rejection → returns `false` |
| isOnline returns a boolean | `typeof isOnline()` is `'boolean'` |

**Mock pattern used:**

Because of ESM live binding behaviour with the `vmForks` pool, mocks are created with `vi.hoisted()` and registered using absolute file paths:

```js
const mocks = vi.hoisted(() => ({
  expensesApi: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), getAll: vi.fn() },
  budgetsApi: { upsert: vi.fn(), delete: vi.fn(), get: vi.fn() },
  getSyncQueue: vi.fn(),
  // ...
}));

vi.mock('/c:/Expensely/Expensely/src/lib/api.js', () => ({
  expensesApi: mocks.expensesApi,
  budgetsApi: mocks.budgetsApi,
}));
```

All mock interactions inside tests reference `mocks.*` directly rather than the imported binding.

---

## Known Compatibility Notes

### Node.js v25 + Vitest v4

The default `threads` pool in Vitest v4 crashes on Node.js v25 with:

```
TypeError: Cannot read properties of undefined (reading 'config')
```

This affects all test files and shows `import 0ms / tests 0ms` in the duration output, meaning tests never actually run. The fix is `pool: 'vmForks'` in the vitest config, which uses VM-isolated child processes and is stable on Node.js v25.

### ESM Mock Hoisting (`sync.test.js`)

Standard `vi.mock('../lib/db', () => ({ ... }))` with relative paths does not reliably intercept module imports made by `sync.js` when running under `vmForks` + jsdom. Two fixes are applied:

1. **`vi.hoisted()`** — ensures mock `vi.fn()` instances are created before any ESM `import` statements are evaluated
2. **Absolute paths in `vi.mock()`** — ensures Vitest intercepts the exact same module instance that `sync.js` imports, regardless of relative path resolution differences in the VM context
