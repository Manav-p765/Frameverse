/**
 * Server Entry Point
 *
 * Bootstraps the Express app, Socket.IO server, database connection,
 * route registration, and background workers. This file is the main
 * entry point for the Frameverse backend.
 */

import dotenv from "dotenv";
dotenv.config();

import "./config/firebaseAdmin.js"
import connectdb from "./config/db.js";
import app from "./config/app.js"
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import initSocket from "./config/socket.js";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import postRoute from "./routes/post.js";
import messageRoute from "./routes/message.js";
import notificationRoute from "./routes/notification.js";
import autoPostRoutes from "./routes/autoPostRoutes.js";
import { startAutoPostWorker } from "./workers/autoPost.worker.js";
import callRoutes from "./routes/callRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import analyticsRoutes from "./routes/admin/analyticsRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import userAnalyticsRoutes from "./routes/userAnalyticsRoutes.js";
import calculateTrendingScores from "./workers/trendingWorker.js";
import commentRoutes from "./routes/comment.routes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import pushRouter from "./routes/push.js";

const Port = process.env.PORT || 8080;
const server = http.createServer(app);

// cors setup

const corsOptions = {
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    "https://frameverse-zeta.vercel.app",
    "https://frameverse.onrender.com",
    "https://frameverse.online",
    "https://www.frameverse.online"
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.set("view engine", "ejs");

import { client, httpRequestsTotal, httpRequestDuration } from "./utils/metrics.js";

// Metrics endpoint for Prometheus to scrape
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    return res.end(await client.register.metrics());
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// Metrics Middleware
app.use((req, res, next) => {
  const endTimer = httpRequestDuration.startTimer();
  res.on("finish", () => {
    // Only capture root path or defined route path so metrics don't explode with dynamic IDs
    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.labels({
      method: req.method,
      route: route,
      status: res.statusCode,
    }).inc();

    endTimer({
      method: req.method,
      route: route,
      status: res.statusCode,
    });
  });
  next();
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL,
      "https://frameverse-zeta.vercel.app",
      "https://frameverse.onrender.com",
      "https://frameverse.online",
      "https://www.frameverse.online"
    ].filter(Boolean),
    methods: ["GET", "POST"],
  },
});


app.set("view engine", "ejs");
app.set("io", io);

// Call handlers are registered inside socket.js (initSocket)
// Do NOT duplicate activeCalls/userCallMap here

connectdb();
initSocket(io);

app.use("/user", userRoute);
app.use("/chats", chatRoute);
app.use("/messages", messageRoute);
app.use("/post", postRoute);
app.use("/notifications", notificationRoute);
app.use("/api/autopost", autoPostRoutes);
app.use("/api/calls", callRoutes);
app.use("/auth", authRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user/analytics", userAnalyticsRoutes);
app.use("/comments", commentRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/push", pushRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    error: message
  });
});

server.listen(Port, () => {
  console.log(`server is listening on port ${Port}`);
  startAutoPostWorker();
});
