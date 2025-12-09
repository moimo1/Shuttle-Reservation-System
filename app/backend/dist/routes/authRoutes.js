import express from "express";
import { registerUser, loginUser, updateAvatar, uploadAvatarFile } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
const avatarsDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${unique}${ext || ".jpg"}`);
    },
});
const upload = multer({ storage });
const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/avatar", authMiddleware, updateAvatar);
router.post("/avatar/upload", authMiddleware, upload.single("avatar"), uploadAvatarFile);
export default router;
//# sourceMappingURL=authRoutes.js.map