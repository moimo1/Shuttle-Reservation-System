import Reservation from "../models/Reservation.js";
import Shuttle from "../models/Shuttle.js";
import Trip from "../models/Trip.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const createReservation = async (req: any, res: any) => {
  try {
    const { tripId, destination, seatNumber } = req.body;
    const userId = req.user?.id;

    if (!tripId) {
      return res.status(400).json({ message: "Trip ID is required" });
    }

    if (!destination) {
      return res.status(400).json({ message: "Destination is required" });
    }

    const trip = await Trip.findById(tripId).populate({
      path: "shuttle",
      select: "name seatsCapacity driver",
      populate: {
        path: "driver",
        select: "name email",
      },
    });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const capacity = trip.seatsCapacity || (trip.shuttle as any)?.seatsCapacity || 20;
    const parsedSeatNumber = seatNumber ? parseInt(seatNumber, 10) : undefined;
    const seatToUse = !isNaN(parsedSeatNumber as any) ? parsedSeatNumber : undefined;

    const existingUserReservation = await Reservation.findOne({
      trip: tripId,
      user: userId,
      status: "active",
    });
    if (existingUserReservation) {
      return res.status(400).json({ message: "You already reserved a seat for this trip" });
    }

    const userActiveReservations = await Reservation.find({
      user: userId,
      status: "active",
    }).populate({ path: "trip", select: "departureTime" });

    const conflictingReservation = userActiveReservations.find((resv: any) => {
      const existingTrip = resv.trip;
      if (!existingTrip || !existingTrip.departureTime) return false;
      return existingTrip.departureTime === trip.departureTime;
    });

    if (conflictingReservation) {
      return res.status(400).json({ 
        message: `You already have a reservation at ${trip.departureTime} on another trip. Please cancel it first or choose a different time.` 
      });
    }

    let seatNumberToAssign = seatToUse;
    const taken = await Reservation.find({ trip: tripId, status: "active" }).select("seatNumber");
    const takenSet = new Set(taken.map((t) => t.seatNumber));
    if (seatNumberToAssign) {
      if (seatNumberToAssign < 1 || seatNumberToAssign > capacity || takenSet.has(seatNumberToAssign)) {
        return res.status(400).json({ message: "Seat already taken or invalid" });
      }
    } else {
      for (let i = 1; i <= capacity; i++) {
        if (!takenSet.has(i)) {
          seatNumberToAssign = i;
          break;
        }
      }
      if (!seatNumberToAssign) {
        return res.status(400).json({ message: "No seats available" });
      }
    }

    const reservation = new Reservation({
      user: userId,
      shuttle: trip.shuttle,
      trip: tripId,
      seatNumber: seatNumberToAssign,
      destination: destination,
    });
    await reservation.save();

    try {
      const confirmationNotification = new Notification({
        user: userId,
        reservation: reservation._id,
        shuttle: trip.shuttle,
        type: "confirmation",
        title: "Reservation Confirmed",
        message: `Your seat ${reservation.seatNumber} has been reserved for ${trip.departureTime}`,
        scheduledFor: new Date(),
        isSent: true,
        sentAt: new Date(),
      });
      await confirmationNotification.save();
    } catch (notifError) {
      console.error("Error creating confirmation notification:", notifError);
    }

    try {
      const shuttle = trip.shuttle as any;
      const driver = shuttle?.driver;
      const driverId = driver?._id || driver;
      
      if (driverId) {
        const passenger = await User.findById(userId).select("name");
        const passengerName = passenger?.name || "A passenger";
        const shuttleId = (trip.shuttle as any)?._id || trip.shuttle;
        
        const driverNotification = new Notification({
          user: driverId,
          reservation: reservation._id,
          shuttle: shuttleId,
          type: "confirmation",
          title: "New Booking",
          message: `${passengerName} booked seat ${reservation.seatNumber} for ${trip.departureTime} on ${shuttle?.name || "your shuttle"}`,
          scheduledFor: new Date(),
          isSent: true,
          sentAt: new Date(),
        });
        await driverNotification.save();
        console.log(`Driver notification created for driver ${driverId}`);
      } else {
        console.log(`No driver assigned to shuttle ${shuttle?._id || trip.shuttle}`);
      }
    } catch (driverNotifError) {
      console.error("Error creating driver notification:", driverNotifError);
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
    const reservations = await Reservation.find({ user: req.user.id })
      .populate("shuttle", "name")
      .populate("trip", "departureTime route direction");
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

    await reservation.populate([
      {
        path: "shuttle",
        select: "name driver",
        populate: {
          path: "driver",
          select: "name email",
        },
      },
      "trip",
    ]);

    reservation.status = "cancelled";
    reservation.cancelledAt = new Date();
    await reservation.save();

    try {
      const shuttle = reservation.shuttle as any;
      const cancellationNotification = new Notification({
        user: userId,
        reservation: reservation._id,
        shuttle: reservation.shuttle,
        type: "cancellation",
        title: "Reservation Cancelled",
        message: `Your reservation for ${shuttle?.name || "shuttle"} departing at ${(reservation as any).trip?.departureTime || "TBD"} has been cancelled`,
        scheduledFor: new Date(),
        isSent: true,
        sentAt: new Date(),
      });
      await cancellationNotification.save();
    } catch (notifError) {
      console.error("Error creating cancellation notification:", notifError);
    }

    try {
      const shuttle = reservation.shuttle as any;
      const driver = shuttle?.driver;
      const driverId = driver?._id || driver;
      
      if (driverId) {
        const passenger = await User.findById(userId).select("name");
        const passengerName = passenger?.name || "A passenger";
        const trip = (reservation as any).trip;
        const shuttleId = (reservation.shuttle as any)?._id || reservation.shuttle;
        
        const driverCancellationNotification = new Notification({
          user: driverId,
          reservation: reservation._id,
          shuttle: shuttleId,
          type: "cancellation",
          title: "Booking Cancelled",
          message: `${passengerName} cancelled their reservation for seat ${reservation.seatNumber} on ${shuttle?.name || "your shuttle"} departing at ${trip?.departureTime || "TBD"}`,
          scheduledFor: new Date(),
          isSent: true,
          sentAt: new Date(),
        });
        await driverCancellationNotification.save();
        console.log(`Driver cancellation notification created for driver ${driverId}`);
      } else {
        console.log(`No driver assigned to shuttle ${shuttle?._id || reservation.shuttle}`);
      }
    } catch (driverNotifError) {
      console.error("Error creating driver cancellation notification:", driverNotifError);
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
