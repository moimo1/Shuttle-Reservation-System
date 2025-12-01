import express from "express";
import { getUserReservations } from "../controllers/reservationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", authMiddleware, getUserReservations);

export default router;
