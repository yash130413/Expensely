## 1. Executive Summary

Expensely is a full-stack expense management web application that helps individuals and groups capture, categorize, and analyze expenses. It combines **OCR-powered receipt scanning** with **budgeting**, **shared expense tracking**, and **group settlement**, while supporting **offline-first usage** with reliable **cloud sync**.

## 2. Product Vision

Build the simplest, most reliable way to record and understand spending—whether managing personal finances or splitting costs with others—by minimizing manual entry and maximizing clarity through automation and insights.

## 3. Problem Statement

People struggle to keep expense records accurate and up-to-date because:

- Manual expense entry is time-consuming and error-prone.
- Receipts get lost and data is scattered across apps, messages, and spreadsheets.
- Shared expenses in groups create confusion around who paid, who owes what, and when to settle.
- Basic trackers lack actionable insights and a clear view against budgets.
- Connectivity constraints make it hard to log expenses on-the-go.

## 4. Goals and Objectives

### Goals

- Make capturing an expense effortless through receipt scanning and smart defaults.
- Provide a clear view of spending patterns and budget health.
- Enable seamless shared expense tracking and fair settlement.
- Ensure reliability with offline support and consistent sync.

### Objectives (measurable)

- Reduce median time to log an expense to **< 30 seconds** (manual + OCR).
- Achieve **> 85% OCR field extraction accuracy** on supported receipt types after user corrections.
- Enable a group to settle in **< 2 minutes** from opening the settlement view.
- Maintain **99.5%** backend uptime (monthly) and predictable sync behavior.

## 5. User Personas

### Persona A: Solo Tracker

- Tracks personal expenses monthly
- Wants quick logging and budgeting
- Pain: forgets entries, hates typing

### Persona B: Shared Household

- Shares recurring expenses with partner/roommates
- Wants transparency and low friction settlement
- Pain: confusion over “who paid what”

### Persona C: Group Traveler

- Tracks trip expenses across 3–10 people
- Needs multi-currency-ready flows (future)
- Pain: manual math, chasing payments

## 6. User Stories

### Authentication and onboarding

- As a user, I want to sign in with Google so I can start quickly without creating a password.
- As a user, I want a short onboarding checklist so I understand how to scan receipts and set budgets.

### Expense capture

- As a user, I want to scan a receipt and auto-fill vendor, date, and total so I can log expenses faster.
- As a user, I want to edit OCR results before saving so I can correct mistakes.
- As a user, I want to add an expense manually so I can track non-receipt spending.

### Categorization and budgets

- As a user, I want to categorize expenses so my analytics are meaningful.
- As a user, I want to set monthly budgets per category so I can avoid overspending.
- As a user, I want alerts when I exceed a budget threshold so I can adjust spending.

### Shared expenses and settlement

- As a user, I want to create a group and invite members so we can track shared expenses.
- As a user, I want to record who paid and how an expense is split so balances are accurate.
- As a user, I want to see who owes whom and a suggested settlement plan so we can close balances.

### Analytics

- As a user, I want charts of spending over time and by category so I can understand trends.
- As a user, I want to filter analytics by date range, category, and group so insights match my context.

### Offline and sync

- As a user, I want to add expenses offline so I’m not blocked without internet.
- As a user, I want automatic sync when connectivity returns so my data stays consistent across devices.

## 7. Functional Requirements

### 7.1 Authentication (Firebase Authentication)

- FR-1: Support Google sign-in.
- FR-2: Persist session across refresh.
- FR-3: Provide sign-out.
- FR-4: Store user profile (name, email, avatar) in database after first login.

### 7.2 Expense CRUD

- FR-5: Create expense with fields:
    - Amount (required)
    - Currency (default based on locale; v1 single currency per account acceptable)
    - Date (required)
    - Merchant / Vendor (optional)
    - Category (required; default “Uncategorized”)
    - Notes (optional)
    - Payment method (optional)
    - Receipt image (optional)
    - Source: Manual or OCR
    - Ownership context: Personal or Group
- FR-6: View expense list with sort and filters (date, category, group, amount range).
- FR-7: Edit expense.
- FR-8: Delete expense with confirmation.

### 7.3 OCR Receipt Scanner (Tesseract.js)

- FR-9: Upload or capture receipt image.
- FR-10: Run OCR in-browser (Tesseract.js) and extract:
    - Total amount
    - Date
    - Merchant (best effort)
- FR-11: Provide an “Review extracted fields” step before saving.
- FR-12: Store receipt image reference (cloud) and extracted text metadata.
- FR-13: Allow re-run OCR for the same receipt.

### 7.4 Expense Categorization

- FR-14: Maintain a default category set (e.g., Food, Transport, Groceries, Utilities, Entertainment, Shopping, Health, Travel, Other).
- FR-15: Allow users to create, rename, and archive custom categories.
- FR-16: Provide category suggestions based on merchant keywords (rule-based for v1).

### 7.5 Budget Management

- FR-17: Set monthly budget at overall and category levels.
- FR-18: Show budget consumption progress (amount spent vs budget).
- FR-19: Provide threshold alerts (e.g., 80%, 100%) as in-app notifications.

### 7.6 Shared Expense Tracking

- FR-20: Create groups with name, description, and members.
- FR-21: Invite members via share link or email (v1 can start with share link only).
- FR-22: Create group expenses with:
    - Payer
    - Participants
    - Split method: equal split (v1), custom amounts (v1.1)
- FR-23: Maintain per-group member balances.

### 7.7 Group Expense Settlement

- FR-24: Show net balances (who owes / is owed).
- FR-25: Provide suggested settlement transactions to minimize number of payments.
- FR-26: Allow marking a settlement as “recorded” to reset balances (v1: manual record only; no payment integration).

