# Frameverse

A full-stack social platform for developers to share coding progress, connect with peers, and communicate in real-time.

## Features

- **Social Feed** — Post updates with images, auto-post from GitHub/LeetCode
- **Real-time Chat** — 1v1 and group messaging with typing indicators, read receipts, file sharing
- **Video & Audio Calls** — WebRTC-based calls with push notification alerts
- **Explore** — Discover trending posts and recommended users
- **Notifications** — Real-time notifications for likes, comments, follows, and calls
- **Analytics Dashboard** — Track engagement, growth, and activity metrics
- **Push Notifications** — Browser/mobile notifications via Web Push API

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, TailwindCSS, Zustand, Socket.IO Client |
| **Backend** | Node.js, Express 5, Socket.IO, MongoDB/Mongoose |
| **Auth** | Firebase Auth, JWT |
| **Storage** | Cloudinary (images), MongoDB (data) |
| **Cache** | Redis (feeds, rate limiting) |
| **Push** | Web Push API (VAPID) |
| **Monitoring** | Prometheus (prom-client) |

## Project Structure

```
Frameverse/
├── Backend/
│   ├── config/          # DB, Redis, Cloudinary, Socket.IO, Firebase setup
│   ├── controllers/     # Request handlers (chat, post, user, auth, calls)
│   ├── models/          # Mongoose schemas (User, Post, Chat, Message, etc.)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic (feed, engagement, analytics, AI)
│   ├── utils/           # Helpers (socket emitter, push, errors, cache)
│   ├── workers/         # Background jobs (auto-post, trending, notifications)
│   ├── middleware.js     # Auth, validation, ownership middleware
│   └── server.js        # Entry point
│
├── Frontend/frameverse/
│   ├── public/          # Static assets, SW, manifest, icons
│   └── src/
│       ├── components/  # UI components (chat, call, posts, auth, etc.)
│       ├── hooks/       # Custom hooks (socket, push notifications)
│       ├── pages/       # Page-level components
│       ├── services/    # API client (Axios)
│       ├── store/       # Zustand state management
│       └── utils/       # Route protection, helpers
│
└── Docs/                # Architecture, API docs, deployment guide
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Redis (optional — falls back to in-memory)
- Firebase project (for auth)
- Cloudinary account (for image uploads)

### 1. Clone & Install

```bash
git clone https://github.com/Manav-p765/Frameverse.git
cd Frameverse

# Backend
cd Backend
npm install

# Frontend
cd ../Frontend/frameverse
npm install
```

### 2. Environment Variables

Copy the example and fill in your values:

```bash
cp Backend/.env.example Backend/.env
```

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase admin SDK email |
| `FIREBASE_PRIVATE_KEY` | Firebase admin SDK private key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RECAPTCHA_PROJECT_ID` | Google reCAPTCHA project ID |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA secret key |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `SMTP_USER` | Email for sending OTPs |
| `SMTP_PASS` | Gmail app password |
| `REDIS_URL` | Redis connection URL (optional) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `VAPID_PUBLIC` | Web Push public key |
| `VAPID_PRIVATE` | Web Push private key |
| `VAPID_EMAIL` | Contact email for push services |

Frontend `.env.development`:
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA site key |

### 3. Generate VAPID Keys (for push notifications)

```bash
cd Backend
npx web-push generate-vapid-keys
```

Add the output to your `.env` as `VAPID_PUBLIC` and `VAPID_PRIVATE`.

### 4. Run

```bash
# Backend (with auto-reload)
cd Backend
npx nodemon server.js

# Frontend
cd Frontend/frameverse
npm run dev
```

Backend runs on `http://localhost:8080`, Frontend on `http://localhost:5173`.

## Deployment

- **Frontend**: Vercel (see `vercel.json`)
- **Backend**: Render / Railway / any Node.js host
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud

See `Docs/DEPLOYMENT.md` for detailed instructions.

## License

ISC