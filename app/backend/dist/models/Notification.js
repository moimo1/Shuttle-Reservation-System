import { Schema, model } from "mongoose";
const notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reservation: {
        type: Schema.Types.ObjectId,
        ref: "Reservation",
        required: true,
    },
    shuttle: {
        type: Schema.Types.ObjectId,
        ref: "Shuttle",
        required: true,
    },
    type: {
        type: String,
        enum: ["reminder", "confirmation", "cancellation"],
        default: "reminder",
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    scheduledFor: {
        type: Date,
        required: true,
    },
    isSent: {
        type: Boolean,
        default: false,
    },
    sentAt: {
        type: Date,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
export default model("Notification", notificationSchema);
//# sourceMappingURL=Notification.js.map