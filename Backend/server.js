import dotenv from "dotenv";
dotenv.config();

import connectdb from "./config/db.js";
import app from "./config/app.js"
import User from "./models/user.js";
import { validateuser, isLoggedIn, isOwner } from "./middleware.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import wrapAsync from "./utils/wrapAsync.js";

const Port = process.env.PORT;

app.set("view engine", "ejs");
app.use(cookieParser());

connectdb();


app.get("/profile",isLoggedIn, wrapAsync(async (req,res) => {
    const users = await User.findById(req.userId).populate("avatar");
    res.status(200).json(users);

}));

app.post("/register",validateuser, wrapAsync(async (req,res) =>{
    const user = new User(req.body);
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

     res.status(201).json({ message: "User created" });
}));

app.post("/login", wrapAsync(async (req,res) =>{
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({ message: "Login successful" })
}));

app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});

app.get("/search", wrapAsync(async(req,res) =>{
    const q = String(req.query.q || "");

    if (!q.trim()) return res.json([]);

    const users = await User.find({
        _id: { $ne: req.userId }, 
        $or: [
            { username: { $regex: "^" + q, $options: "i" } }
        ]
    });
    res.status(200).json(users);
}));

// update info of user
app.put("/updateProfile", isLoggedIn, validateuser, wrapAsync(async(req,res) =>{
    const { username, email, password, age } = req.body;    
    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    user.username = username;
    user.email = email;
    user.password = password;
    user.age = age;
    await user.save();

    res.status(200).json({ message: "Profile updated successfully" });
}));


app.use((err, req, res, next) => {
    console.error("ERROR:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    res.status(statusCode).json({
        error: message
    });
});

app.listen(Port, () =>{
    console.log(`server is listening on port ${Port}`)
});
