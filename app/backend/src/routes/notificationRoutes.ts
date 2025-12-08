import express from "express";
import {
  scheduleReminder,
  getUserNotifications,
  markNotificationAsRead,
  sendScheduledReminders,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/reminder", authMiddleware, scheduleReminder);
router.get("/", authMiddleware, getUserNotifications);
router.patch("/:notificationId/read", authMiddleware, markNotificationAsRead);
router.post("/send-scheduled", authMiddleware, sendScheduledReminders);

export default router;

