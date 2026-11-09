# 📚 Modern Library Management System (LMS)

A production-grade, multi-tenant SaaS **Library Management System** built with **React 19 (Vite)** on the frontend and **Node.js (Express 5) + MongoDB (Mongoose)** on the backend. Designed specifically for modern study libraries, co-working reading halls, and multi-shift student study spaces.


## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB Atlas**: An active MongoDB Atlas cluster URI

---

### 1. Clone the Repository

```bash
git clone https://github.com/Project-LMS-by-SN/LMS.git
cd LMS
```

---

### 2. Install Dependencies

Install root workspace dependencies (test runners, Vitest, Playwright):
```bash
npm install
```

Install backend dependencies:
```bash
npm --prefix backend install
```

Install frontend dependencies:
```bash
npm --prefix frontend install
```

---

### 3. Configure Environment Variables

Create your environment file in `backend/.env`:
```bash
cp backend/.env.sample backend/.env
```

Open `backend/.env` and configure your credentials:

```env
PORT=3000

# MongoDB Atlas Cloud Connection String
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/library_management_db?retryWrites=true&w=majority"
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/library_management_db?retryWrites=true&w=majority"

# Frontend CORS Whitelist
FRONTEND_URL="http://localhost:5173,http://localhost:3000"

# Initial Library Owner Credentials
OWNER_EMAILS=admin@admin.com,owner@gmail.com,admin100@admin.com,admin200@admin.com
DEFAULT_OWNER_PASSWORD=Password123!
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: Razorpay Payment Gateway (for SaaS subscriptions)
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx

# Optional: Resend API (for transactional emails)
RESEND_API_KEY=re_xxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

---

### Initialize Database (Seed) (*Don't seed unless working on separate DB. B)

Run the database seeder to establish initial counters, default library branches, and initial admin owners:

```bash
npm --prefix backend run seed
```

---

### 5. Start the Application

You can start both backend and frontend servers using the root convenience scripts:

#### Start Backend Server:
```bash
npm run backend:dev
# Running at http://localhost:3000
```

#### Start Frontend Application:
```bash
npm run frontend:dev
# Running at http://localhost:5173
```

---

## 🧪 Running Automated Tests

The project includes a multi-tiered test suite organized under [`tests/`](./tests):

```
tests/
├── unit/            # Frontend components/hooks/utils & Backend models/controllers/middleware
├── integration/     # Service calculations, quotas, rate limiters, and composite components
├── api/             # HTTP endpoint integration tests via Supertest
└── e2e/             # Browser userflow automation via Playwright
```

### Available Test Commands

| Command | Action | Framework |
| :--- | :--- | :---: |
| `npm test` *(or `npm run test:all`)* | **Runs all test suites sequentially in order** | Sequential Runner |
| `npm run test:unit` | Runs frontend and backend unit tests | Vitest |
| `npm run test:integration` | Runs business logic and integration tests | Vitest |
| `npm run test:api` | Runs API endpoint tests against Express `app` | Supertest |
| `npm run test:e2e` | Runs UI browser & userflow tests (Headless) | Playwright |
| `npm run test:e2e:headed` | Runs browser tests visibly with auto slow-motion | Playwright |
| `npm run test:e2e:ui` | Opens Playwright's interactive visual UI runner | Playwright |

---

## 🔐 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Default Library Owner** | `admin@admin.com` | `Password123!` |
| **Branch 2 Admin** | `admin100@admin.com` | `Password123!` |
| **Branch 3 Admin** | `admin200@admin.com` | `Password123!` |

> [!TIP]
> Additional owner emails listed in `OWNER_EMAILS` are automatically recognized and initialized with their own branch upon their first sign-in using `DEFAULT_OWNER_PASSWORD`.

---

## 📖 API Documentation (OpenAPI / Swagger)

All backend endpoints are formally documented in the **OpenAPI 3.1.0** specification file located at the root of the repository:

📄 **[`OpenAPI.yaml`](./OpenAPI.yaml)**

### How to View and Test the API

You can inspect, search, and execute requests against the API using any of the following tools:

1. **Swagger Editor (Web)**:
   - Visit [editor.swagger.io](https://editor.swagger.io/) and paste or open `OpenAPI.yaml`.
2. **Redoc (Interactive HTML Documentation)**:
   ```bash
   npx @redocly/cli preview-docs OpenAPI.yaml
   ```
3. **Postman**:
   - Open Postman ➡️ Click **Import** ➡️ Select `OpenAPI.yaml` to automatically generate a complete request collection.
4. **VS Code / Cursor Extensions**:
   - Install the **OpenAPI (Swagger) Editor** or **Swagger Viewer** extension to preview the API documentation directly inside your editor (`Alt + M`).

---

## 🛡️ License

This project is licensed under the **ISC License**. Developed and maintained by the Softwarenative team.
