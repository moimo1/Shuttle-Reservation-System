import Shuttle from "../models/Shuttle.js";
export const searchShuttles = async (req, res) => {
    try {
        const { departureTime } = req.query;
        if (!departureTime) {
            return res.status(400).json({ message: "Departure time is required" });
        }
        const shuttles = await Shuttle.find({ departureTime: departureTime });
        if (shuttles.length === 0) {
            return res.status(404).json({ message: "No shuttles found for the specified time" });
        }
        res.json(shuttles);
    }
    catch (err) {
        console.error("Error searching shuttles:", err);
        res.status(500).json({ message: "Server error" });
    }
};
//# sourceMappingURL=searchController.js.map