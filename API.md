# API Reference

Complete reference for the Employee Management API — every endpoint, what to send,
and what you get back. Hand this to anyone integrating with the backend (e.g. the React frontend).

- **Base URL:** `http://localhost:5050/api`
- **Content-Type:** `application/json` for all requests with a body
- **Auth:** JWT Bearer token (see below)

> Port is **5050** by default (macOS reserves 5000 for AirPlay). Change via `PORT` in `.env`.

---

## How many APIs are there?

**12 core endpoints** (+ 1 health check = 13 total):

| # | Method | Endpoint | Auth | Role | Description |
|---|--------|----------|------|------|-------------|
| 1 | POST   | `/auth/register`        | ❌ Public | — | Create a user account |
| 2 | POST   | `/auth/login`           | ❌ Public | — | Log in, get a JWT |
| 3 | POST   | `/auth/forgot-password` | ❌ Public | — | Request a password-reset link |
| 4 | POST   | `/auth/reset-password`  | ❌ Public | — | Set a new password using a token |
| 5 | GET    | `/auth/me`              | ✅ Token  | any | Get your own profile |
| 6 | PUT    | `/auth/me`              | ✅ Token  | any | Update your own name/password |
| 7 | POST   | `/auth/logout`          | ✅ Token  | any | Log out (stateless) |
| 8 | GET    | `/employees`            | ✅ Token  | admin | List employees (paginated) |
| 9 | GET    | `/employees/:id`        | ✅ Token  | admin | Get one employee |
| 10| POST   | `/employees`            | ✅ Token  | admin | Create an employee |
| 11| PUT    | `/employees/:id`        | ✅ Token  | admin | Update an employee |
| 12| DELETE | `/employees/:id`        | ✅ Token  | admin | Delete an employee |
| — | GET    | `/health`               | ❌ Public | — | Health check |

---

## Authentication

1. Call **`POST /auth/login`** (or `/auth/register`). The response contains a `token`.
2. Send that token on every protected request as an HTTP header:

```
Authorization: Bearer <your_token_here>
```

- Token payload: `{ id, email, role }` + issued/expiry timestamps.
- Token expires after `JWT_EXPIRES_IN` (default `1d`). After that you get `401` and must log in again.

**Seeded test accounts** (created by `npm run seed`):

| Role     | Email                  | Password       |
|----------|------------------------|----------------|
| Admin    | `admin@example.com`    | `Admin@123`    |
| Employee | `employee@example.com` | `Employee@123` |

---

## Response format

**Success**
```json
{ "success": true, "message": "Employee created successfully", "data": { } }
```

**Error**
```json
{ "success": false, "message": "Unauthorized" }
```

**Validation error** (adds an `errors` array):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "A valid email is required" }]
}
```

## Status codes

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad request (e.g. malformed id) |
| 401  | Unauthorized — missing/invalid/expired token |
| 403  | Forbidden — logged in but wrong role |
| 404  | Not found |
| 409  | Conflict — duplicate email |
| 422  | Validation failed (see `errors`) |
| 429  | Too many requests (rate limited) |
| 500  | Server error |

---

# Auth Endpoints

## 1. Register — `POST /auth/register`

Public. Creates a user account and returns a JWT.

**Body parameters**

| Field      | Type   | Required | Rules |
|------------|--------|----------|-------|
| `name`     | string | ✅ | 2–80 characters |
| `email`    | string | ✅ | valid, unique email |
| `password` | string | ✅ | min 6 characters |
| `role`     | string | ❌ | `"admin"` or `"employee"` (default `"employee"`) |

**Request**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret@123",
  "role": "employee"
}
```

**Success — 201**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "_id": "665f...", "name": "Jane Doe", "email": "jane@example.com", "role": "employee", "createdAt": "...", "updatedAt": "..." },
    "token": "eyJhbGciOi..."
  }
}
```

**Errors:** `409` email already registered · `422` validation failed.

```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"Secret@123","role":"employee"}'
```

---

## 2. Login — `POST /auth/login`

Public. Returns a JWT for valid credentials.

**Body parameters**

| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | ✅ |
| `password` | string | ✅ |

**Request**
```json
{ "email": "admin@example.com", "password": "Admin@123" }
```

**Success — 200**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "665f...", "name": "Admin User", "email": "admin@example.com", "role": "admin" },
    "token": "eyJhbGciOi..."
  }
}
```

