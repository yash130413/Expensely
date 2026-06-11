# Expensely – Project Summary

### Executive Summary

Expensely is a full stack expense management web application designed to help individuals and groups record expenses, manage budgets, and understand spending through analytics. The product combines a modern React-based user experience with a secure Node.js/Express API and a cloud-hosted MongoDB database. It also supports receipt scanning via OCR and offline-first usage through PWA and IndexedDB.

### Problem Statement

Tracking expenses is often fragmented across receipts, notes, and spreadsheets. This creates several issues:

- Manual entry is slow and error-prone.
- Users lack real-time visibility into spending trends.
- Group expenses are difficult to split and settle fairly.
- Poor connectivity can disrupt tracking, which leads to missing records.

### Solution Overview

Expensely provides an end-to-end system for expense tracking and budgeting:

- A responsive frontend for capturing expenses, viewing budgets, and exploring analytics.
- Authentication that combines Firebase sign-in with JWT-protected backend APIs.
- OCR-based receipt scanning to reduce manual data entry.
- Offline support that allows users to continue recording data and syncing later.
- Group and shared expense tracking for collaborative spending and settlements.

### Key Features

- **Secure login** using Firebase Authentication with JWT-secured API access.
- **Expense tracking** with CRUD operations and categorization.
- **Budget management** to set limits and monitor performance.
- **Analytics dashboard** with interactive visualizations (Chart.js).
- **Receipt Scanner (OCR)** using Tesseract.js to extract receipt details and create expense entries.
- **Offline-first support** using PWA capabilities and IndexedDB caching.
- **Groups and shared expenses** to track who paid, split costs, and support settlement workflows.

### Tech Stack

**Frontend**

- React 19, Vite
- TailwindCSS
- React Router
- React Query
- Chart.js
- Firebase Authentication
- Tesseract.js
- IndexedDB (idb)
- PWA support

**Backend**

- Node.js, Express.js
- JWT authentication
- MongoDB Atlas
- Mongoose

### Architecture Overview

Expensely follows a clean, service-oriented web architecture:

- React frontend
    - Routing via React Router
    - Server state management via React Query
    - UI styled with TailwindCSS
- Axios API layer
    - Centralized HTTP calls and request handling
- Express backend
    - REST APIs, validation, and authorization checks
    - JWT middleware for protected routes
- MongoDB Atlas
    - Data persistence via Mongoose models

### Authentication Overview

- User signs in using **Firebase Authentication** (Google login).
- The application uses **JWT** to protect backend endpoints and authorize access to resources.

### Challenges Solved

- **Reducing manual entry:** Implemented OCR receipt scanning to translate receipt images into structured expense data.
- **Maintaining usability offline:** Added PWA support and IndexedDB caching so users can continue tracking with limited connectivity.
- **Coordinating shared spending:** Designed models and routes for groups and shared expenses to support transparent splitting and settlement logic.
- **Ensuring secure access:** Combined Firebase authentication with JWT-protected backend routes for consistent authorization.

### Learning Outcomes

- Built an end-to-end full stack application with a clear separation between UI, API, and data layers.
- Strengthened understanding of authentication patterns (OAuth-based sign-in with Firebase plus JWT-protected APIs).
- Gained practical experience with OCR workflows (image processing to structured data).
- Implemented offline-first patterns using PWA capabilities and IndexedDB.
- Improved skills in REST API design, schema modeling with Mongoose, and frontend server-state management with React Query.

### Future Enhancements

- Role-based access controls for groups (admin, member) and more granular permissions.
- Automated category suggestions for expenses using rules or lightweight ML.
- Recurring expenses and reminders.
- Multi-currency support with exchange rate normalization.
- Exporting and reporting (CSV/PDF) for reimbursements and audits.
- Improved OCR accuracy with pre-processing (cropping, contrast, deskew) and confidence-based review UI.

### Deployment Information

- **Frontend:** Deployed on Vercel
- **Backend:** Deployed on Render
- **Database:** MongoDB Atlas

---

**API Surface (high level)**

- `/api/auth`
- `/api/expenses`
- `/api/budgets`
- `/api/ocr`
- `/api/groups`
- `/api/shared-expenses`

**Core Data Models**

- User
- Expense
- Budget
- Group
- SharedExpense