import dotenv from "dotenv";
dotenv.config();

import "./config/firebaseAdmin.js";
import connectdb from "./config/db.js";
import app from "./config/app.js";
import http from "http";
import cors from "cors";

// Routes
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import postRoute from "./routes/post.js";
import messageRoute from "./routes/message.js";
import notificationRoute from "./routes/notification.js";
import autoPostRoutes from "./routes/autoPostRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import analyticsRoutes from "./routes/admin/analyticsRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import userAnalyticsRoutes from "./routes/userAnalyticsRoutes.js";
import commentRoutes from "./routes/comment.routes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

// Init Services
import { initSocketEmitter } from "./utils/socketEmitter.js";

const Port = process.env.PORT || 8080;
const server = http.createServer(app);

// CORS setup
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

connectdb();
initSocketEmitter(); // Initialize Redis emitter for decoupling APIs

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("ERROR:", err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    res.status(statusCode).json({ error: message });
});

server.listen(Port, () => {
    console.log(`[API Server] listening on port ${Port}`);
});