**Errors:** `401` invalid email or password · `422` validation failed.

```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

---

## 3. Forgot password — `POST /auth/forgot-password`

Public. Starts the reset flow. **Always returns 200** with the same message whether or
not the email exists (prevents attackers from discovering which emails are registered).

In **development** (or when SMTP is not configured), the reset token + URL are returned in
`data` so you can test without email. In **production** they are emailed, not returned.

**Body parameters**

| Field   | Type   | Required |
|---------|--------|----------|
| `email` | string | ✅ |

**Request**
```json
{ "email": "admin@example.com" }
```

**Success — 200** (dev response includes the token; production omits it)
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "data": {
    "resetToken": "a1b2c3...64hex",
    "resetUrl": "http://localhost:5173/reset-password/a1b2c3...64hex",
    "note": "Dev only: in production this is emailed, not returned."
  }
}
```

**Errors:** `422` validation failed.

```bash
curl -X POST http://localhost:5050/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'
```

---

## 4. Reset password — `POST /auth/reset-password`

Public. Sets a new password using a valid, unexpired token (valid for **15 minutes**,
**single-use**). The email link points at the frontend route `/reset-password/:token`;
the React page reads that `:token` and sends it in the body.

**Body parameters**

| Field      | Type   | Required | Rules |
|------------|--------|----------|-------|
| `token`    | string | ✅ | the token from the reset link |
| `password` | string | ✅ | min 6 characters (the new password) |

**Request**
```json
{ "token": "a1b2c3...64hex", "password": "NewSecret@123" }
```

**Success — 200**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in.",
  "data": { "user": { "_id": "665f...", "email": "admin@example.com", "role": "admin" } }
}
```

**Errors:** `400` token invalid or expired (also if already used) · `422` validation failed.

```bash
curl -X POST http://localhost:5050/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-forgot-password>","password":"NewSecret@123"}'
```

---

## 5. Get current profile — `GET /auth/me`

Requires a token (any role). No body.

**Headers:** `Authorization: Bearer <token>`

**Success — 200**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": { "user": { "_id": "665f...", "name": "Admin User", "email": "admin@example.com", "role": "admin" } }
}
```

**Errors:** `401` missing/invalid token.

```bash
curl http://localhost:5050/api/auth/me -H "Authorization: Bearer <token>"
```

---

## 6. Update own profile — `PUT /auth/me`

Requires a token (any role). Update your own name and/or password. (Email and role cannot be changed here.)

**Body parameters** (at least one)

| Field      | Type   | Required | Rules |
|------------|--------|----------|-------|
| `name`     | string | ❌ | 2–80 characters |
| `password` | string | ❌ | min 6 characters |

**Request**
```json
{ "name": "New Name" }
```

**Success — 200** → `{ "success": true, "message": "Profile updated successfully", "data": { "user": { ... } } }`

**Errors:** `401` unauthorized · `422` validation failed.

---

## 7. Logout — `POST /auth/logout`

Requires a token. Stateless — the client should discard the token. No body.

**Success — 200** → `{ "success": true, "message": "Logged out successfully", "data": {} }`

---

# Employee Endpoints (admin only)

All employee endpoints require an **admin** token. A non-admin gets `403 Forbidden`.

## 6. List employees — `GET /employees`

**Query parameters** (all optional)

| Param        | Type   | Default | Description |
|--------------|--------|---------|-------------|
| `page`       | number | 1       | Page number |
| `limit`      | number | 10      | Items per page (max 100) |
| `search`     | string | —       | Matches first name, last name, or email |
| `department` | string | —       | Exact department filter |
| `status`     | string | —       | `active` or `inactive` |

**Success — 200**
```json
{
  "success": true,
  "message": "Employees fetched successfully",
  "data": {
    "employees": [
      {
        "_id": "665f...",
        "firstName": "Jane", "lastName": "Doe",
        "email": "jane.doe@example.com", "phone": "+1-202-555-0143",
        "designation": "Software Engineer", "department": "Engineering",
        "salary": 85000, "status": "active",
        "createdBy": { "_id": "665f...", "name": "Admin User", "email": "admin@example.com", "role": "admin" },
        "createdAt": "...", "updatedAt": "..."
      }
    ],
    "pagination": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

```bash
curl "http://localhost:5050/api/employees?page=1&limit=10&status=active" \
  -H "Authorization: Bearer <admin_token>"
