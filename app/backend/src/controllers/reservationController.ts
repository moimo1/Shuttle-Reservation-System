import Reservation from "../models/Reservation.js";
import Shuttle from "../models/Shuttle.js";

export const getUserReservations = async (req: any, res: any) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id }).populate("shuttle");
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelReservation = async (req: any, res: any) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;

    if (!reservationId || !userId) {
      return res.status(400).json({ message: "Reservation ID and user ID are required" });
    }

    // Find the reservation
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Verify the reservation belongs to the authenticated user
    if (reservation.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to cancel this reservation" });
    }

    // Check if reservation is already cancelled
    if (reservation.status === "cancelled") {
      return res.status(400).json({ message: "Reservation is already cancelled" });
    }

    // Update shuttle to increment available seats
    await Shuttle.findByIdAndUpdate(
      reservation.shuttle,
      { $inc: { availableSeats: 1 } }
    );

    // Update reservation status to cancelled
    reservation.status = "cancelled";
    reservation.cancelledAt = new Date();
    await reservation.save();

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


