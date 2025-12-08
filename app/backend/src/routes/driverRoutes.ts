import express from "express";
import { getShuttleReservations } from "../controllers/driverController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/reservations", authMiddleware, getShuttleReservations);

export default router;

