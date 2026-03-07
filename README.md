<div align="center">

# 🖼️ Frameverse

**A full-stack social platform built for developers — share your work, track your progress, and grow with a community.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB.svg)](https://reactjs.org/)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-overview) · [Database Models](#-database-models) · [Deployment](#-deployment) · [Contributing](#-contributing)

</div>

---

## 📌 Project Overview

Frameverse is a high-performance MERN-stack social platform tailored for developers. It enables users to create developer profiles, share project updates, and engage with a community through likes, follows, and real-time messaging. Built with scalability in mind, Frameverse also features automated GitHub/LeetCode progress tracking and detailed analytics dashboards for both users and administrators.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based secure login and signup with reCAPTCHA v2/v3 integration to prevent bots |
| 📰 **Social Feed** | Real-time post feed with image cropping support and AI-powered caption suggestions |
| 💬 **Interactions** | Like, comment on, and share posts with other developers |
| 👥 **Follow System** | Build your developer network by following and unfollowing other users |
| 📊 **Analytics** | Dedicated dashboards for admins and users to visualize engagement, growth, and activity trends |
| 💌 **Messaging** | Real-time one-on-one chat built with WebSockets |
| 🤖 **Auto-Post** | Automatically share GitHub commits and LeetCode submissions as posts |
| 🛡️ **Role-Based Access** | Distinct views and permissions for standard users and administrators |

---

## 🛠️ Tech Stack

**Frontend**
- [React.js](https://reactjs.org/) — Component-based UI framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — Animations and transitions
- [Lucide React](https://lucide.dev/) — Icon library

**Backend**
- [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) — REST API server

**Database & Storage**
- [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/) — Cloud-hosted NoSQL database
- [Cloudinary](https://cloudinary.com/) / Local Storage — Image uploads and management

**Authentication & Security**
- [JWT](https://jwt.io/) — Stateless token-based authentication
- [Firebase](https://firebase.google.com/) *(optional)* — Social login integration
- [reCAPTCHA](https://www.google.com/recaptcha/) — Bot protection on auth forms

**Deployment**
- [Vercel](https://vercel.com/) — Frontend hosting
- [Render](https://render.com/) / [Railway](https://railway.app/) — Backend hosting

---

## 📁 Project Structure

```
Frameverse/
├── Backend/                    # Express.js server
│   ├── controllers/            # Route handler logic (business layer)
│   ├── models/                 # Mongoose schemas and models
│   ├── routes/                 # API route definitions
│   ├── middleware/             # JWT auth, input validation, error handling
│   └── services/               # External API integrations (GitHub, LeetCode, Cloudinary)
│
└── Frontend/
    └── frameverse/
        └── src/
            ├── components/     # Reusable UI components (buttons, cards, modals)
            ├── pages/          # Feature-level page views (Feed, Profile, Admin)
            ├── services/       # Axios API call wrappers
            └── context/        # React Context for global state (auth, theme)
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** v16 or higher — [Download](https://nodejs.org/)
- **npm** or **yarn** — comes with Node.js
- **MongoDB Atlas** account — [Sign up free](https://www.mongodb.com/atlas/database)
- **Cloudinary** account *(for image uploads)* — [Sign up free](https://cloudinary.com/)
- **Google reCAPTCHA** keys — [Get keys](https://www.google.com/recaptcha/admin)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/frameverse.git
cd Frameverse
```

#### 2. Set Up the Backend

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory (see [Environment Variables](#-environment-variables)), then start the server:

```bash
npm start
# Server runs on http://localhost:5000
```

#### 3. Set Up the Frontend

```bash
cd Frontend/frameverse
npm install
```

Create a `.env` file in the `Frontend/frameverse/` directory (see [Environment Variables](#-environment-variables)), then start the dev server:

```bash
npm run dev
# App runs on http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend — `Backend/.env`

```env
# Server
PORT=5000

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Authentication
JWT_SECRET=your_strong_jwt_secret_key

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_google_recaptcha_secret_key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# External Integrations (Auto-Post)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
LEETCODE_API_URL=https://leetcode.com/graphql
```

### Frontend — `Frontend/frameverse/.env`

```env
# API Base URL (point to your backend)
VITE_API_URL=http://localhost:5000/api

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=your_google_recaptcha_site_key
```

> **Security note:** Never commit `.env` files to version control. Both files are included in `.gitignore` by default.

---

## 📡 API Overview

All endpoints are prefixed with `/api`. Authentication-protected routes require a valid `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user account | ❌ |
| `POST` | `/auth/login` | Log in and receive a JWT | ❌ |

### Posts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/post` | Fetch the paginated post feed | ✅ |
| `POST` | `/post/create` | Create a new post (with optional image) | ✅ |
| `DELETE` | `/post/:id` | Delete a post by ID (owner only) | ✅ |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/user/profile` | Get the authenticated user's profile | ✅ |
| `PUT` | `/user/updateProfile` | Update bio, profile picture, and other details | ✅ |

### Follow System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/user/follow/:id` | Follow a user by ID | ✅ |
| `POST` | `/user/unfollow/:id` | Unfollow a user by ID | ✅ |

### Analytics *(Admin Only)*

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/admin/analytics/overview` | Get platform-wide engagement metrics | ✅ Admin |

---

## 🗄️ Database Models

### `User`

| Field | Type | Description |
|-------|------|-------------|
| `username` | String | Unique display name |
| `email` | String | Unique email address |
| `password` | String | Bcrypt-hashed password |
| `bio` | String | Short profile description |
| `profilePic` | String | Cloudinary image URL |
| `followers` | [ObjectId] | Array of user references |
| `following` | [ObjectId] | Array of user references |

### `Post`

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Reference to the post author |
| `image` | String | Cloudinary image URL |
| `description` | String | Post caption or body text |
| `location` | String | Optional location tag |
| `likes` | [ObjectId] | Array of users who liked the post |
| `comments` | [Object] | Embedded comment objects |
| `postType` | String | `manual`, `github`, or `leetcode` |

### `Chat`

| Field | Type | Description |
|-------|------|-------------|
| `participants` | [ObjectId] | Two user references |
| `messages` | [Object] | Embedded message history |
| `lastMessage` | String | Preview of the most recent message |

---

## ☁️ Deployment

### Backend

Deploy to any Node.js-compatible platform such as [Render](https://render.com/), [Railway](https://railway.app/), or [Heroku](https://heroku.com/).

1. Push your `Backend/` directory to a Git repository.
2. Connect the repository to your hosting provider.
3. Set all environment variables from `Backend/.env` in the platform's dashboard.
4. Ensure the start command is set to `npm start` (or `node server.js`).

### Frontend

Deploy to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/).

1. Connect your repository to Vercel/Netlify and set the root to `Frontend/frameverse`.
2. Set the build command to `npm run build` and output directory to `dist`.
3. Add the environment variable `VITE_API_URL` pointing to your **live backend URL** (e.g., `https://frameverse-api.onrender.com/api`).

> **CORS reminder:** Update your backend's CORS config to allow requests from your deployed frontend origin.

---

## 🔮 Roadmap

- [ ] **WebRTC Video Calls** — Peer-to-peer video chat between connected developers
- [ ] **Enhanced AI Analysis** — Smarter image tagging and post recommendations
- [ ] **Persistent Dark/Light Mode** — Theme preference saved across sessions
- [ ] **Mobile App** — React Native companion application for iOS and Android
- [ ] **Notification System** — In-app and push notifications for follows, likes, and messages

---

## 🤝 Contributing

Contributions are welcome and appreciated! To get started:

1. **Fork** the repository on GitHub.
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes** with a descriptive message:
   ```bash
   git commit -m "feat: add dark mode toggle"
   ```
4. **Push** to your fork and open a **Pull Request** against `main`.

Please ensure your code follows the existing style conventions and includes relevant comments. For significant changes, open an issue first to discuss the proposal.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for full details.

---

<div align="center">
  Built with ❤️ for the developer community · <a href="#">frameverse.io</a>
</div>