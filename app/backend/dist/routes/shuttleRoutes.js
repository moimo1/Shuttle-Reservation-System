import express from "express";
import { getShuttles, reserveShuttle } from "../controllers/shuttleController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { searchShuttles } from "../controllers/searchController.js";
const router = express.Router();
router.get("/", getShuttles);
router.get("/search", searchShuttles);
router.post("/reserve/:shuttleId", authMiddleware, reserveShuttle);
export default router;
//# sourceMappingURL=shuttleRoutes.js.map