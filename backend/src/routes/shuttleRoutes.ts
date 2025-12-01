import express from "express";
import { getShuttles, reserveShuttle } from "../controllers/shuttleController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getShuttles);
router.post("/reserve/:shuttleId", authMiddleware, reserveShuttle);

export default router;
