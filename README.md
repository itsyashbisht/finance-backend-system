# Finance Data Processing and Access Control Backend

A RESTful backend API for managing financial records with role-based access control, built with Node.js, Express, and MongoDB.

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT (Access Token + Refresh Token)
- **Password Hashing**: bcrypt

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### Installation
```bash
git clone <your-repo-url>
cd finance-backend
npm install
```

### Environment Variables

Create a `.env` file in the root:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
```

### Run
```bash
npm run dev
```

Server starts at `http://localhost:8000`

---

## Roles and Permissions

The system has three roles. The exact permissions for each are enforced at the route level via middleware.

### ADMIN
- Full access to everything
- Create, view, update, delete financial records
- View all dashboard analytics
- Manage all users — create, assign roles, activate/deactivate, delete
- View records created by any user

### MANAGER
- View all financial records across all users
- Create, update their own records
- View all dashboard analytics (summary, category breakdown, monthly trend, recent activity)
- Cannot manage users or assign roles

### EMPLOYEE
- Create financial records
- View, update only their own records
- Cannot view other users' records
- Cannot access dashboard analytics
- Cannot delete any records

---

## API Reference

Base URL: `/api/v1`

All protected routes require the `Authorization: Bearer <token>` header or `accessToken` cookie.

---

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and receive tokens |
| POST | `/logout` | Yes | Logout and clear tokens |
| POST | `/refresh-token` | No | Get new access token |

#### POST `/register`
```json
// Request
{
  "fullname": "Yash Bisht",
  "email": "yash@company.com",
  "password": "securePass123",
  "role": "EMPLOYEE"
}

// Response 201
{
  "statusCode": 201,
  "data": { "_id": "...", "fullname": "Yash Bisht", "email": "...", "role": "EMPLOYEE" },
  "message": "User registered successfully",
  "success": true
}
```

#### POST `/login`
```json
// Request
{ "email": "yash@company.com", "password": "securePass123" }

// Response 200 — also sets httpOnly cookies
{
  "statusCode": 200,
  "data": { "user": { ... }, "accessToken": "eyJ..." },
  "message": "Login successful",
  "success": true
}
```

---

### Users — `/api/v1/users`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/me` | All | Get own profile |
| PATCH | `/me` | All | Update own profile |
| GET | `/` | ADMIN | Get all users |
| PATCH | `/:id/role` | ADMIN | Update user role |
| PATCH | `/:id/status` | ADMIN | Activate / deactivate user |
| DELETE | `/:id` | ADMIN | Delete a user |

#### GET `/?role=EMPLOYEE&page=1&limit=10`
Query params: `role`, `page`, `limit`

#### PATCH `/:id/role`
```json
{ "role": "MANAGER" }
```

---

### Financial Records — `/api/v1/records`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/` | All | Create a record |
| GET | `/` | All | Get records (scoped by role) |
| GET | `/:id` | All | Get single record |
| PATCH | `/:id` | All | Update a record |
| DELETE | `/:id` | ADMIN, MANAGER | Delete a record |

> EMPLOYEE: GET `/` and GET `/:id` return only their own records.
> ADMIN and MANAGER: see all records across all users.

#### POST `/`
```json
{
  "title": "Office supplies",
  "amount": 2500,
  "type": "EXPENSE",
  "category": "OPERATIONS",
  "date": "2025-01-15",
  "description": "Printer cartridges"
}
```

#### GET `/?type=EXPENSE&category=OPERATIONS&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=10`

Query params: `type`, `category`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortType`

Valid `type` values: `INCOME`, `EXPENSE`

Valid `category` values: `SALARY`, `INVESTMENT`, `OPERATIONS`, `MARKETING`, `OTHER`

---

### Dashboard — `/api/v1/dashboard`

> All dashboard routes: ADMIN and MANAGER only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary` | Total income, expense, net balance |
| GET | `/by-category` | Totals grouped by category |
| GET | `/monthly-trend` | Income vs expense by month |
| GET | `/recent-activity` | Latest N records |

#### GET `/summary`
```json
{
  "data": {
    "totalIncome": 500000,
    "totalExpense": 320000,
    "netBalance": 180000,
    "totalRecords": 143
  }
}
```

