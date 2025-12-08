import express from "express";
import { 
  createReservation, 
  getUserReservations, 
  cancelReservation 
} from "../controllers/reservationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createReservation);
router.get("/my", authMiddleware, getUserReservations);
router.patch("/:reservationId/cancel", authMiddleware, cancelReservation);

export default router;
