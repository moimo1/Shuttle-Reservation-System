import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  shuttle: { type: mongoose.Schema.Types.ObjectId, ref: "Shuttle", required: true },
  departureTime: { type: String, required: true },
  route: { type: String, default: "" },
  direction: { type: String, enum: ["forward", "reverse"], default: "forward" },
  seatsCapacity: { type: Number, default: 20 },
});

export default mongoose.model("Trip", tripSchema);

