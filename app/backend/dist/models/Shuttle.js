import mongoose from "mongoose";
const shuttleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    departureTime: { type: String, required: true },
    seatsAvailable: { type: Number, required: true, default: 20 },
    destination: { type: String, required: true, default: "" },
});
export default mongoose.model("Shuttle", shuttleSchema);
//# sourceMappingURL=Shuttle.js.map