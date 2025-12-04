import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shuttle: { type: mongoose.Schema.Types.ObjectId, ref: "Shuttle", required: true },
  seatNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active",
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("Reservation", reservationSchema);
