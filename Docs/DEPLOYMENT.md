# DEPLOYMENT.md

## Frameverse — Production Deployment Guide

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Deployment Architecture](#2-deployment-architecture)
3. [Environment Variables](#3-environment-variables)
4. [Deploying the Backend](#4-deploying-the-backend)
5. [Deploying the Frontend](#5-deploying-the-frontend)
6. [Connecting Frontend to Backend](#6-connecting-frontend-to-backend)
7. [Domain Configuration](#7-domain-configuration)
8. [Production Security](#8-production-security)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Future Improvements](#10-future-improvements)

---

## 1. Introduction

This guide covers the end-to-end process for deploying Frameverse to a production environment. It details the configuration, hosting, and connection of all three platform tiers: the **React frontend**, the **Node.js/Express backend API**, and the **MongoDB Atlas database**.

Follow each section in order for a first-time deployment. Sections 4 and 5 can be run in parallel once environment variables are configured.

> **Prerequisites:** You will need accounts on [MongoDB Atlas](https://www.mongodb.com/atlas), [Cloudinary](https://cloudinary.com), and your chosen backend host (Render, Railway, or a VPS) before starting.

---

## 2. Deployment Architecture

Each tier of the platform is hosted on a purpose-appropriate provider to maximize reliability, performance, and cost-efficiency.

```
                        ┌─────────────────────────────┐
                        │         End Users            │
                        └──────────────┬──────────────┘
                                       │  HTTPS
                        ┌──────────────▼──────────────┐
                        │   Vercel (Frontend / CDN)    │
                        │   frameverse.online          │
                        └──────────────┬──────────────┘
                                       │  REST API calls
                        ┌──────────────▼──────────────┐
                        │  Render / Railway / VPS      │
                        │  (Backend — Node.js/Express) │
                        │  api.frameverse.online       │
                        └─────────┬──────────┬────────┘
                                  │           │
               ┌──────────────────▼─┐   ┌────▼─────────────────┐
               │   MongoDB Atlas    │   │      Cloudinary       │
               │   (Database)       │   │   (Media Storage)     │
               └────────────────────┘   └──────────────────────┘
```

| Service | Provider | Purpose |
|---|---|---|
| Frontend | Vercel | React SPA hosting with global CDN delivery |
| Backend | Render / Railway / VPS | Node.js API server |
| Database | MongoDB Atlas | Managed cloud MongoDB |
| Media Storage | Cloudinary | Image upload, transformation, and CDN delivery |

---

## 3. Environment Variables

All secrets and environment-specific values must be set in your hosting provider's dashboard — **never committed to version control.**

Create a `.env` file locally for development, and configure the equivalent variables in your provider's settings panel for production.

### Backend Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=your_production_mongodb_atlas_uri

# Authentication
JWT_SECRET=your_long_random_cryptographically_secure_secret

# Email (Nodemailer)
EMAIL_USER=your_nodemailer_email@example.com
EMAIL_PASS=your_email_app_password

# Payments (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_production_key
RAZORPAY_SECRET=your_razorpay_production_secret

# CORS
FRONTEND_URL=https://frameverse.vercel.app
```

### Frontend Variables

```env
# API
VITE_API_URL=https://api.frameverse.online/api

# Security
VITE_RECAPTCHA_SITE_KEY=your_production_recaptcha_site_key
```

> ⚠️ **Security reminder:** Add `.env` to your `.gitignore` immediately. Use a secrets manager (e.g., [Doppler](https://doppler.com) or provider-native vault) for team environments. Rotate `JWT_SECRET` and payment credentials regularly.

---

## 4. Deploying the Backend

The backend can be deployed to **Render**, **Railway**, or a self-managed **VPS** (e.g., DigitalOcean, AWS EC2). The steps below apply to any provider with Git-based deployment.

### Step 1 — Push to a Remote Repository

Ensure the latest backend code is pushed to your GitHub or GitLab repository.

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### Step 2 — Connect Repository to Your Provider

In your hosting provider's dashboard:

1. Create a new **Web Service**.
2. Connect your GitHub/GitLab account and select the backend repository.
3. Set the **root directory** if the backend lives in a monorepo subdirectory (e.g., `server/`).

### Step 3 — Configure Build & Start Commands

| Setting | Value |
|---|---|
| Build Command | `npm install` |
| Start Command | `npm start` |
| Node Version | `18.x` or higher (set via environment variable `NODE_VERSION=18`) |

### Step 4 — Set Environment Variables

Add all [backend variables](#backend-variables) from Section 3 in the provider's **Environment** settings panel. Do not paste them into the repository.

### Step 5 — Deploy & Verify

Trigger an initial deploy. Once live, verify the API is reachable:

```bash
curl https://api.frameverse.online/api/health
# Expected: { "status": "ok" }
```

> **Tip:** Add a `/api/health` endpoint to your Express app that returns `200 OK`. This doubles as a health check for the provider's uptime monitoring.

---

## 5. Deploying the Frontend

The frontend is deployed to **Vercel**, which auto-detects Vite projects and handles builds, previews, and CDN distribution.

### Step 1 — Import Repository

1. Log in to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository.
3. Set the **root directory** if using a monorepo (e.g., `client/`).

### Step 2 — Configure Build Settings

Vercel auto-detects Vite, but confirm the following:

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Step 3 — Set Environment Variables

Add the [frontend variables](#frontend-variables) from Section 3 in Vercel's **Settings → Environment Variables** panel. Set the scope to **Production**.

### Step 4 — Deploy & Verify

Click **Deploy**. Vercel will build and publish the app. Once complete, visit the generated `.vercel.app` URL to confirm the UI loads correctly.

To test a production build locally before deploying:

```bash
npm run build
npm run preview
```

---

## 6. Connecting Frontend to Backend

The frontend must know the URL of the deployed backend API. This is controlled by the `VITE_API_URL` environment variable, which is injected at build time by Vite.

Configure the Axios base URL in your API service layer:

```js
// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Required if using HttpOnly cookies for auth
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**Checklist before going live:**

- [ ] `VITE_API_URL` points to the production backend URL (not `localhost`)
- [ ] Backend `FRONTEND_URL` matches the exact Vercel deployment URL
- [ ] CORS policy on the backend allows only the production frontend origin

---

## 7. Domain Configuration

### Frontend — Custom Domain on Vercel

1. In your project dashboard, navigate to **Settings → Domains**.
2. Add your domain (e.g., `frameverse.online`).
3. Create the following DNS records with your registrar:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` *(Vercel IP — confirm in dashboard)* |
| `CNAME` | `www` | `cname.vercel-dns.com` |

### Backend — API Subdomain

1. In your hosting provider's networking settings, assign the subdomain `api.frameverse.online` to your backend service.
2. Add the DNS record with your registrar:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `api` | `your-service.onrender.com` *(or equivalent)* |

> **Why a subdomain?** Keeping the API on `api.frameverse.online` (rather than a path on the main domain) isolates CORS policy management, simplifies future service migration, and makes SSL certificate handling cleaner.

SSL certificates are provisioned automatically by both Vercel and Render via Let's Encrypt. No manual configuration is required.

---

## 8. Production Security

| Concern | Action Required |
|---|---|
| **HTTPS / TLS** | Enforced automatically by Vercel and Render. Verify all API calls use `https://` in `VITE_API_URL`. |
| **CORS** | Restrict allowed origins to `FRONTEND_URL` only. Reject all other origins in production. |
| **JWT Storage** | Prefer `HttpOnly` cookies over `localStorage` to mitigate XSS. If using `localStorage`, ensure strict CSP headers are set. |
| **Rate Limiting** | Apply `express-rate-limit` to all API routes. Use stricter limits on `/api/auth/*` endpoints. |
| **Secret Rotation** | Rotate `JWT_SECRET` and payment credentials on a regular schedule. Invalidate existing tokens on rotation. |
| **Dependency Audits** | Run `npm audit` before each production deployment. Address high-severity findings before shipping. |

### Recommended CORS Configuration

```js
// server/index.js
import cors from "cors";

app.use(cors({
  origin: process.env.FRONTEND_URL,  // e.g. "https://frameverse.online"
  credentials: true,                  // Required for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));
```

---

## 9. Monitoring & Logging

| Layer | Tool | What to Watch |
|---|---|---|
| **Server Logs** | Provider dashboard (Render Logs / Railway Logs) | Runtime errors, crash reports, startup failures |
| **Error Tracking** | [Sentry](https://sentry.io) | Frontend JS exceptions, unhandled API errors with stack traces |
| **Uptime Monitoring** | [BetterUptime](https://betteruptime.com) or [UptimeRobot](https://uptimerobot.com) | `/api/health` endpoint availability, response time alerts |
| **Database Performance** | MongoDB Atlas Charts & Performance Advisor | Slow queries, index utilization, connection pool saturation |
| **API Analytics** | [Datadog](https://datadoghq.com) or provider metrics | Request volume, error rate (4xx/5xx), latency percentiles |

### Sentry Integration (Backend)

```bash
npm install @sentry/node
```

```js
// server/index.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2, // Capture 20% of transactions for performance monitoring
});
```

---

## 10. Future Improvements

| Improvement | Mechanism | Benefit |
|---|---|---|
| **CI/CD Pipeline** | GitHub Actions | Automatically run tests and lint checks on every push; deploy to production only when `main` passes |
| **Containerization** | Docker + Docker Compose | Consistent build environment across local, staging, and production; simplifies VPS deployment |
| **Staging Environment** | Vercel preview deployments + separate Render service | Validate changes in a production-like environment before merging to `main` |
| **Edge Functions** | Vercel Edge Runtime | Move latency-sensitive logic (auth checks, redirects) to edge nodes closer to the user |
| **Secrets Management** | Doppler / AWS Secrets Manager | Centralize and audit secret access across services; remove manual copy-paste of `.env` values |

### Recommended CI/CD Workflow (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Render
        if: success()
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```
