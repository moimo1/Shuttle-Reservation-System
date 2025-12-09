import mongoose from "mongoose";

const shuttleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  baseRoute: { type: String, default: "" },
  seatsCapacity: { type: Number, required: true, default: 20 },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

export default mongoose.model("Shuttle", shuttleSchema);
