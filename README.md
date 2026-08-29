# Bella Casa Hotel Management System

A production-grade Property Management System (PMS) for Bella Casa Hotel, Liberia.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS 11, Fastify, TypeScript |
| Database | PostgreSQL 18, Prisma ORM |
| Auth | Argon2id, JWT (HttpOnly cookies) |
| Queue | BullMQ (Phase 10+) |
| Cache | Redis (deferred) |

## Architecture

```
bellacasa-hms/
├── apps/
│   ├── web/        ← Next.js 15 frontend (port 3000)
│   └── api/        ← NestJS 11 backend (port 3001)
├── packages/
│   ├── database/   ← Prisma schema + migrations
│   └── shared/     ← Shared TypeScript types
└── docker-compose.yml
```

## Prerequisites

- Node.js 22+
- NPM 11+
- PostgreSQL 18 (running on port 5433 locally)
- Git

## Local Development Setup

### 1. Clone and install

```powershell
git clone <repo-url> bellacasa
cd bellacasa
npm install
```

### 2. Environment configuration

```powershell
# Copy the environment template
Copy-Item .env.example .env.development
# Edit .env.development with your local settings
```

### 3. Database setup

```powershell
# Run migrations
npm run migrate --workspace=packages/database
```

### 4. Start development servers

```powershell
# Start both API and Web concurrently
npm run dev

# Or individually:
npm run dev:api    # NestJS API on port 3001
npm run dev:web    # Next.js on port 3000
```

### 5. Verify

- API Health: http://localhost:3001/api/v1/health
- API Docs: http://localhost:3001/api/docs
- Frontend: http://localhost:3000

## Docker (when Docker Desktop is installed)

```powershell
docker compose up -d
```

## Testing

```powershell
# All tests
npm run test

# API unit tests only
npm run test:api

# E2E tests (requires running database)
cd apps/api && npm run test:e2e
```

## Development Rules

1. **No placeholder data** — All data comes from the real PostgreSQL database
2. **One phase at a time** — Follow the phased roadmap in the architecture document
3. **No mock APIs** — Every endpoint must query real data
4. **Financial integrity** — All money uses Decimal types, never Float

## Phase Status

| Phase | Description | Status |
|---|---|---|
| 0 | Architecture | ✅ Complete |
| 1 | Project Foundation | 🔄 In Progress |
| 2 | Authentication | ⏳ Pending |
| 3 | RBAC | ⏳ Pending |
| 4 | Hotel Configuration | ⏳ Pending |

## Security

- Argon2id password hashing
- JWT in HttpOnly, Secure, SameSite=Strict cookies
- Refresh token rotation
- Rate limiting on all endpoints
- RBAC with granular permissions
- Immutable audit logs
- OWASP-compliant input validation

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## Deployment (Hostinger VPS)

This application is fully dockerized and ready for production deployment on Hostinger VPS using Docker Compose.

### Steps to Deploy

1. **Clone the repository** on your VPS:
   ```bash
   git clone <repo-url> bellacasa
   cd bellacasa
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (you can copy from `.env.example`).
   Ensure you set the following for production:
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

3. **Start the Production Services**:
   The `docker-compose.prod.yml` file builds the Next.js frontend and NestJS API locally on your VPS and spins up PostgreSQL and Redis.
   
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify Deployment**:
   - The Web frontend will run on port `3000`.
   - The API server will run on port `3001`.
   
   You should set up a reverse proxy (like Nginx or Traefik) on your Hostinger VPS to route traffic from `https://kwaleebeachresort.com` to port `3000` and `https://api.kwaleebeachresort.com` to port `3001`.
