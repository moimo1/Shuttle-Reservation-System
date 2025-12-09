import Reservation from "../models/Reservation.js";
import Shuttle from "../models/Shuttle.js";
export const createReservation = async (req, res) => {
    try {
        const { shuttleId, destination } = req.body;
        const userId = req.user?.id;
        if (!shuttleId) {
            return res.status(400).json({ message: "Shuttle ID is required" });
        }
        if (!destination) {
            return res.status(400).json({ message: "Destination is required" });
        }
        const shuttle = await Shuttle.findById(shuttleId);
        if (!shuttle) {
            return res.status(404).json({ message: "Shuttle not found" });
        }
        if (shuttle.seatsAvailable <= 0) {
            return res.status(400).json({ message: "No available seats on this shuttle for today" });
        }
        const reservation = new Reservation({
            user: userId,
            shuttle: shuttleId,
            seatNumber: shuttle.seatsAvailable,
            destination: destination,
        });
        await reservation.save();
        await Shuttle.findByIdAndUpdate(shuttleId, { $inc: { seatsAvailable: -1 } });
        res.status(201).json({
            message: "Reservation created successfully",
            reservation,
        });
    }
    catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: "Server error" });
    }
};
export const getUserReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user.id }).populate("shuttle");
        res.json(reservations);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
export const cancelReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const userId = req.user?.id;
        if (!reservationId || !userId) {
            return res.status(400).json({ message: "Reservation ID and user ID are required" });
        }
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        if (reservation.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to cancel this reservation" });
        }
        if (reservation.status === "cancelled") {
            return res.status(400).json({ message: "Reservation is already cancelled" });
        }
        await Shuttle.findByIdAndUpdate(reservation.shuttle, { $inc: { seatsAvailable: 1 } });
        // Update reservation status to cancelled
        reservation.status = "cancelled";
        reservation.cancelledAt = new Date();
        await reservation.save();
        return res.status(200).json({
            message: "Reservation cancelled successfully",
            reservation,
        });
    }
    catch (error) {
        console.error("Error cancelling reservation:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
//# sourceMappingURL=reservationController.js.map