### 7.8 Analytics Dashboard (Chart.js)

- FR-27: Provide dashboards for:
    - Spending over time (line chart)
    - Spending by category (bar/pie)
    - Budget vs actual (stacked or progress)
    - Group balances snapshot
- FR-28: Filters: time range (week/month/custom), category, group.
- FR-29: Export basic reports (CSV for v1.1).

### 7.9 Offline Support and Cloud Sync

- FR-30: Offline-first expense creation and edits using local persistence.
- FR-31: Sync queue that retries on reconnect.
- FR-32: Conflict handling:
    - v1: last-write-wins with visible “updated at” timestamps
    - Log conflicts for debugging
- FR-33: Indicate sync status in UI (synced, pending, error).

## 8. Non-Functional Requirements

### Security and privacy

- NFR-1: Use secure authentication (Firebase) and protect API endpoints.
- NFR-2: Store minimal PII.
- NFR-3: Encrypt data in transit (HTTPS).
- NFR-4: Implement authorization checks for group membership and expense access.

### Performance

- NFR-5: Expense list initial load under **2 seconds** for 500 expenses on typical broadband.
- NFR-6: OCR processing should provide progress feedback and complete within reasonable time for typical receipt images (target < 10 seconds on modern laptops).

### Reliability

- NFR-7: Backend availability target **99.5%** monthly.
- NFR-8: Sync retries must be resilient to intermittent connectivity.

### Usability

- NFR-9: Mobile-responsive UI (core flows usable on phones).
- NFR-10: Accessibility: keyboard navigation for core flows, sufficient contrast with Tailwind defaults.

### Maintainability and observability

- NFR-11: Structured logging (request id, user id where safe).
- NFR-12: Basic monitoring for API errors, latency, and OCR failure rates.

### Compatibility

- NFR-13: Support modern evergreen browsers (Chrome, Edge, Firefox, Safari latest).

## 9. Feature Prioritization

| Feature | Priority | Rationale |
| --- | --- | --- |
| Google Authentication | P0 | Required for onboarding and trust |
| Expense CRUD | P0 | Core value delivery |
| OCR Receipt Scanner (Tesseract.js) | P0 | Key differentiator, reduces friction |
| Expense Categorization | P0 | Enables analytics and budgets |
| Analytics Dashboard | P1 | Drives retention and insight |
| Budget Management | P1 | Supports behavior change |
| Shared Expense Tracking | P1 | Expands use cases (households, trips) |
| Group Expense Settlement | P1 | Completes shared expense loop |
| Offline Support + Cloud Sync | P2 | Important for reliability; can phase in |

## 10. Success Metrics

### Acquisition and activation

- % of visitors who complete Google sign-in
- Time to first expense created
- % of users who scan at least one receipt in first session

### Engagement

- Weekly active users (WAU)
- Expenses logged per active user per week
- % of expenses created via OCR vs manual

### Quality

- OCR extraction accuracy (field-level) and correction rate
- Sync failure rate and average time to sync completion
- API error rate (4xx/5xx), p95 latency

### Retention

- 7-day and 30-day retention
- Budget feature adoption rate (set at least one budget)

## 11. Acceptance Criteria

### Authentication

- Users can sign in and sign out with Google.
- Unauthorized users cannot access protected routes.

### Expense management

- Users can create, view, edit, and delete expenses.
- Expense list supports filters (date range, category, group).

### OCR

- User can upload an image and see extracted fields.
- User can correct extracted fields and save an expense.
- The saved expense stores both final values and OCR metadata.

### Budgets

- User can set budgets and see progress indicators.
- Overspending threshold triggers an in-app alert.

### Shared expenses

- User can create a group, add members, and create shared expenses.
- Balances update correctly after each group expense.

### Settlement

- Settlement view shows net balances accurately.
- Suggested settlement reduces outstanding balances to zero (within rounding rules).

### Offline and sync

- When offline, user can create expenses and see “Pending sync”.
- On reconnection, pending items sync automatically and become “Synced”.

## 12. Risks and Mitigations

- **OCR accuracy variability (different receipt formats, image quality):**
    - Mitigation: guided capture tips, image preprocessing (contrast/rotate), mandatory review step, store correction feedback for future heuristics.
- **Sync conflicts and data inconsistency:**
    - Mitigation: timestamps + last-write-wins for v1, clear UI indicators, conflict logs, plan for per-field merge later.
- **Authorization bugs exposing group data:**
    - Mitigation: server-side checks for every group request, automated tests for permission boundaries.
- **Performance issues with large datasets:**
    - Mitigation: pagination, indexed queries, caching of analytics aggregates.
- **Cost overruns (storage, bandwidth):**
    - Mitigation: receipt image compression, lifecycle rules, limits for free tier (future).

## 13. Future Roadmap

### v1 (MVP)

- Google auth
- Expense CRUD
- OCR receipt scan + review
- Categories + basic analytics
- Basic group expenses + settlement suggestions

### v1.1

- Custom split methods (by amount, by percentage)
- CSV export
- Budget alerts improvements (notification center)

### v1.2

- Multi-currency group trips
- Recurring expenses
- Merchant intelligence (better auto-categorization)

### v2+

- Native mobile app (React Native)
- Payment integrations for settlement (UPI/Stripe) with confirmation
- Advanced insights (forecasting, anomaly detection)

---

### Appendix: Technical Notes (for implementation alignment)

- **Frontend:** React + Vite, Tailwind CSS, Chart.js
- **Auth:** Firebase Authentication (Google provider)
- **Backend:** Node.js + Express.js on Render
- **Database:** MongoDB Atlas
- **Deployment:** Frontend on Vercel; backend on Render
- **Key integrations:** Tesseract.js for OCR (client-side)