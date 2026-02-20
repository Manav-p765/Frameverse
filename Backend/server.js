import dotenv from "dotenv";
dotenv.config();

import connectdb from "./config/db.js";
import app from "./config/app.js"
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import initSocket from "./config/socket.js";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import postRoute from "./routes/post.js";

const Port = process.env.PORT || 8080;
const server = http.createServer(app);

// cors setup
app.use(cors({
    origin: "https://frameverse-zeta.vercel.app",
    methods: ["GET", "POST"],

}))

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: "https://frameverse-zeta.vercel.app",
        methods: ["GET", "POST"],
        credentials: true,
    }
});


app.set("view engine", "ejs");
app.use(cookieParser());
app.set("io", io);

connectdb();
initSocket(io);

app.use("/user", userRoute);

app.use("/chat", chatRoute);

app.use("/post", postRoute);

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
    console.log(`server is listening on port ${Port}`)
});
