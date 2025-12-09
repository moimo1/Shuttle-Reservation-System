import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
export const registerUser = async (req, res) => {
    const { name, email, password, role = "passenger", avatarUrl } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        if (!["driver", "passenger"].includes(role)) {
            return res.status(400).json({ message: "Role must be driver or passenger" });
        }
        const user = await User.create({ name, email, password: hashedPassword, role, avatarUrl });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const updateAvatar = async (req, res) => {
    const { avatarUrl } = req.body;
    try {
        if (!avatarUrl)
            return res.status(400).json({ message: "avatarUrl is required" });
        const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true }).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json({ user });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const uploadAvatarFile = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: "No file uploaded" });
        const relativePath = `/uploads/avatars/${req.file.filename}`;
        const avatarUrl = `${process.env.API_BASE_URL || ""}${relativePath}`;
        const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true }).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json({ user, avatarUrl });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
//# sourceMappingURL=authController.js.map