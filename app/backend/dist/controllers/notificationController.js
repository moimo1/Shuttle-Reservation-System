import Notification from "../models/Notification.js";
import Reservation from "../models/Reservation.js";
import User from "../models/User.js";
import { sendPushNotification } from "../utils/pushNotificationService.js";
export const scheduleReminder = async (req, res) => {
    try {
        const { reservationId, hoursBeforeDeparture } = req.body;
        const userId = req.user?.id;
        if (!reservationId || !hoursBeforeDeparture) {
            return res.status(400).json({ message: "Reservation ID and hours before departure are required" });
        }
        // Find reservation and populate shuttle
        const reservation = await Reservation.findById(reservationId).populate("shuttle");
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        if (reservation.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to schedule reminder for this reservation" });
        }
        // Calculate scheduled time
        const shuttle = reservation.shuttle;
        const departureTime = new Date(shuttle.departureTime);
        const scheduledFor = new Date(departureTime.getTime() - hoursBeforeDeparture * 60 * 60 * 1000);
        // Create notification
        const notification = new Notification({
            user: userId,
            reservation: reservationId,
            shuttle: shuttle._id,
            type: "reminder",
            title: "Shuttle Reminder",
            message: `Your shuttle departs in ${hoursBeforeDeparture} hour(s)`,
            scheduledFor: scheduledFor,
        });
        await notification.save();
        res.status(201).json({
            message: "Reminder scheduled successfully",
            notification,
        });
    }
    catch (error) {
        console.error("Error scheduling reminder:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notifications = await Notification.find({ user: userId })
            .populate("shuttle")
            .populate("reservation")
            .sort({ createdAt: -1 });
        res.json(notifications);
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
};
export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.id;
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        if (notification.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to update this notification" });
        }
        notification.isRead = true;
        await notification.save();
        res.json({
            message: "Notification marked as read",
            notification,
        });
    }
    catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};
export const sendScheduledReminders = async (req, res) => {
    try {
        // Find all unsent notifications that are due
        const now = new Date();
        const dueNotifications = await Notification.find({
            scheduledFor: { $lte: now },
            isSent: false,
            type: "reminder",
        })
            .populate("user")
            .populate("shuttle");
        for (const notification of dueNotifications) {
            const user = notification.user;
            const shuttle = notification.shuttle;
            // Send push notification
            await sendPushNotification([user.deviceToken], // Assumes user model has deviceToken field
            notification.title, notification.message, {
                shuttleId: shuttle._id,
                reservationId: notification.reservation,
            });
            // Mark notification as sent
            notification.isSent = true;
            notification.sentAt = now;
            await notification.save();
        }
        res.json({
            message: `${dueNotifications.length} reminders sent successfully`,
            count: dueNotifications.length,
        });
    }
    catch (error) {
        console.error("Error sending scheduled reminders:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
//# sourceMappingURL=notificationController.js.map