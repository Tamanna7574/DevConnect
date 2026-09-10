# DevConnect 🚀

> The modern developer networking, portfolio, and technical blogging platform.

DevConnect brings together developer discovery, project showcases, technical publications, real-time networking, skill endorsements, and notification systems into a unified full-stack web application.

---

## 🏗️ Architecture & Monorepo Structure

DevConnect is structured as an npm workspaces monorepo:

```text
DevConnect/
├── shared/             # Shared TypeScript types, schemas, and API contracts (@devconnect/shared)
├── server/             # Express.js backend with Prisma ORM & Socket.io (@devconnect/server)
│   ├── prisma/         # Prisma schema and database migrations
│   ├── src/            # Controllers, services, routes, middlewares
│   └── tests/          # Vitest integration and security tests
├── client/             # Modern React frontend with Vite & Tailwind CSS (@devconnect/client)
│   ├── src/            # Components, pages, stores, hooks, context
│   └── tests/          # Vitest UI & component unit tests
├── .env.example        # Root environment template
└── package.json        # Monorepo scripts & dependencies
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: Zustand, TanStack Query (React Query)
- **Routing**: React Router v6
- **Real-time Client**: Socket.io Client
- **Testing**: Vitest & React Testing Library

### Backend
- **Runtime**: Node.js with TypeScript & Express
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Real-time Server**: Socket.io
- **Security**: Helmet, CORS, Express Rate Limit, bcryptjs, JWT, HTTP-only secure cookies
- **File Uploads**: Multer with local disk storage / optional Cloudinary integration
- **Testing**: Vitest & Supertest

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14` or higher (running locally or hosted on Supabase/Neon/Railway)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd DevConnect
npm install
```

### 2. Configure Environment Variables

Create `.env` files for both backend and frontend based on the provided templates:

#### Backend (`server/.env`):
```bash
cp server/.env.example server/.env
```
Edit `server/.env` with your actual PostgreSQL connection string and secrets:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devconnect?schema=public"
JWT_SECRET="super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"
COOKIE_SECRET="super-secret-cookie-key"
CLIENT_URL="http://localhost:5173"
```

#### Frontend (`client/.env`):
```bash
cp client/.env.example client/.env
```
For local development, the default relative proxy `/api` works out of the box with Vite:
```env
VITE_API_URL=/api
```

### 3. Initialize the Database

Push the Prisma schema to your PostgreSQL database and run the initial seed:

```bash
# Push Prisma schema to DB
npm run db:push

# Generate Prisma client
npm run db:generate

# (Optional) Seed the database with sample developers, projects, and publications
npm run db:seed
```

### 4. Run the Development Servers

Start both frontend and backend concurrently:

```bash
npm run dev
```

- Frontend runs at: `http://localhost:5173`
- Backend runs at: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`

---

## 🧪 Testing

DevConnect comes with a complete suite of integration and unit tests covering authentication, route authorization, CRUD ownership checks, and UI rendering.

```bash
# Run all tests across the entire monorepo
npm test

# Run backend tests only
npm test --workspace=server

# Run frontend tests only
npm test --workspace=client
```

---

## 📦 Building for Production

To build all workspaces for production:

```bash
npm run build
```

This compiles:
1. `@devconnect/shared` TypeScript definitions.
2. `@devconnect/server` into `server/dist`.
3. `@devconnect/client` into optimized static assets in `client/dist`.

### Running in Production

```bash
# Apply database migrations
npm run db:migrate

# Start the compiled Express server
npm run start
```

---

## 🌐 Production Deployment Guide

DevConnect is architected for seamless production deployment across modern cloud platforms:

### 1. Database (Render PostgreSQL, Neon, or Supabase)
1. Provision a PostgreSQL instance (v14+).
2. Copy the production connection string (e.g. `postgresql://user:pass@host:5432/dbname?sslmode=require`).
3. Run migrations safely:
   ```bash
   DATABASE_URL="your-production-db-url" npm run db:migrate
   ```
4. (Optional for demo/internship showcase) Seed community content safely:
   ```bash
   DATABASE_URL="your-production-db-url" npm run db:seed
   ```

### 2. Backend (Render / Railway)
- **Runtime**: Node.js 18+
- **Build Command**: `npm install && npm run db:generate && npm run build`
- **Start Command**: `npm run db:migrate && npm run start`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `10000` (or host provided)
  - `DATABASE_URL`: Your production PostgreSQL connection string
  - `JWT_SECRET`: Random 32+ character string
  - `COOKIE_SECRET`: Random 32+ character string
  - `CLIENT_URL`: `https://your-frontend.vercel.app` (comma-separated if multiple)
  - `CLOUDINARY_CLOUD_NAME`: (Optional for cloud media uploads)
  - `CLOUDINARY_API_KEY`: (Optional)
  - `CLOUDINARY_API_SECRET`: (Optional)

### 3. Frontend (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `client` (or set Root Directory to `.` and output to `client/dist`)
- **Build Command**: `npm run build --workspace=client`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend.onrender.com/api`
  - `VITE_WS_URL`: `https://your-backend.onrender.com`
- **SPA Rewrites**: Automatically handled by [`client/vercel.json`](file:///c:/Users/HP/Desktop/DevConnect/client/vercel.json).

---


## 🔒 Security & Authorization Highlights

- **Ownership Enforcement**: Modification and deletion of projects, publications, and profiles strictly verify resource ownership against the authenticated session `userId` (never trust client-provided IDs).
- **Self-Action Prevention**: Users cannot endorse themselves, send connection requests to themselves, or accept unauthorized connection requests.
- **Header Hardening**: Powered by Helmet with Content Security Policy headers and cross-origin controls.
- **Rate Limiting**: Express rate limiters protect authentication and write endpoints against brute-force and spam abuse.
- **XSS Sanitization**: Markdown rendering sanitizes HTML and protocols against `javascript:` injection.
- **Sanitized Error Responses**: Internal stack traces and server internals are suppressed in production.

---

## 📄 License

MIT License. Built with ❤️ for the developer community.
