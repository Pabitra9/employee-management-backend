# Employee Management API

A production-ready REST API built with **Node.js, Express, MongoDB (Mongoose), JWT, and bcrypt**.
Features JWT authentication, role-based access control (RBAC), an Employee CRUD module,
layered security, Swagger docs, a Postman collection, and a React integration guide.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Running & Seeding](#running--seeding)
6. [Authentication & Roles](#authentication--roles)
7. [API Reference](#api-reference)
8. [Response Format](#response-format)
9. [Security](#security)
10. [Swagger Docs](#swagger-docs)
11. [Postman Collection](#postman-collection)
12. [React Integration Guide](#react-integration-guide)

---

## Tech Stack

| Concern         | Choice |
|-----------------|--------|
| Runtime         | Node.js (>= 18) |
| Framework       | Express 4 |
| Database        | MongoDB + Mongoose 8 |
| Auth            | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validation      | `express-validator` |
| Security        | `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `xss` |
| Docs            | `swagger-ui-express` (OpenAPI 3.0) |
| Dev             | `nodemon`, `morgan` |

> **Note on bcrypt:** this project uses `bcryptjs` (pure-JS, no native build step) — a
> drop-in, API-compatible alternative to `bcrypt` that is widely used in production and
> avoids platform compilation issues. Swap to `bcrypt` by changing the import in
> `src/models/user.model.js` if you prefer the native binding.

---

## Folder Structure

```
src/
├── config/           # env loading, DB connection, Swagger spec
│   ├── env.js
│   ├── db.js
│   └── swagger.js
├── controllers/      # HTTP layer — parse req, call service, send response
│   ├── auth.controller.js
│   └── employee.controller.js
├── middleware/       # auth, authorize, validate, async wrapper, errors, sanitize
│   ├── asyncHandler.js
│   ├── auth.middleware.js
│   ├── authorize.middleware.js
│   ├── validate.middleware.js
│   ├── sanitize.middleware.js
│   └── error.middleware.js
├── models/           # Mongoose schemas
│   ├── user.model.js
│   └── employee.model.js
├── routes/           # route definitions
│   ├── index.js
│   ├── auth.routes.js
│   └── employee.routes.js
├── services/         # reusable business logic (no req/res here)
│   ├── token.service.js
│   ├── auth.service.js
│   └── employee.service.js
├── utils/            # ApiError, response helpers, logger
│   ├── ApiError.js
│   ├── apiResponse.js
│   └── logger.js
├── validators/       # express-validator rule chains
│   ├── auth.validator.js
│   └── employee.validator.js
├── seed/
│   └── seed.js
├── app.js            # express app: middleware + routes + error handling
└── server.js         # bootstrap: connect DB, listen, graceful shutdown
```

**Architecture (MVC + service layer):** `routes → controllers → services → models`.
Controllers stay thin (HTTP only); business logic lives in reusable services.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env
# then edit .env (set MONGO_URI and a strong JWT_SECRET)

# 3. Make sure a MongoDB is running and MONGO_URI points at it:
#    - Local (macOS/Homebrew):  brew services start mongodb-community
#    - Docker:                  docker run -d -p 27017:27017 --name mongo mongo:7
#    - Atlas (free cloud):      set MONGO_URI to your mongodb+srv connection string

# 4. Seed the database (creates admin + employee users + sample employees)
npm run seed

# 5. Start the dev server (auto-reload)
npm run dev
```

Server: `http://localhost:5050` · Docs: `http://localhost:5050/api-docs`

> **macOS note:** port 5000 is taken by AirPlay Receiver, so this project defaults to
> **5050**. Change it via `PORT` in `.env` if needed.

> **Full endpoint reference with request/response examples:** see [API.md](API.md).

---

## Environment Variables

| Variable          | Required | Default | Description |
|-------------------|----------|---------|-------------|
| `PORT`            | no       | `5050`  | HTTP port (5050 avoids the macOS AirPlay clash on 5000) |
| `NODE_ENV`        | no       | `development` | `development` \| `production` |
| `CLIENT_URL`      | no       | `*`     | CORS allow-list (comma-separated) or `*` |
| `MONGO_URI`       | **yes**  | —       | MongoDB connection string |
| `JWT_SECRET`      | **yes**  | —       | Secret used to sign JWTs |
| `JWT_EXPIRES_IN`  | no       | `1d`    | Token lifetime (e.g. `15m`, `7d`) |

Seed-only: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_EMPLOYEE_EMAIL`, `SEED_EMPLOYEE_PASSWORD`.

---

## Running & Seeding

| Command               | Description |
|-----------------------|-------------|
| `npm run dev`         | Start with nodemon (auto-reload) |
| `npm start`           | Start in production mode |
| `npm run seed`        | Wipe + insert seed users and sample employees |
| `npm run seed:destroy`| Remove all users and employees |

**Seeded accounts:**

| Role     | Email                  | Password       |
|----------|------------------------|----------------|
| Admin    | `admin@example.com`    | `Admin@123`    |
| Employee | `employee@example.com` | `Employee@123` |

---

## Team Workflow (Git handoff)

`.gitignore` already excludes `node_modules/` and `.env`, so secrets are never committed.

**You — push the project:**
```bash
git init
git add .
git commit -m "Initial backend: auth + RBAC + employee CRUD"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

**Your intern — run it after cloning:**
```bash
git clone <your-repo-url>
cd backend_intern
npm install
cp .env.example .env        # then set MONGO_URI + a JWT_SECRET
# start a MongoDB (local Homebrew/Docker, or a free MongoDB Atlas cluster)
npm run seed                # load demo admin/employee + sample data
npm run dev                 # API live at http://localhost:5050
```

The React app then points at `http://localhost:5050/api`
(see the [React Integration Guide](#react-integration-guide)).
CORS is pre-configured for React on ports **3000** (CRA) and **5173** (Vite).

> Tip: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster is the quickest way
> for the intern to get a database without installing anything locally.

---

## Authentication & Roles

- **JWT** is returned on register/login and must be sent as `Authorization: Bearer <token>`.
- **JWT payload:** `{ id, email, role }` (plus `iat`/`exp`).
- Passwords are hashed with bcrypt (salt rounds = 10) and never returned in responses.

| Capability                         | Admin | Employee |
|------------------------------------|:-----:|:--------:|
| Register / Login                   | ✅ | ✅ |
| View **own** profile (`/auth/me`)  | ✅ | ✅ |
| Update **own** profile (`/auth/me`)| ✅ | ✅ |
| List / view all employees          | ✅ | ❌ |
| Create / update / delete employees | ✅ | ❌ |

> **Design note:** the `Employee` collection is HR data managed by admins. A user with the
> `employee` role manages their own **user account** via `/api/auth/me`. The Employee schema
> (per spec) has no link to user accounts, so employee self-service maps to the user profile.

> **Production hardening:** `/auth/register` accepts a `role` to satisfy the spec. In a real
> deployment you should **not** allow public self-registration as `admin` — either force
> `role: 'employee'` for public signups and create admins via seed/an admin-only endpoint,
> or gate admin creation behind `authorize('admin')`.

---

## API Reference

Base URL: `http://localhost:5050/api`

### Auth

| Method | Endpoint         | Access     | Description |
|--------|------------------|------------|-------------|
| POST   | `/auth/register` | Public     | Register a new user |
| POST   | `/auth/login`    | Public     | Login, returns JWT |
| GET    | `/auth/me`       | Authenticated | Get current user profile |
| PUT    | `/auth/me`       | Authenticated | Update own name/password |
| POST   | `/auth/logout`   | Authenticated | Stateless logout |

### Employees (admin only)

| Method | Endpoint          | Description |
|--------|-------------------|-------------|
| GET    | `/employees`      | List (supports `?page`, `?limit`, `?search`, `?department`, `?status`) |
| GET    | `/employees/:id`  | Get one |
| POST   | `/employees`      | Create |
| PUT    | `/employees/:id`  | Update |
| DELETE | `/employees/:id`  | Delete |

### Example: register

```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"Secret@123","role":"employee"}'
```

### Example: create employee (admin token required)

```bash
curl -X POST http://localhost:5050/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"firstName":"Sam","lastName":"Taylor","email":"sam@example.com","phone":"+1-202-555-0100","designation":"QA","department":"Engineering","salary":70000}'
```

---

## Response Format

**Success**

```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": { }
}
```

**Error**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

Validation errors include a `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "A valid email is required" }]
}
```

| Status | Meaning |
|--------|---------|
| 200 / 201 | Success / Created |
| 400 | Bad request (e.g. invalid id) |
| 401 | Unauthorized (missing/invalid/expired token) |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 409 | Conflict (duplicate email) |
| 422 | Validation failed |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

---

## Security

| Layer | Implementation |
|-------|----------------|
| Secure HTTP headers | `helmet()` |
| CORS | `cors` with configurable allow-list |
| Rate limiting | `express-rate-limit` — 100/15min global, 10/15min on auth |
| NoSQL injection | `express-mongo-sanitize` (strips `$`/`.` keys) |
| XSS | custom middleware using the `xss` library |
| Password security | `bcryptjs` hashing, `select: false` on the field |
| Payload size | JSON/urlencoded limited to `10kb` |
| Auth | stateless JWT with expiry |

---

## Swagger Docs

Interactive OpenAPI 3.0 docs are served at:

```
http://localhost:5050/api-docs
```

Click **Authorize**, paste a JWT (from `/auth/login`), and try any endpoint in the browser.

---

## Postman Collection

Import [`postman_collection.json`](postman_collection.json) into Postman.

1. Run **Auth → Login (Admin)** — the JWT is saved automatically to the `token` variable.
2. Run any **Employees** request — the saved token is applied via collection-level Bearer auth.
3. **Create Employee** saves the new id into `employeeId` for the Get/Update/Delete requests.

Collection variables: `baseUrl` (default `http://localhost:5050/api`), `token`, `employeeId`.

---

## React Integration Guide

### 1. Axios configuration

Create a single configured Axios instance and attach the token via an interceptor.

```js
// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5050/api",
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // optionally redirect to /login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Authorization header format

```
Authorization: Bearer <your_jwt_token>
```

### 3. Sample login request

```js
// src/api/auth.js
import api from "./axios";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  // data = { success, message, data: { user, token } }
  localStorage.setItem("token", data.data.token);
  return data.data.user;
}

export async function getProfile() {
  const { data } = await api.get("/auth/me");
  return data.data.user;
}

export async function logout() {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
}
```

### 4. Sample CRUD requests

```js
// src/api/employees.js
import api from "./axios";

export const listEmployees = (params = {}) =>
  api.get("/employees", { params }).then((r) => r.data.data);

export const getEmployee = (id) =>
  api.get(`/employees/${id}`).then((r) => r.data.data.employee);

export const createEmployee = (payload) =>
  api.post("/employees", payload).then((r) => r.data.data.employee);

export const updateEmployee = (id, payload) =>
  api.put(`/employees/${id}`, payload).then((r) => r.data.data.employee);

export const deleteEmployee = (id) =>
  api.delete(`/employees/${id}`).then((r) => r.data);
```

### 5. Example protected route flow (React Router v6)

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  // Optional client-side role check (decode JWT or fetch /auth/me).
  // The server is the source of truth and will return 403 if unauthorized.
  if (role) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== role) return <Navigate to="/forbidden" replace />;
  }
  return children;
}
```

```jsx
// src/App.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import EmployeesPage from "./pages/EmployeesPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/employees"
        element={
          <ProtectedRoute role="admin">
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

**Flow:** user logs in → token stored in `localStorage` → Axios interceptor attaches
`Authorization: Bearer <token>` to every request → `ProtectedRoute` blocks unauthenticated
users client-side → the server independently enforces auth/role and returns `401`/`403`
(the interceptor auto-logs-out on `401`).

---

## License

MIT
