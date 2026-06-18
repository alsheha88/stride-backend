# Stride API

The backend that powers [Stride](https://stridedev.dev) — a learning tracker for self-taught web developers.

## About

Stride helps self-taught web devs track their concepts, projects, and confidence over time. This is the REST API that handles authentication, concept and project CRUD, ratings, and dashboard analytics.

The frontend lives in a [separate repo](https://github.com/alsheha88/stride-frontend).

## Features

- **JWT-based auth** with refresh tokens, password reset, and email verification
- **Concept tracking** — full CRUD with confidence ratings (1-5) and per-concept notes
- **Project tracking** — full CRUD with status transitions (Not Started → In Progress → Completed)
- **Concept-project links** — many-to-many relationship; ratings update when projects complete
- **Dashboard analytics** — concept totals, projects completed, rating chart data, recently added items
- **Production hardening** — rate limiting, security headers, env validation, structured logging, error monitoring

## Tech Stack

**Runtime & Framework**

- Node.js
- Express
- TypeScript

**Data Layer**

- PostgreSQL (hosted on Neon)
- Prisma ORM

**Auth & Security**

- JWT (access + refresh tokens)
- bcrypt
- Helmet
- Express Rate Limit
- Zod (request validation + env validation)

**Email**

- Resend

**Monitoring & Logging**

- Sentry
- Pino (structured logging)

**Infrastructure**

- Railway (deployment)
- Neon (Postgres)
- Custom domain on Vercel-managed DNS

## API Overview

| Resource     | Endpoints                                              |
| ------------ | ------------------------------------------------------ |
| Auth         | `/auth/signup`, `/login`, `/logout`, `/refresh`, etc. |
| Concepts     | `GET /concepts`, `POST /concepts`, `PATCH /:id`, ... |
| Notes        | `POST /concepts/:id/notes`, `PATCH/DELETE :noteId`   |
| Projects     | `GET /projects`, `POST /projects`, `PATCH /:id`, etc. |
| Dashboard    | `GET /dashboard`                                       |

Full route documentation lives in `src/routes/`.

## Architecture

- **Controller pattern** — routes are thin, business logic lives in controllers
- **Zod schemas** validate every request body and URL parameter
- **Prisma migrations** track every schema change
- **Custom error classes** map cleanly to HTTP responses
- **Centralized error handler** ensures consistent API responses

## Running Locally

You'll need Node.js, a PostgreSQL database, and a Resend account.

```bash
# Clone
git clone https://github.com/alsheha88/stride-backend.git
cd stride-backend

# Install
npm install

# Set up environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, RESEND_API_KEY, etc.

# Run migrations
npx prisma migrate dev

# (Optional) Seed dev data
npx prisma db seed

# Start
npm run dev
```

---
