# Expensely API Documentation

# Overview

## Authentication

- Users authenticate via **Firebase Authentication** on the frontend.
- The backend issues a **JWT** which is required for protected routes.

### Security Scheme (Bearer JWT)

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### Common Error Model

```yaml
components:
  schemas:
    ErrorResponse:
      type: object
      properties:
        message:
          type: string
        code:
          type: string
        details:
          type: object
```

### Common HTTP Status Codes

- `200 OK` Successful request
- `201 Created` Resource created
- `400 Bad Request` Validation or malformed request
- `401 Unauthorized` Missing or invalid JWT
- `403 Forbidden` Not allowed for this user
- `404 Not Found` Resource does not exist
- `409 Conflict` Duplicate or conflicting state
- `422 Unprocessable Entity` Valid JSON but invalid domain rules
- `429 Too Many Requests` Rate limited
- `500 Internal Server Error` Unexpected server failure

---

# Auth APIs (`/api/auth`)

## POST /api/auth/login

**Description:** Exchanges a Firebase ID token for an Expensely JWT.

- **Method:** POST
- **Endpoint:** `/api/auth/login`
- **Authentication:** None

### Request Example

```
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "firebaseIdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Example

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "665a9e3e2e3c1f0012abcd01",
    "email": "yash@example.com",
    "name": "Yash Rohilla"
  }
}
```

### Error Responses

- `400` Missing `firebaseIdToken`

```json
{ "message": "firebaseIdToken is required", "code": "VALIDATION_ERROR" }
```

- `401` Firebase token invalid/expired

```json
{ "message": "Invalid Firebase token", "code": "AUTH_INVALID" }
```

- `500` Token exchange failure

```json
{ "message": "Failed to login", "code": "AUTH_SERVER_ERROR" }
```

---

## GET /api/auth/me

**Description:** Returns the authenticated user's profile.

- **Method:** GET
- **Endpoint:** `/api/auth/me`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/auth/me HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "id": "665a9e3e2e3c1f0012abcd01",
  "email": "yash@example.com",
  "name": "Yash Rohilla",
  "createdAt": "2026-06-10T10:12:03.120Z"
}
```

### Error Responses

- `401` Missing/invalid JWT

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `500`

```json
{ "message": "Failed to fetch profile", "code": "SERVER_ERROR" }
```

---

# Expense APIs (`/api/expenses`)

## POST /api/expenses

**Description:** Creates a new expense for the authenticated user.

- **Method:** POST
- **Endpoint:** `/api/expenses`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/expenses HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "amount": 249.99,
  "currency": "INR",
  "category": "Food",
  "merchant": "Cafe ABC",
  "date": "2026-06-10",
  "notes": "Team lunch",
  "paymentMethod": "Card",
  "receiptImageUrl": "https://.../receipt.jpg",
  "tags": ["work"]
}
```

### Response Example

```json
{
  "id": "665aa1012e3c1f0012abcd02",
  "userId": "665a9e3e2e3c1f0012abcd01",
  "amount": 249.99,
  "currency": "INR",
  "category": "Food",
  "merchant": "Cafe ABC",
  "date": "2026-06-10",
  "notes": "Team lunch",
  "paymentMethod": "Card",
  "receiptImageUrl": "https://.../receipt.jpg",
  "tags": ["work"],
  "createdAt": "2026-06-10T10:35:20.010Z"
}
```

### Error Responses

- `400` Validation error

