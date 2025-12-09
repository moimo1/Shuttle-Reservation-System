import express from "express";
import { registerUser, loginUser, updateAvatar, uploadAvatarImage, } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/avatar", authMiddleware, updateAvatar);
router.post("/avatar/upload", authMiddleware, uploadAvatarImage);
export default router;
//# sourceMappingURL=authRoutes.js.map