```

---

## 7. Get employee by id — `GET /employees/:id`

**Path parameter:** `id` — a MongoDB ObjectId.

**Success — 200** → `{ "success": true, "message": "Employee fetched successfully", "data": { "employee": { ... } } }`

**Errors:** `401` · `403` (not admin) · `404` not found · `422` invalid id format.

---

## 8. Create employee — `POST /employees`

**Body parameters**

| Field         | Type   | Required | Rules |
|---------------|--------|----------|-------|
| `firstName`   | string | ✅ | non-empty |
| `lastName`    | string | ✅ | non-empty |
| `email`       | string | ✅ | valid, unique email |
| `phone`       | string | ✅ | 7–20 chars, digits/`+`/`-`/`()`/spaces |
| `designation` | string | ✅ | non-empty |
| `department`  | string | ✅ | non-empty |
| `salary`      | number | ✅ | ≥ 0 |
| `status`      | string | ❌ | `active` (default) or `inactive` |

`createdBy` is set automatically from the logged-in admin — **do not send it**.

**Request**
```json
{
  "firstName": "Sam",
  "lastName": "Taylor",
  "email": "sam.taylor@example.com",
  "phone": "+1-202-555-0100",
  "designation": "QA Engineer",
  "department": "Engineering",
  "salary": 70000,
  "status": "active"
}
```

**Success — 201** → `{ "success": true, "message": "Employee created successfully", "data": { "employee": { ... } } }`

**Errors:** `401` · `403` · `409` duplicate email · `422` validation failed.

```bash
curl -X POST http://localhost:5050/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"firstName":"Sam","lastName":"Taylor","email":"sam.taylor@example.com","phone":"+1-202-555-0100","designation":"QA Engineer","department":"Engineering","salary":70000}'
```

---

## 9. Update employee — `PUT /employees/:id`

**Path parameter:** `id` — ObjectId.
**Body:** any subset of the create fields (all optional, validated if present).

**Request**
```json
{ "designation": "Senior QA Engineer", "salary": 80000, "status": "active" }
```

**Success — 200** → `{ "success": true, "message": "Employee updated successfully", "data": { "employee": { ... } } }`

**Errors:** `401` · `403` · `404` not found · `409` duplicate email · `422` validation failed.

---

## 10. Delete employee — `DELETE /employees/:id`

**Path parameter:** `id` — ObjectId.

**Success — 200** → `{ "success": true, "message": "Employee deleted successfully", "data": { "employee": { "id": "665f..." } } }`

**Errors:** `401` · `403` · `404` not found · `422` invalid id.

```bash
curl -X DELETE http://localhost:5050/api/employees/<id> \
  -H "Authorization: Bearer <admin_token>"
```

---

## Health check — `GET /health`

Public. → `{ "success": true, "message": "API is healthy", "data": { "uptime": 12.3, "timestamp": "..." } }`

---

# How to test locally (3 ways)

### A) Swagger UI (easiest, in the browser)
1. Start MongoDB, then `npm run seed` (once) and `npm run dev`
2. Open `http://localhost:5050/api-docs`
3. Run **POST /auth/login** with the admin creds → copy the `token` from the response.
4. Click **Authorize** (top right), paste the token, **Authorize**.
5. Now every protected endpoint can be tried with the green **Try it out** button.

### B) Postman
1. Import `postman_collection.json`.
2. Run **Auth → Login (Admin)** — the token is saved automatically.
3. Run any **Employees** request. **Create Employee** auto-saves the new id for Get/Update/Delete.

### C) curl
See the `curl` examples under each endpoint above. Save the token to a shell variable:
```bash
TOKEN=$(curl -s -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

curl http://localhost:5050/api/employees -H "Authorization: Bearer $TOKEN"
```

---

# 🧑‍💻 Local Setup Guide (for the intern / new developer)

Follow these steps to run the backend on your own machine and **see the real data**.
No prior MongoDB experience needed.

## First, understand the two collections

A MongoDB **collection** = a SQL **table**. This project has two, and they are independent:

