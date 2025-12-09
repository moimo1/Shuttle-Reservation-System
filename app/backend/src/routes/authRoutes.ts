import express from "express";
import { registerUser, loginUser, updateAvatar } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/avatar", authMiddleware, updateAvatar);

export default router;