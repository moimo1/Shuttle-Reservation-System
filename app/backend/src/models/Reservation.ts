import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shuttle: { type: mongoose.Schema.Types.ObjectId, ref: "Shuttle", required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  seatNumber: { type: Number, required: true },
  destination: { type: String, required: true },
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

// Ensure a user can only have one active reservation per trip
reservationSchema.index(
  { user: 1, trip: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

export default mongoose.model("Reservation", reservationSchema);
