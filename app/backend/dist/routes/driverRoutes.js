import express from "express";
import { getShuttleReservations, getDriverHistory } from "../controllers/driverController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/reservations", authMiddleware, getShuttleReservations);
router.get("/history", authMiddleware, getDriverHistory);
export default router;
//# sourceMappingURL=driverRoutes.js.map