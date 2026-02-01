import User from "../models/user.js";
import {sendToken} from "../utils/sendToken.js";
import bcrypt from "bcrypt";

export const getUserProfile = async (req, res) => {
    const users = await User.findById(req.userId).populate("avatar");
    res.status(200).json(users);
}

export const registerUser = async (req, res) => {
    const user = new User(req.body);
    await user.save();

    sendToken(user, res, 201, "User created");
    res.status(201).json({ message: "User created" });
}

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    sendToken(user, res, 200, "Login successful");
    res.status(200).json({ message: "Login successful" });
};

export const logoutUser = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
};


export const searchUsers = async (req, res) => {
    const q = String(req.query.q || "");

    if (!q.trim()) return res.json([]);

    const users = await User.find({
        _id: { $ne: req.userId },
        $or: [
            { username: { $regex: "^" + q, $options: "i" } }
        ]
    });
    res.status(200).json(users);
};

export const updateUserProfile = async (req, res) => {
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
};