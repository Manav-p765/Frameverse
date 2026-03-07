# 🛠️ Installation Guide

> Get Frameverse running on your local machine in under 10 minutes.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone the Repository](#1-clone-the-repository)
- [Install Dependencies](#2-install-dependencies)
- [Configure Environment Variables](#3-configure-environment-variables)
- [Run the Backend](#4-run-the-backend)
- [Run the Frontend](#5-run-the-frontend)
- [Verify the Setup](#6-verify-the-setup)
- [Troubleshooting](#troubleshooting)
- [Development Tips](#development-tips)

---

## Prerequisites

Ensure the following tools are installed and configured before proceeding.

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | v16.x or higher | `node -v` to verify |
| npm | Comes with Node | `npm -v` to verify |
| [Git](https://git-scm.com/) | Any recent version | `git --version` to verify |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | — | Free tier is sufficient. Have your connection URI ready. |
| [Firebase](https://firebase.google.com/) | — | *(Optional)* Required only for Firebase Auth / Storage features |

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/frameverse.git
cd frameverse
```

---

## 2. Install Dependencies

Frameverse has separate dependency trees for the backend and frontend. Install both.

**Backend**

```bash
cd Backend
npm install
```

**Frontend**

```bash
cd Frontend/frameverse
npm install
```

---

## 3. Configure Environment Variables

Both the backend and frontend require `.env` files with their respective configuration values. These files are **not** committed to the repository, so you must create them manually.

### Backend — `Backend/.env`

```env
# ── Server ────────────────────────────────
PORT=5000

# ── Database ──────────────────────────────
MONGODB_URI=your_mongodb_atlas_connection_string

# ── Authentication ────────────────────────
JWT_SECRET=your_jwt_secret_key
FIREBASE_ADMIN_SDK_PATH=path/to/your/service_account.json

# ── Email (Password Reset OTP) ────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password        # Use an App Password, not your account password

# ── reCAPTCHA ─────────────────────────────
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

> **Tip:** To generate a Gmail App Password, go to your Google Account → Security → 2-Step Verification → App Passwords.

### Frontend — `Frontend/frameverse/.env`

```env
# ── API ───────────────────────────────────
VITE_API_URL=http://localhost:5000/api

# ── reCAPTCHA ─────────────────────────────
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

> **Note:** All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

---

## 4. Run the Backend

From the `Backend/` directory, start the Express server:

```bash
# Standard start
npm start

# With auto-reload on file changes (recommended for development)
npm run dev
```

The API will be available at `http://localhost:5000/api`.

---

## 5. Run the Frontend

From the `Frontend/frameverse/` directory, start the Vite dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 6. Verify the Setup

Once both servers are running, confirm everything is working:

| Service | URL | Expected |
|---|---|---|
| Frontend | `http://localhost:5173` | Frameverse login/signup page loads |
| Backend API | `http://localhost:5000/api` | Returns a JSON response or 404 |

To quickly verify the backend is live, run:

```bash
curl http://localhost:5000/api
```

You should receive a JSON response (or a structured error), not a connection refusal.

---

## Troubleshooting

**MongoDB connection error**
- Ensure your current IP address is whitelisted in MongoDB Atlas under **Network Access**.
- If using a local MongoDB instance, confirm the service is running with `mongosh` or `sudo systemctl status mongod`.
- Double-check that `MONGODB_URI` in `Backend/.env` is correctly formatted and has no trailing spaces.

**Missing or invalid environment variables**
- Ensure both `.env` files exist in the correct directories (`Backend/.env` and `Frontend/frameverse/.env`).
- Variable names are case-sensitive. Compare them carefully against the templates above.
- After editing a `.env` file, restart the relevant server — changes are not picked up automatically.

**Port already in use**
- If you see `EADDRINUSE`, another process is occupying the port. Find and stop it:
  ```bash
  # macOS / Linux
  lsof -ti :5000 | xargs kill

  # Windows (PowerShell)
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```
- Alternatively, change `PORT` in `Backend/.env` to a free port and update `VITE_API_URL` accordingly.

**`npm install` fails**
- Ensure your Node.js version is v16 or higher: `node -v`.
- Try clearing the npm cache: `npm cache clean --force`, then re-run `npm install`.

---

## Development Tips

**Backend**
- `nodemon` is configured via `npm run dev` and will automatically restart the server on any file change.
- Use `console.log` for quick debugging, or attach Node's built-in debugger with `node --inspect`.
- Test API endpoints independently using [Postman](https://www.postman.com/) or the [Thunder Client](https://www.thunderclient.com/) VS Code extension.

**Frontend**
- Install the [React Developer Tools](https://react.dev/learn/react-developer-tools) browser extension to inspect component state and props.
- Vite's HMR (Hot Module Replacement) updates the browser instantly on save — no manual refresh needed.
- Prefix all API calls through the `VITE_API_URL` variable rather than hardcoding `localhost` URLs.

---

*For API reference, see [`API_DOCS.md`](./API_DOCS.md). For deployment instructions, see the [README](./README.md#deployment).*
