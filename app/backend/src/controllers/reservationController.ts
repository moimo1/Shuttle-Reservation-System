import Reservation from "../models/Reservation.js";
import Shuttle from "../models/Shuttle.js";
import Notification from "../models/Notification.js";

export const createReservation = async (req: any, res: any) => {
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

    // Check if user already has a reservation for this shuttle
    const existingUserReservation = await Reservation.findOne({
      shuttle: shuttleId,
      user: userId,
      status: "active",
    });
    if (existingUserReservation) {
      return res.status(400).json({ message: "You already reserved a seat for this shuttle" });
    }

    // Check if user has an active reservation at the same departure time in a different shuttle
    const userActiveReservations = await Reservation.find({
      user: userId,
      status: "active",
    }).populate("shuttle", "departureTime name");

    const conflictingReservation = userActiveReservations.find((res: any) => {
      const existingShuttle = res.shuttle;
      if (!existingShuttle || !existingShuttle.departureTime) return false;
      // Compare departure times - they should match exactly
      return existingShuttle.departureTime === shuttle.departureTime;
    });

    if (conflictingReservation) {
      const conflictingShuttle = (conflictingReservation as any).shuttle;
      return res.status(400).json({ 
        message: `You already have a reservation at ${shuttle.departureTime} for ${conflictingShuttle?.name || "another shuttle"}. Please cancel it first or choose a different time.` 
      });
    }

    const reservation = new Reservation({
      user: userId,
      shuttle: shuttleId,
      seatNumber: shuttle.seatsAvailable,
      destination: destination,
    });
    await reservation.save();

    await Shuttle.findByIdAndUpdate(shuttleId, { $inc: { seatsAvailable: -1 } });

    // Create confirmation notification
    try {
      const confirmationNotification = new Notification({
        user: userId,
        reservation: reservation._id,
        shuttle: shuttleId,
        type: "confirmation",
        title: "Reservation Confirmed",
        message: `Your seat ${reservation.seatNumber} has been reserved for ${shuttle.name} departing at ${shuttle.departureTime}`,
        scheduledFor: new Date(),
        isSent: true,
        sentAt: new Date(),
      });
      await confirmationNotification.save();
    } catch (notifError) {
      console.error("Error creating confirmation notification:", notifError);
      // Don't fail the reservation if notification creation fails
    }

    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

    await Shuttle.findByIdAndUpdate(
      reservation.shuttle,
      { $inc: { seatsAvailable: 1 } }
    );

    // Populate shuttle for notification
    await reservation.populate("shuttle");

    // Update reservation status to cancelled
    reservation.status = "cancelled";
    reservation.cancelledAt = new Date();
    await reservation.save();

    // Create cancellation notification
    try {
      const shuttle = reservation.shuttle as any;
      const cancellationNotification = new Notification({
        user: userId,
        reservation: reservation._id,
        shuttle: reservation.shuttle,
        type: "cancellation",
        title: "Reservation Cancelled",
        message: `Your reservation for ${shuttle?.name || "shuttle"} departing at ${shuttle?.departureTime || "TBD"} has been cancelled`,
        scheduledFor: new Date(),
        isSent: true,
        sentAt: new Date(),
      });
      await cancellationNotification.save();
    } catch (notifError) {
      console.error("Error creating cancellation notification:", notifError);
      // Don't fail the cancellation if notification creation fails
    }

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
