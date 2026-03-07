# ARCHITECTURE.md

## Frameverse — System Architecture Reference

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Authentication Flow](#5-authentication-flow)
6. [Database Architecture](#6-database-architecture)
7. [Feature Architecture](#7-feature-architecture)
8. [API Communication Flow](#8-api-communication-flow)
9. [Security Considerations](#9-security-considerations)
10. [Scalability Considerations](#10-scalability-considerations)

---

## 1. System Overview

Frameverse is a developer-centric social platform built on the **MERN stack** (MongoDB, Express, React, Node.js). The system follows a **decoupled, three-tier architecture** where the frontend and backend communicate exclusively through a RESTful API.

The platform is designed to support:

- **High-concurrency social interactions** — likes, comments, and follows with real-time feedback
- **Media-rich content** — image upload, storage, and delivery via Cloudinary
- **Real-time messaging** — bidirectional communication via WebSockets
- **Developer-specific features** — GitHub and LeetCode activity integration

---

## 2. High-Level Architecture

The system is organized into three distinct tiers, each with a clearly separated responsibility:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                │
│                           React.js                                  │
│              (SPA — Component UI, State, Routing)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │  REST API (HTTP/JSON)
                             │  WebSocket (Socket.io)
┌────────────────────────────▼────────────────────────────────────────┐
│                          LOGIC TIER                                 │
│                      Node.js / Express                              │
│           (Controllers, Middleware, Services, Auth)                 │
└──────┬─────────────────────┬───────────────────────────────────────-┘
       │                     │
       │ Mongoose ODM         │ SDK / REST
       │                     │
┌──────▼──────────┐   ┌──────▼──────────────────────────────────────┐
│   DATA TIER     │   │              EXTERNAL SERVICES               │
│  MongoDB Atlas  │   │  Cloudinary (Media)  ·  Firebase (Realtime) │
│  (Primary DB)   │   │  GitHub API          ·  LeetCode API        │
└─────────────────┘   └─────────────────────────────────────────────┘
```

| Tier | Technology | Role |
|---|---|---|
| Client | React.js | UI rendering, user interaction, state management |
| Logic | Node.js / Express | Business logic, authentication, API routing |
| Data | MongoDB Atlas | Persistent data storage via Mongoose ODM |
| Media | Cloudinary | Image upload, transformation, and CDN delivery |

---

## 3. Frontend Architecture

The frontend is a single-page application (SPA) built with React using a functional component approach throughout.

### Directory Structure

```
src/
├── components/        # Reusable atomic UI elements (Button, Avatar, Modal)
├── pages/             # Route-level views composed from components (Feed, Profile, Login)
├── services/          # Centralized API communication layer (Axios instances)
├── context/           # Global state providers (AuthContext, ThemeContext)
└── hooks/             # Custom React hooks for shared logic
```

### Key Design Decisions

| Concern | Approach | Details |
|---|---|---|
| State Management | React Hooks | `useState` and `useContext` handle local and shared state |
| Session Persistence | `localStorage` | JWT token stored client-side for stateless auth |
| API Communication | Axios (`services/`) | All HTTP calls are centralized; base URL and auth headers configured once |
| Routing | `react-router-dom` | Declarative routing with a `ProtectedRoute` wrapper that redirects unauthenticated users |

---

## 4. Backend Architecture

The backend is a **monolithic Node.js server** using the Express framework. All application domains (Auth, Users, Posts, Notifications) are served from a single deployable process, with clear internal separation via a layered folder structure.

### Directory Structure

```
server/
├── controllers/       # Request handlers — one file per domain (auth, post, user)
├── routes/            # URL-to-controller mappings; defines the API surface
├── middleware/         # Cross-cutting concerns (JWT guard, rate limiter, validator)
├── services/          # External integrations (Cloudinary, Firebase, GitHub, LeetCode)
├── models/            # Mongoose schema definitions
└── utils/             # Shared helpers (error formatting, token generation)
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Routes** | Define API endpoints and bind them to the appropriate controller and middleware chain |
| **Middleware** | Enforce authentication, validate request payloads, and apply rate limiting before reaching controllers |
| **Controllers** | Contain domain-specific business logic; interact with Mongoose models and external services |
| **Services** | Abstract third-party API calls (e.g., Cloudinary uploads, Firebase events) behind a clean interface |
| **Models** | Define schema structure, validation rules, and index configurations via Mongoose |

### Authentication

Stateless authentication is implemented using **JSON Web Tokens (JWT)**. The server does not maintain session state — every request is authorized independently based on the token presented in the `Authorization` header.

---

## 5. Authentication Flow

```
  Client                              Server
    │                                   │
    │  POST /api/auth/login              │
    │  { email, password, captchaToken } │
    │ ─────────────────────────────────> │
    │                                   │  1. Verify reCAPTCHA token
    │                                   │  2. Look up user by email
    │                                   │  3. Compare password with bcrypt hash
    │                                   │  4. Sign JWT with user ID + role
    │                                   │
    │  200 OK — { token, user }          │
    │ <───────────────────────────────── │
    │                                   │
    │  Store token (localStorage/cookie) │
    │                                   │
    │  GET /api/posts  (protected)       │
    │  Authorization: Bearer <token>     │
    │ ─────────────────────────────────> │
    │                                   │  5. JWT middleware verifies signature
    │                                   │  6. Attach decoded user to req.user
    │                                   │  7. Controller executes
    │                                   │
    │  200 OK — { posts: [...] }         │
    │ <───────────────────────────────── │
```

**Step-by-step summary:**

1. **Credential Submission** — Client sends `email`, `password`, and a reCAPTCHA token to `POST /api/auth/login`.
2. **reCAPTCHA Verification** — Server validates the CAPTCHA token with Google before proceeding.
3. **Password Check** — Retrieved hash is compared against the submitted password using `bcrypt.compare`.
4. **Token Issuance** — On success, a signed JWT containing `userId` and `role` is returned to the client.
5. **Client Storage** — Token is stored in `localStorage` or an `HttpOnly` cookie depending on configuration.
6. **Authenticated Requests** — Token is attached to the `Authorization: Bearer <token>` header on subsequent requests.
7. **Middleware Verification** — The JWT middleware validates the token signature and expiry on every protected route before passing control to the controller.

---

## 6. Database Architecture

MongoDB Atlas is the primary data store. Data is structured in **six core collections**, connected via `ObjectId` references using Mongoose.

| Collection | Description |
|---|---|
| `users` | Profile data, hashed credentials, follower/following graph |
| `posts` | Media URLs, descriptions, tags, and denormalized engagement counters |
| `comments` | Threaded responses linked to posts; supports one level of nesting |
| `notifications` | Per-user activity alerts (likes, comments, follows, mentions) |
| `analytics` | Impression and engagement logs for per-post and platform-wide metrics |
| `chats` / `messages` | Real-time direct messaging thread and message data |

For full schema definitions, field-level documentation, and indexing details, see [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

---

## 7. Feature Architecture

### Post Creation

```
User selects image
      │
      ▼
Frontend crops/previews (canvas)
      │
      ▼
POST /api/posts — multipart/form-data
      │
      ▼
Cloudinary Service (upload + transform)
      │  returns media URL
      ▼
Post Controller saves metadata to MongoDB
      │  { author, imageUrl, description, tags }
      ▼
201 Created — new post returned to client
```

### Like System

When a user likes a post, two things happen in parallel:

1. **Persistence** — An atomic `$addToSet` / `$pull` operation updates the `likes` array and `likeCount` counter on the Post document.
2. **Real-time notification** — A Socket.io event is emitted to the post author's connected socket, triggering an in-app notification.

### Follow System

Following a user triggers **two simultaneous writes** to the `users` collection to keep the social graph consistent:

- `$push` the target user's `_id` into the current user's `following` array.
- `$push` the current user's `_id` into the target user's `followers` array.

Both operations are performed atomically within the same request to avoid graph inconsistencies.

### Analytics Tracking

Post impressions and engagement events are logged asynchronously to the `analytics` collection. This background operation does not block the primary request response, keeping API latency low while accumulating data for dashboard rendering.

---

## 8. API Communication Flow

The following illustrates a full request lifecycle for a **Like Post** action:

```
User clicks "Like" button
         │
         ▼
React Component — optimistic UI state update
         │
         ▼
Post Service — POST /api/posts/:id/like (Axios)
         │
         ▼
Express Router — matches route, applies middleware chain
         │
         ▼
JWT Middleware — verifies token, attaches req.user
         │
         ▼
Post Controller — calls Mongoose update + emits socket event
         │
         ├──> MongoDB — atomic update to likes array + likeCount
         │
         └──> Socket.io — emits 'notification' event to post author
         │
         ▼
HTTP 200 Response — { liked: true, likeCount: 42 }
         │
         ▼
React Component — confirms optimistic update or rolls back on error
```

---

## 9. Security Considerations

| Concern | Implementation | Notes |
|---|---|---|
| **Authentication** | JWT (stateless) | Tokens signed with a secret key; short expiry recommended with refresh token rotation |
| **Password Storage** | bcrypt | Passwords are hashed with a configurable salt rounds factor before persistence |
| **Bot Protection** | Google reCAPTCHA | Validated server-side on login and registration to prevent automated attacks |
| **Input Validation** | Mongoose schema validation | All incoming request bodies are validated against strict schema rules before reaching the database |
| **Protected Routes** | JWT middleware | All non-public routes require a valid, unexpired token verified on every request |
| **Rate Limiting** | Express middleware | Applied at the router level to prevent brute-force and denial-of-service attacks |

> **Recommendation:** Avoid storing JWTs in `localStorage` in production. Prefer `HttpOnly` cookies to mitigate XSS exposure. Pair with CSRF protection if using cookies.

---

## 10. Scalability Considerations

The current architecture is designed for a single-server deployment but is structured to accommodate growth at each layer.

| Strategy | Mechanism | Addresses |
|---|---|---|
| **Query Caching** | Redis | Cache frequently read data (user profiles, post feeds) to reduce MongoDB load |
| **Media Delivery** | Cloudinary CDN | Static assets are served from edge nodes close to the user, reducing origin load |
| **Background Jobs** | Message queue (e.g., BullMQ) | Decouple notification delivery and analytics writes from the request lifecycle |
| **Horizontal Scaling** | Stateless JWT auth | Because no server-side session state exists, multiple Node.js instances can run behind a load balancer without sticky sessions |
| **Service Extraction** | Microservices (future) | The Analytics and Messaging modules are the primary candidates for extraction into independent services as traffic grows |

```
Current (Monolith)          Future (Partial Microservices)
──────────────────          ──────────────────────────────
  Express Server              API Gateway
  ├── Auth                    ├── Core API (Auth, Posts, Users)
  ├── Posts                   ├── Messaging Service
  ├── Users                   └── Analytics Service
  ├── Messaging
  └── Analytics
```
