# Frameverse API Reference

> Complete reference for all Frameverse REST API endpoints — authentication, posts, messaging, analytics, and more.

## Base URLs

| Environment | URL |
|---|---|
| 🟢 Production | `https://frameverse.online` |
| 🔵 Development | `http://localhost:8080` |

## Authentication

Most endpoints require a valid JWT passed in the request header:

```
Authorization: Bearer <your_token>
```

Obtain a token via `POST /auth/login` or `POST /user/auth/firebase`.

---

## Table of Contents

- [🔐 Authentication & Password Reset](#-authentication--password-reset)
- [👤 User Management](#-user-management)
- [📝 Posts](#-posts)
- [💬 Messaging & Chats](#-messaging--chats)
- [🔔 Notifications](#-notifications)
- [🤖 Auto-Post](#-auto-post)
- [📞 Calls](#-calls)
- [📊 Analytics](#-analytics)

---

## 🔐 Authentication & Password Reset

Endpoints for account registration, login, and the 3-step OTP password-reset flow.

---

### Request Password Reset OTP

```
POST /auth/forgot-password
```

Sends a 6-digit one-time password (OTP) to the user's registered email address to initiate a password reset. This endpoint is rate-limited to prevent abuse.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ Required | The registered email address of the account. |

**Example Request**

```json
{
  "email": "alex@example.com"
}
```

**Example Response `200`**

```json
{
  "message": "OTP sent to alex@example.com"
}
```

> ⚠️ **Rate Limited.** Repeated requests in a short window will be rejected with `429 Too Many Requests`.

---

### Verify OTP

```
POST /auth/verify-otp
```

Validates the 6-digit OTP sent to the user's email. On success, returns a short-lived `resetToken` required by the final reset step.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ Required | The email address the OTP was sent to. |
| `otp` | string | ✅ Required | The 6-digit code from the email. |

**Example Request**

```json
{
  "email": "alex@example.com",
  "otp": "847291"
}
```

**Example Response `200`**

```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

---

### Reset Password

```
POST /auth/reset-password
```

Completes the password reset flow. Requires the original OTP, the `resetToken` from the verify step, and the desired new password.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ Required | The account's email address. |
| `otp` | string | ✅ Required | The same 6-digit OTP used in the verify step. |
| `newPassword` | string | ✅ Required | The new password. Minimum 8 characters recommended. |
| `resetToken` | string | ✅ Required | The temporary token returned by `/auth/verify-otp`. |

**Example Request**

```json
{
  "email": "alex@example.com",
  "otp": "847291",
  "newPassword": "mySuperSecret#99",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

---

## 👤 User Management

Profile operations, Firebase authentication, user search, and the follow/unfollow social graph.

---

### Firebase Authentication

```
POST /user/auth/firebase
```

Authenticates a user via Firebase (e.g., Google OAuth). Exchange the Firebase `idToken` from the client SDK for a Frameverse JWT and user object.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `idToken` | string | ✅ Required | Firebase client SDK token. |

**Example Request**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI..."
}
```

**Example Response `200`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "_id": "64f3c2a1b1e4d5f6a7890123",
    "username": "alex_dev",
    "email": "alex@example.com",
    "profilePic": "https://res.cloudinary.com/..."
  }
}
```

---

### Get Current User

```
GET /user/auth/me
```
🔒 **Auth required**

Returns the full profile object of the currently authenticated user, derived from the JWT in the request header.

---

### Get Own Profile

```
GET /user/profile
```
🔒 **Auth required**

Retrieves the current user's profile, including follower/following counts, bio, and profile picture.

---

### Get a User's Profile

```
GET /user/profile/:id
```
🔒 **Auth required**

Retrieves the public profile of any user by their MongoDB ObjectId.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | The MongoDB ObjectId of the target user. |

---

### Update Profile

```
PUT /user/updateProfile
```
🔒 **Auth required**

Updates the authenticated user's profile. Supports `multipart/form-data` for uploading a new profile picture, or JSON for text fields.

**Request Body** *(all fields optional)*

| Field | Type | Description |
|---|---|---|
| `username` | string | New display name. |
| `bio` | string | Short profile description. |
| `profilePic` | file | New profile image (multipart upload). |

---

### Search Users

```
GET /user/search?q=...
```
🔒 **Auth required**

Returns a list of users whose usernames match the search query.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ Required | Username substring to search for. |

---

### Get Personalized Feed

```
GET /user/feed
```
🔒 **Auth required**

Returns a paginated, personalized feed of posts from users the current user follows, ordered by recency.

---

### List Following

```
GET /user/following
```
🔒 **Auth required**

Returns an array of user objects that the current user is following.

---

### List Followers

```
GET /user/followers
```
🔒 **Auth required**

Returns an array of user objects that are currently following the authenticated user.

---

### Follow a User

```
POST /user/follow/:id
```
🔒 **Auth required**

Adds the target user to the current user's following list. Also triggers a notification for the followed user.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | ObjectId of the user to follow. |

---

### Unfollow a User

```
POST /user/unfollow/:id
```
🔒 **Auth required**

Removes the target user from the current user's following list.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | ObjectId of the user to unfollow. |

---

## 📝 Posts

Create, retrieve, update, delete, and interact with developer posts.

---

### Explore Posts

```
GET /post/explore
```
🔒 **Auth required**

Returns a curated list of trending and recently-created posts from across the platform, not limited to followed users.

---

### Get a Single Post

```
GET /post/:postId
```
🔒 **Auth required**

Retrieves the full post object including image URL, description, like count, all comments, and the author's public profile.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `postId` | string | The MongoDB ObjectId of the post. |

**Example Response `200`**

```json
{
  "_id": "64f3c2a1b1e4d5f6a7890abc",
  "user": { "_id": "...", "username": "alex_dev" },
  "image": "https://res.cloudinary.com/...",
  "description": "Just solved my 200th LeetCode problem 🎉",
  "location": "Bangalore, India",
  "likes": ["userId1", "userId2"],
  "comments": [],
  "postType": "leetcode",
  "createdAt": "2024-09-01T10:22:00.000Z"
}
```

---

### Create a Post

```
POST /post/create
```
🔒 **Auth required**

Creates a new post. Accepts `multipart/form-data` to support optional image uploads alongside text fields.

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `description` | string | ✅ Required | Post body text (caption). |
| `image` | file | Optional | Image to attach (multipart upload). |
| `location` | string | Optional | Location tag (e.g., `"San Francisco"`). |
| `postType` | string | Optional | One of `manual`, `github`, `leetcode`. Defaults to `manual`. |

---

### Update a Post

```
PUT /post/:postId
```
🔒 **Auth required**

Updates the description or location of an existing post. Only the original post author can perform this action; returns `403 Forbidden` otherwise.

---

### Delete a Post

```
DELETE /post/:postId
```
🔒 **Auth required**

Permanently deletes a post and its associated Cloudinary image. Restricted to the post owner; returns `403 Forbidden` for other users.

---

### Like or Unlike a Post

```
POST /post/:postId/like
```
🔒 **Auth required**

Toggles the like status on a post. If the user has already liked it, the like is removed. Otherwise, the like is added and a notification is sent to the post author.

---

### Share a Post

```
POST /post/:postId/share
```
🔒 **Auth required**

Records a share event for the given post. Increments the share count and may create a reshared post in the sharer's feed depending on configuration.

---

### Add a Comment

```
POST /post/:postId/comment
```
🔒 **Auth required**

Appends a comment to the specified post. Triggers a notification to the post author.

**Example Request**

```json
{
  "text": "Great work! What approach did you use?"
}
```

---

## 💬 Messaging & Chats

Manage conversations, send messages, and retrieve shared media in real-time chats.

---

### List All Conversations

```
GET /chats
```
🔒 **Auth required**

Returns all active 1-on-1 and group chats for the current user, sorted by most recent activity. Includes the `lastMessage` preview and participant summaries.

---

### Start a 1-on-1 Chat

```
POST /chats
```
🔒 **Auth required**

Creates a new direct message conversation between two users. If a chat already exists between them, the existing chat is returned instead of creating a duplicate.

**Example Request**

```json
{
  "userId": "64f3c2a1b1e4d5f6a7890999"
}
```

---

### Create a Group Chat

```
POST /chats/group
```
🔒 **Auth required**

Creates a group conversation with a name and multiple participants.

**Example Request**

```json
{
  "name": "Open Source Crew",
  "users": ["userId1", "userId2", "userId3"]
}
```

---

### Get Chat Details

```
GET /chats/:chatId
```
🔒 **Auth required**

Returns full metadata for a specific chat, including all participant profiles and the `lastMessage`.

---

### Get Shared Media

```
GET /chats/:chatId/media
```
🔒 **Auth required**

Returns all images and videos shared within a conversation, useful for a media gallery view inside the chat UI.

---

### Send a Message

```
POST /messages
```
🔒 **Auth required**

Sends a message to an existing chat. Supports plain text and file/image attachments via multipart form data.

**Example Request**

```json
{
  "chatId": "64f3c2a1b1e4d5f6a789cafe",
  "content": "Here's that PR link: https://github.com/..."
}
```

---

### Fetch Message History

```
GET /messages/:chatId
```
🔒 **Auth required**

Returns the full message history for a chat in ascending chronological order. Results are paginated; use query params for older messages.

---

### Mark All Messages as Read

```
PATCH /messages/:chatId/read
```
🔒 **Auth required**

Marks all unread messages in the specified chat as read for the current user. Triggers an update to the unread notification counter.

---

### Delete a Message

```
DELETE /messages/:messageId
```
🔒 **Auth required**

Deletes a specific message by its ID. Only the message sender may delete their own messages.

---

## 🔔 Notifications

Retrieve, manage, and count in-app notifications for user interactions.

---

### Get All Notifications

```
GET /notifications
```
🔒 **Auth required**

Returns a paginated list of notifications for the current user (likes, comments, follows, and mentions), sorted by most recent first.

---

### Mark All Notifications as Read

```
PATCH /notifications/read
```
🔒 **Auth required**

Marks all unread notifications as read, setting `read: true` on each. Resets the unread badge counter to zero.

---

### Get Unread Count

```
GET /unread-count
```
🔒 **Auth required**

Returns the number of unread notifications. Use this to efficiently power a notification badge without fetching full notification objects.

**Example Response `200`**

```json
{
  "unreadCount": 7
}
```

---

## 🤖 Auto-Post

Automatically share GitHub commits and LeetCode solutions as Frameverse posts.

---

### Get Auto-Post Settings

```
GET /api/autopost/settings
```
🔒 **Auth required**

Retrieves the current auto-post configuration for the authenticated user, including which platforms are enabled and the scheduled posting time.

**Example Response `200`**

```json
{
  "enabled": true,
  "platforms": ["github", "leetcode"],
  "postTime": "20:00"
}
```

---

### Update Auto-Post Settings

```
PUT /api/autopost/settings
```
🔒 **Auth required**

Updates the user's auto-post preferences. Use this to toggle platforms on/off or change the daily posting time.

**Example Request**

```json
{
  "enabled": true,
  "platforms": ["github"],
  "postTime": "21:30"
}
```

---

### Preview Today's Activity

```
GET /api/autopost/stats/today
```
🔒 **Auth required**

Returns a preview of today's GitHub commits and LeetCode problems solved, showing what would be included in the next auto-post.

**Example Response `200`**

```json
{
  "github": {
    "commits": 4,
    "repos": ["frameverse", "algo-practice"]
  },
  "leetcode": {
    "solved": 2,
    "problems": ["Two Sum", "Valid Parentheses"]
  }
}
```

---

### Manually Trigger Auto-Post

```
POST /api/autopost/run
```
🔒 **Auth required**

Bypasses the scheduled timer and immediately generates and publishes an auto-post based on today's activity. Useful for testing your integration or sharing on demand.

---

## 📞 Calls

Access call signaling history and missed call counts per user.

---

### Get Recent Call Log

```
GET /api/calls/history/:userId
```
🔒 **Auth required**

Returns the call history for the specified user, capped at the 50 most recent entries. Each entry includes caller, receiver, duration, and outcome.

> ℹ️ Results are limited to the last 50 calls. Pagination support is planned for a future release.

---

### Get Missed Call Count

```
GET /api/calls/missed/:userId
```
🔒 **Auth required**

Returns the total number of missed (unanswered) calls for the specified user. Use this to power a missed-call badge in the UI.

**Example Response `200`**

```json
{
  "missedCalls": 3
}
```

---

## 📊 Analytics

Engagement metrics for individual users and system-wide admin insights.

---

### Full User Dashboard Data

```
GET /api/user/analytics/dashboard
```
🔒 **Auth required**

Returns a complete analytics dataset for the current user's dashboard: post performance, follower growth, total likes and comments received over time.

---

### Detailed Engagement Metrics

```
GET /api/user/analytics/engagement
```
🔒 **Auth required**

Returns granular engagement data including like rate, comment rate, and share rate per post. Useful for identifying high-performing content.

---

### Activity Heatmap Data

```
GET /api/user/analytics/active-hours
```
🔒 **Auth required**

Returns hourly activity counts across the past 7 days, formatted for rendering a GitHub-style contribution heatmap.

**Example Response `200`**

```json
{
  "heatmap": [
    { "day": "Mon", "hour": 14, "count": 42 },
    { "day": "Mon", "hour": 15, "count": 67 }
  ]
}
```

---

### Platform KPI Summary *(Admin)*

```
GET /api/admin/analytics/overview
```
🔒 **Admin only**

Returns system-wide KPIs: total users, daily active users (DAU), post volume, and engagement rates. Restricted to users with the `admin` role.

---

### Server & Database Health *(Admin)*

```
GET /api/admin/analytics/system-health
```
🔒 **Admin only**

Returns real-time performance metrics including API response times, MongoDB connection pool status, and memory/CPU usage for the backend server.

---

### Force Stats Synchronization *(Admin)*

```
POST /api/admin/sync-stats
```
🔒 **Admin only**

Forces an immediate recalculation and synchronization of denormalized follower/following counts across all user documents. Use after a data migration or inconsistency is detected.

> ⚠️ This is a heavy operation on large datasets. Avoid triggering it during peak traffic hours.

---

*Frameverse API — v1.0*