| Collection | What it stores | Created by |
|-----------|----------------|-----------|
| `users` | **Login accounts** — name, email, hashed password, role (`admin`/`employee`) | anyone via `POST /auth/register` |
| `employees` | **HR records** — firstName, lastName, phone, designation, department, salary, status | an **admin** via `POST /employees` |

> ⚠️ Registering a user with role `employee` creates a row in **`users`**, NOT in `employees`.
> A "user" is a login account; an "employee" is an HR record. The `role` only controls permissions.

## Prerequisites
- **Node.js 18+** → check with `node -v`
- **Git**
- **A MongoDB database** (local install OR free cloud — both covered in Step 3)

## Step 1 — Clone & install
```bash
git clone <REPO_URL>          # the URL your team lead gives you
cd backend_intern
npm install
```

## Step 2 — Create your `.env`
`.env` is git-ignored (never shared), so create your own from the template:
```bash
cp .env.example .env
```
The defaults work for a local MongoDB. Set a `JWT_SECRET` to any long random string —
generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Step 3 — Get a MongoDB running (pick ONE)

### Option A — Local MongoDB on macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community     # runs at mongodb://localhost:27017
```
Keep the default `MONGO_URI=mongodb://127.0.0.1:27017/employee_management` in `.env`.

### Option B — Local MongoDB on Windows
Download the installer from <https://www.mongodb.com/try/download/community>, install it
(tick **"Run as a Service"**). It then runs at `mongodb://localhost:27017` — keep the default `MONGO_URI`.

### Option C — MongoDB Atlas (cloud, no install, any OS)
1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. Add a database user and allow your IP (or `0.0.0.0/0` for dev).
3. Put the connection string in `.env`:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/employee_management
   ```

## Step 4 — Seed demo data
```bash
npm run seed
```
Creates the two test accounts (admin@example.com / Admin@123 and
employee@example.com / Employee@123) plus 3 sample employees.

## Step 5 — Start the server
```bash
npm run dev
```
- API base: <http://localhost:5050/api>
- Swagger docs: <http://localhost:5050/api-docs>

Quick test: open the docs → run **POST /auth/login** with the admin creds → copy the `token`
→ click **Authorize** (top-right) → try the employee endpoints.

## Step 6 — See the real data in MongoDB Compass (GUI)

### 6.1 Install Compass
- **macOS:** `brew install --cask mongodb-compass`
- **Any OS:** download from <https://www.mongodb.com/products/compass>

### 6.2 Connect
1. Open **MongoDB Compass**.
2. In the connection box, paste your connection string:
   - Local: `mongodb://localhost:27017`
   - Atlas: your `mongodb+srv://...` string
3. Click **Save & Connect**.

### 6.3 Browse the data
1. In the left sidebar, click the **`employee_management`** database.
2. Click **`users`** → the login accounts (admin + employee).
3. Click **`employees`** → the HR records (3 from the seed).

### 6.4 Watch data change live
1. Create an employee via Swagger or Postman (logged in as **admin**).
2. In Compass, click the **Refresh** ↻ icon on the `employees` collection — the new
   document appears immediately. (That's proof the API really writes to the database.)

## Step 7 — Connect your React app
Point axios at `http://localhost:5050/api` and send the JWT as `Authorization: Bearer <token>`.
Full axios setup, login flow, and CRUD examples are in the **React Integration Guide** in
[`README.md`](README.md#react-integration-guide). CORS is already configured for React dev
servers on ports **3000** (Create-React-App) and **5173** (Vite).

## Handy commands
```bash
npm run dev            # start API with auto-reload
npm run seed           # reset DB to clean demo data
npm run seed:destroy   # empty the DB
# macOS MongoDB service control:
brew services list
brew services stop mongodb-community
brew services start mongodb-community
```

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `EADDRINUSE :::5050` | Something is on port 5050 — change `PORT` in `.env`. |
| `MongoServerError` / can't connect | MongoDB isn't running, or `MONGO_URI` is wrong. |
| `401 Unauthorized` | Missing/expired token — log in again and resend the `Authorization` header. |
| `403 Forbidden` | You're logged in but not an `admin` — employee endpoints need an admin token. |
| Compass shows no DB | Run `npm run seed` first; the database is created on first write. |