```json
{ "message": "amount must be a positive number", "code": "VALIDATION_ERROR" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `500`

```json
{ "message": "Failed to create expense", "code": "SERVER_ERROR" }
```

---

## GET /api/expenses

**Description:** Lists expenses for the authenticated user with optional filtering.

- **Method:** GET
- **Endpoint:** `/api/expenses`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Query Parameters

- `page` (number, default `1`)
- `limit` (number, default `20`)
- `from` (date `YYYY-MM-DD`)
- `to` (date `YYYY-MM-DD`)
- `category` (string)
- `q` (string: search merchant/notes)
- `sort` (string: e.g. `date:desc`, `amount:asc`)

### Request Example

```
GET /api/expenses?from=2026-06-01&to=2026-06-30&category=Food&page=1&limit=20 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "items": [
    {
      "id": "665aa1012e3c1f0012abcd02",
      "amount": 249.99,
      "currency": "INR",
      "category": "Food",
      "merchant": "Cafe ABC",
      "date": "2026-06-10",
      "notes": "Team lunch"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `500`

```json
{ "message": "Failed to fetch expenses", "code": "SERVER_ERROR" }
```

---

## GET /api/expenses/{expenseId}

**Description:** Fetches a single expense by ID.

- **Method:** GET
- **Endpoint:** `/api/expenses/{expenseId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/expenses/665aa1012e3c1f0012abcd02 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "id": "665aa1012e3c1f0012abcd02",
  "amount": 249.99,
  "currency": "INR",
  "category": "Food",
  "merchant": "Cafe ABC",
  "date": "2026-06-10",
  "notes": "Team lunch"
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Expense not found", "code": "NOT_FOUND" }
```

---

## PATCH /api/expenses/{expenseId}

**Description:** Updates fields on an existing expense.

- **Method:** PATCH
- **Endpoint:** `/api/expenses/{expenseId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
PATCH /api/expenses/665aa1012e3c1f0012abcd02 HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "category": "Meals",
  "notes": "Client lunch"
}
```

### Response Example

```json
{
  "id": "665aa1012e3c1f0012abcd02",
  "amount": 249.99,
  "currency": "INR",
  "category": "Meals",
  "merchant": "Cafe ABC",
  "date": "2026-06-10",
  "notes": "Client lunch",
  "updatedAt": "2026-06-10T11:01:45.500Z"
}
```

### Error Responses

- `400`

```json
{ "message": "Invalid update payload", "code": "VALIDATION_ERROR" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Expense not found", "code": "NOT_FOUND" }
```

---

## DELETE /api/expenses/{expenseId}

**Description:** Deletes an expense.

- **Method:** DELETE
- **Endpoint:** `/api/expenses/{expenseId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
DELETE /api/expenses/665aa1012e3c1f0012abcd02 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{ "deleted": true }
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Expense not found", "code": "NOT_FOUND" }
```

---

# Budget APIs (`/api/budgets`)

## POST /api/budgets

**Description:** Creates a budget (overall or per-category).

- **Method:** POST
- **Endpoint:** `/api/budgets`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/budgets HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "period": "monthly",
  "month": "2026-06",
  "category": "Food",
  "limit": 5000,
  "currency": "INR"
}
```

### Response Example

```json
{
  "id": "665aa2fe2e3c1f0012abcd03",
  "userId": "665a9e3e2e3c1f0012abcd01",
  "period": "monthly",
  "month": "2026-06",
  "category": "Food",
  "limit": 5000,
  "currency": "INR",
  "createdAt": "2026-06-10T11:10:03.100Z"
}
```

### Error Responses

- `409` Budget already exists for month+category

```json
{ "message": "Budget already exists", "code": "BUDGET_CONFLICT" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## GET /api/budgets

**Description:** Lists budgets for the authenticated user.

- **Method:** GET
- **Endpoint:** `/api/budgets`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/budgets?month=2026-06 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "items": [
    {
      "id": "665aa2fe2e3c1f0012abcd03",
      "period": "monthly",
      "month": "2026-06",
      "category": "Food",
      "limit": 5000,
      "currency": "INR",
      "spent": 1250.5,
      "remaining": 3749.5
    }
  ]
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## PATCH /api/budgets/{budgetId}

**Description:** Updates an existing budget.

- **Method:** PATCH
- **Endpoint:** `/api/budgets/{budgetId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
PATCH /api/budgets/665aa2fe2e3c1f0012abcd03 HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "limit": 6000
}
```

### Response Example

```json
{
  "id": "665aa2fe2e3c1f0012abcd03",
  "period": "monthly",
  "month": "2026-06",
  "category": "Food",
  "limit": 6000,
  "currency": "INR",
  "updatedAt": "2026-06-10T11:22:11.000Z"
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Budget not found", "code": "NOT_FOUND" }
```

---

## DELETE /api/budgets/{budgetId}

**Description:** Deletes a budget.

- **Method:** DELETE
- **Endpoint:** `/api/budgets/{budgetId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
DELETE /api/budgets/665aa2fe2e3c1f0012abcd03 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{ "deleted": true }
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Budget not found", "code": "NOT_FOUND" }
```

---

# OCR APIs (`/api/ocr`)

## POST /api/ocr/scan

**Description:** Uploads or references an image for receipt OCR and returns extracted fields.

- **Method:** POST
- **Endpoint:** `/api/ocr/scan`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/ocr/scan HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "imageUrl": "https://.../receipt.jpg",
  "options": {
    "language": "eng",
    "currencyHint": "INR"
  }
}
```

### Response Example

```json
{
  "text": "CAFE ABC\nTotal: 249.99\nDate: 10/06/2026\n...",
  "fields": {
    "merchant": "Cafe ABC",
    "date": "2026-06-10",
    "total": 249.99,
    "currency": "INR"
  },
  "confidence": 0.82
}
```

### Error Responses

- `400` Missing `imageUrl`

```json
{ "message": "imageUrl is required", "code": "VALIDATION_ERROR" }
```

- `422` OCR could not extract meaningful data

```json
{ "message": "Unable to parse receipt", "code": "OCR_PARSE_FAILED" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## POST /api/ocr/scan-and-create-expense

**Description:** Runs OCR and creates an expense draft (or finalized expense) from extracted data.

- **Method:** POST
- **Endpoint:** `/api/ocr/scan-and-create-expense`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/ocr/scan-and-create-expense HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "imageUrl": "https://.../receipt.jpg",
  "overrides": {
    "category": "Food"
  },
  "createMode": "draft"
}
```

### Response Example

```json
{
  "ocr": {
    "merchant": "Cafe ABC",
    "date": "2026-06-10",
    "total": 249.99,
    "currency": "INR"
  },
  "expense": {
    "id": "665aa4bd2e3c1f0012abcd04",
    "amount": 249.99,
    "category": "Food",
    "merchant": "Cafe ABC",
    "date": "2026-06-10",
    "status": "draft"
  }
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `422`

```json
{ "message": "Unable to parse receipt", "code": "OCR_PARSE_FAILED" }
```

---

# Group APIs (`/api/groups`)

## POST /api/groups

**Description:** Creates a new expense group.

- **Method:** POST
- **Endpoint:** `/api/groups`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/groups HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Goa Trip",
  "description": "Shared expenses for Goa trip",
  "members": [
    { "email": "a@example.com" },
    { "email": "b@example.com" }
  ]
}
```

### Response Example

```json
{
  "id": "665aa5f62e3c1f0012abcd05",
  "name": "Goa Trip",
  "description": "Shared expenses for Goa trip",
  "ownerId": "665a9e3e2e3c1f0012abcd01",
  "members": [
    { "userId": "665a9e3e2e3c1f0012abcd01", "role": "owner" },
    { "userId": "665aa6102e3c1f0012abcd06", "role": "member" }
  ],
  "createdAt": "2026-06-10T12:05:33.100Z"
}
```

### Error Responses

- `400`

```json
{ "message": "name is required", "code": "VALIDATION_ERROR" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## GET /api/groups

**Description:** Lists groups the authenticated user belongs to.

- **Method:** GET
- **Endpoint:** `/api/groups`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/groups HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "items": [
    {
      "id": "665aa5f62e3c1f0012abcd05",
      "name": "Goa Trip",
      "memberCount": 2
    }
  ]
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## GET /api/groups/{groupId}

**Description:** Fetches a group with members.

- **Method:** GET
- **Endpoint:** `/api/groups/{groupId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/groups/665aa5f62e3c1f0012abcd05 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "id": "665aa5f62e3c1f0012abcd05",
  "name": "Goa Trip",
  "description": "Shared expenses for Goa trip",
  "members": [
    { "userId": "665a9e3e2e3c1f0012abcd01", "role": "owner" },
    { "userId": "665aa6102e3c1f0012abcd06", "role": "member" }
  ]
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Group not found", "code": "NOT_FOUND" }
```

---

## PATCH /api/groups/{groupId}

**Description:** Updates group details.

- **Method:** PATCH
- **Endpoint:** `/api/groups/{groupId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
PATCH /api/groups/665aa5f62e3c1f0012abcd05 HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Goa Trip 2026",
  "description": "Updated description"
}
```

### Response Example

```json
{
  "id": "665aa5f62e3c1f0012abcd05",
  "name": "Goa Trip 2026",
  "description": "Updated description",
  "updatedAt": "2026-06-10T12:20:00.000Z"
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `403` Not group owner

```json
{ "message": "Forbidden", "code": "GROUP_FORBIDDEN" }
```

---

## POST /api/groups/{groupId}/members

**Description:** Adds a member to a group.

- **Method:** POST
- **Endpoint:** `/api/groups/{groupId}/members`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/groups/665aa5f62e3c1f0012abcd05/members HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "email": "c@example.com",
  "role": "member"
}
```

### Response Example

```json
{
  "groupId": "665aa5f62e3c1f0012abcd05",
  "member": { "userId": "665aa7aa2e3c1f0012abcd07", "role": "member" }
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `403`

```json
{ "message": "Forbidden", "code": "GROUP_FORBIDDEN" }
```

- `409` Member already exists

```json
{ "message": "Member already exists", "code": "MEMBER_CONFLICT" }
```

---

## DELETE /api/groups/{groupId}/members/{memberId}

**Description:** Removes a member from a group.

- **Method:** DELETE
- **Endpoint:** `/api/groups/{groupId}/members/{memberId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
DELETE /api/groups/665aa5f62e3c1f0012abcd05/members/665aa7aa2e3c1f0012abcd07 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{ "deleted": true }
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `403`

```json
{ "message": "Forbidden", "code": "GROUP_FORBIDDEN" }
```

---

# Shared Expense APIs (`/api/shared-expenses`)

## POST /api/shared-expenses

**Description:** Creates a shared expense (optionally linked to a group) and defines split rules.

- **Method:** POST
- **Endpoint:** `/api/shared-expenses`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/shared-expenses HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "groupId": "665aa5f62e3c1f0012abcd05",
  "title": "Dinner",
  "amount": 1200,
  "currency": "INR",
  "paidByUserId": "665a9e3e2e3c1f0012abcd01",
  "date": "2026-06-10",
  "splits": [
    { "userId": "665a9e3e2e3c1f0012abcd01", "share": 0.5 },
    { "userId": "665aa6102e3c1f0012abcd06", "share": 0.5 }
  ]
}
```

### Response Example

```json
{
  "id": "665aa8e22e3c1f0012abcd08",
  "groupId": "665aa5f62e3c1f0012abcd05",
  "title": "Dinner",
  "amount": 1200,
  "currency": "INR",
  "paidByUserId": "665a9e3e2e3c1f0012abcd01",
  "date": "2026-06-10",
  "splits": [
    { "userId": "665a9e3e2e3c1f0012abcd01", "share": 0.5, "owed": 0 },
    { "userId": "665aa6102e3c1f0012abcd06", "share": 0.5, "owed": 600 }
  ],
  "status": "open"
}
```

### Error Responses

- `400` Split shares invalid

```json
{ "message": "Split shares must sum to 1", "code": "SPLIT_INVALID" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## GET /api/shared-expenses

**Description:** Lists shared expenses (filterable by group).

- **Method:** GET
- **Endpoint:** `/api/shared-expenses`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/shared-expenses?groupId=665aa5f62e3c1f0012abcd05 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "items": [
    {
      "id": "665aa8e22e3c1f0012abcd08",
      "title": "Dinner",
      "amount": 1200,
      "currency": "INR",
      "status": "open"
    }
  ]
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---

## GET /api/shared-expenses/{sharedExpenseId}

**Description:** Fetches a shared expense including split details and settlement state.

- **Method:** GET
- **Endpoint:** `/api/shared-expenses/{sharedExpenseId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
GET /api/shared-expenses/665aa8e22e3c1f0012abcd08 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{
  "id": "665aa8e22e3c1f0012abcd08",
  "groupId": "665aa5f62e3c1f0012abcd05",
  "title": "Dinner",
  "amount": 1200,
  "currency": "INR",
  "paidByUserId": "665a9e3e2e3c1f0012abcd01",
  "date": "2026-06-10",
  "splits": [
    { "userId": "665a9e3e2e3c1f0012abcd01", "share": 0.5, "owed": 0, "settled": true },
    { "userId": "665aa6102e3c1f0012abcd06", "share": 0.5, "owed": 600, "settled": false }
  ],
  "status": "open"
}
```

### Error Responses

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `404`

```json
{ "message": "Shared expense not found", "code": "NOT_FOUND" }
```

---

## POST /api/shared-expenses/{sharedExpenseId}/settle

**Description:** Records a settlement payment from one member to another (or marks split entries as settled).

- **Method:** POST
- **Endpoint:** `/api/shared-expenses/{sharedExpenseId}/settle`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
POST /api/shared-expenses/665aa8e22e3c1f0012abcd08/settle HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "fromUserId": "665aa6102e3c1f0012abcd06",
  "toUserId": "665a9e3e2e3c1f0012abcd01",
  "amount": 600,
  "currency": "INR",
  "method": "upi",
  "reference": "UPI-12345"
}
```

### Response Example

```json
{
  "settled": true,
  "transactionId": "665aaa112e3c1f0012abcd09"
}
```

### Error Responses

- `400` Amount invalid

```json
{ "message": "Invalid settlement amount", "code": "SETTLEMENT_INVALID" }
```

- `401`

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

- `409` Already settled

```json
{ "message": "Already settled", "code": "SETTLEMENT_CONFLICT" }
```

---

## DELETE /api/shared-expenses/{sharedExpenseId}

**Description:** Deletes a shared expense (typically owner-only).

- **Method:** DELETE
- **Endpoint:** `/api/shared-expenses/{sharedExpenseId}`
- **Authentication:** Bearer JWT (`bearerAuth`)

### Request Example

```
DELETE /api/shared-expenses/665aa8e22e3c1f0012abcd08 HTTP/1.1
Authorization: Bearer <JWT>
```

### Response Example

```json
{ "deleted": true }
```

### Error Responses

- `401`
- `403`

```json
{ "message": "Forbidden", "code": "SHARED_EXPENSE_FORBIDDEN" }
```

```json
{ "message": "Unauthorized", "code": "AUTH_REQUIRED" }
```

---