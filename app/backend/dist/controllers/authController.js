import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import authMiddleware from "../middleware/authMiddleware.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AVATAR_DIR = path.resolve(__dirname, "../../uploads/avatars");
export const registerUser = async (req, res) => {
    const { name, email, password, role = "passenger" } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        if (!["driver", "passenger"].includes(role)) {
            return res.status(400).json({ message: "Role must be driver or passenger" });
        }
        const user = await User.create({ name, email, password: hashedPassword, role });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
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
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const updateAvatar = async (req, res) => {
    const userId = req.user?._id;
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== "string") {
        return res.status(400).json({ message: "avatarUrl is required" });
    }
    try {
        const updated = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true, runValidators: false }).select("-password");
        if (!updated) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            user: {
                id: updated._id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                avatarUrl: updated.avatarUrl,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const uploadAvatarImage = async (req, res) => {
    const userId = req.user?._id;
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ message: "imageBase64 is required" });
    }
    try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        fs.mkdirSync(AVATAR_DIR, { recursive: true });
        const filename = `${userId}-${Date.now()}.jpg`;
        const filePath = path.join(AVATAR_DIR, filename);
        await fs.promises.writeFile(filePath, buffer);
        const publicUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${filename}`;
        const updated = await User.findByIdAndUpdate(userId, { avatarUrl: publicUrl }, { new: true, runValidators: false }).select("-password");
        if (!updated) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            user: {
                id: updated._id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                avatarUrl: updated.avatarUrl,
            },
        });
    }
    catch (err) {
        console.error("Avatar upload error", err);
        res.status(500).json({ message: "Server error" });
    }
};
//# sourceMappingURL=authController.js.map