#### GET `/by-category?type=EXPENSE`
```json
{
  "data": [
    { "category": "OPERATIONS", "totalAmount": 120000, "count": 45 },
    { "category": "MARKETING",  "totalAmount": 80000,  "count": 23 }
  ]
}
```

#### GET `/monthly-trend?year=2025`
```json
{
  "data": {
    "year": 2025,
    "trend": [
      { "month": 1, "income": 50000, "expense": 30000, "net": 20000 },
      { "month": 2, "income": 45000, "expense": 28000, "net": 17000 }
    ]
  }
}
```

#### GET `/recent-activity?limit=10`

---

## Error Response Format

All errors follow this consistent shape:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Email is already in use",
  "success": false
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad request / validation failed |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — valid token but insufficient role |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource |
| 500 | Internal server error |

---

## Project Structure
```
src/
├── app.js                          # Express setup, middleware, routes
├── index.js                        # DB connect + server start
├── constants.js                    # ROLES enum, DB name
├── controllers/
│   ├── auth.controllers.js
│   ├── user.controllers.js
│   ├── financialRecord.controllers.js
│   └── dashboard.controllers.js
├── models/
│   ├── user.model.js
│   └── financialRecord.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── financialRecord.routes.js
│   └── dashboard.routes.js
├── middlewares/
│   ├── auth.middleware.js          # verifyJWT
│   └── authorize.middleware.js     # authorize(...roles)
├── utils/
│   ├── asyncHandler.js
│   ├── apiError.js
│   ├── apiResponse.js
│   └── generateTokens.js
└── db/
    └── index.js
```

---

## Data Persistence

MongoDB (document database) via Mongoose ODM. Two collections:

- `users` — stores user identity, role, and auth tokens
- `financialrecords` — stores all financial entries with ownership reference

---

## Key Design Decisions

**Role-based data scoping in controllers, not middleware** — `authorize()` middleware gates route access. The actual data filtering (employee sees only their own records) happens inside the controller via `req.user.role`. This keeps middleware focused on access control and controllers focused on business logic.

**`createdBy` never accepted from request body** — always assigned from `req.user._id` on the server. Clients cannot fake record ownership.

**Amount always positive** — `type` field (INCOME/EXPENSE) carries the semantic meaning. Storing negative amounts creates aggregation bugs.

**Separate `date` from `createdAt`** — financial entries can be backdated. `createdAt` tracks when the record was entered into the system. `date` tracks when the transaction actually occurred.

**Access token includes `role`** — avoids a DB lookup on every request to determine what a user is allowed to do.
```

---

## Postman Testing Guide

Here's the exact order to test everything end to end.

**Step 1 — Create users for each role**
```
POST /api/v1/auth/register  →  role: "ADMIN"
POST /api/v1/auth/register  →  role: "MANAGER"
POST /api/v1/auth/register  →  role: "EMPLOYEE"
```

**Step 2 — Login with each, save tokens**
```
POST /api/v1/auth/login  →  save accessToken for each role
```
In Postman, set `Authorization: Bearer <token>` as a collection variable per role environment.

**Step 3 — Test RBAC boundaries**
```
// With EMPLOYEE token — should work
POST /api/v1/records        → create a record
GET  /api/v1/records        → see only own records

// With EMPLOYEE token — should return 403
GET  /api/v1/dashboard/summary
DELETE /api/v1/records/:id

// With MANAGER token — should work
GET  /api/v1/dashboard/summary
GET  /api/v1/records         → sees ALL records

// With MANAGER token — should return 403
PATCH /api/v1/users/:id/role

// With ADMIN token — everything works
```

**Step 4 — Test user status**
```
PATCH /api/v1/users/:id/status  →  deactivate EMPLOYEE
POST  /api/v1/auth/login        →  should return 403 "account deactivated"
```

**Step 5 — Test dashboard aggregations**
```
// First create 5-6 records with different types and categories
// Then test:
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/by-category
GET /api/v1/dashboard/monthly-trend?year=2025
GET /api/v1/dashboard/recent-activity?limit=5
```
