import Shuttle from "../models/Shuttle.js";
import Trip from "../models/Trip.js";
import Reservation from "../models/Reservation.js";
import Notification from "../models/Notification.js";

export const getShuttles = async (_req: any, res: any) => {
  try {
    const trips = await Trip.find().populate({
      path: "shuttle",
      select: "name seatsCapacity driver",
      populate: {
        path: "driver",
        select: "name",
      },
    });
    const reservations = await Reservation.find(
      { status: "active" },
      "trip seatNumber"
    );

    const takenMap: Record<string, number[]> = {};
    reservations.forEach((r: any) => {
      const tripId = r.trip?._id ? r.trip._id.toString() : r.trip?.toString();
      if (!tripId) return;

      const seatNum =
        typeof r.seatNumber === "number" ? r.seatNumber : parseInt(r.seatNumber, 10);

      if (!isNaN(seatNum) && seatNum >= 1 && seatNum <= 200) {
        if (!takenMap[tripId]) takenMap[tripId] = [];
        takenMap[tripId].push(seatNum);
      }
    });

    const enriched = trips.map((t: any) => {
      const tripId = t._id.toString();
      const takenSeats = (takenMap[tripId] || []).sort((a, b) => a - b);
      const capacity = t.seatsCapacity || t.shuttle?.seatsCapacity || 20;
      const seatsAvailable = Math.max(0, capacity - takenSeats.length);
      const shuttle = t.shuttle as any;
      const driver = shuttle?.driver;
      const departureTime = t.departureTime;
      
      if (!departureTime) {
        console.warn(`Trip ${tripId} is missing departureTime field`);
      }
      
      return {
        _id: tripId,
        shuttle: shuttle?._id,
        shuttleName: shuttle?.name,
        driverName: driver?.name || null,
        departureTime: departureTime || null,
        destination: t.route || "",
        direction: t.direction || "forward",
        seatsAvailable,
        takenSeats,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching trips:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const reserveShuttle = async (req: any, res: any) => {
  try {
    const { destination, seatNumber } = req.body;
    if (!destination) return res.status(400).json({ message: "Destination is required" });

    const tripId = req.params.shuttleId; // keep route param name for compatibility
    const trip = await Trip.findById(tripId).populate("shuttle", "name seatsCapacity");
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const capacity = trip.seatsCapacity || (trip.shuttle as any)?.seatsCapacity || 20;

    const parsedSeatNumber = parseInt(seatNumber, 10);
    if (isNaN(parsedSeatNumber) || parsedSeatNumber < 1 || parsedSeatNumber > capacity)
      return res.status(400).json({ message: "Invalid seat number" });

    console.log(`Reserving seat ${parsedSeatNumber} for trip ${tripId}`);

    const existing = await Reservation.findOne({
      trip: trip._id,
      seatNumber: parsedSeatNumber,
      status: "active",
    });
    if (existing) return res.status(400).json({ message: "Seat already taken" });

    const existingUserReservation = await Reservation.findOne({
      trip: trip._id,
      user: req.user.id,
      status: "active",
    });
    if (existingUserReservation)
      return res
        .status(400)
        .json({ message: "You already reserved a seat for this trip" });

    const userActiveReservations = await Reservation.find({
      user: req.user.id,
      status: "active",
    }).populate({ path: "trip", select: "departureTime" });

    const conflictingReservation = userActiveReservations.find((resv: any) => {
      const existingTrip = resv.trip;
      if (!existingTrip || !existingTrip.departureTime) return false;
      return existingTrip.departureTime === trip.departureTime;
    });

    if (conflictingReservation) {
      return res.status(400).json({
        message: `You already have a reservation at ${trip.departureTime} on another trip. Please cancel it first or choose a different time.`,
      });
    }

    const reservedCount = await Reservation.countDocuments({
      trip: trip._id,
      status: "active",
    });
    if (reservedCount >= capacity)
      return res.status(400).json({ message: "No seats available" });

    const reservation = await Reservation.create({
      user: req.user.id,
      shuttle: trip.shuttle,
      trip: trip._id,
      seatNumber: parsedSeatNumber,
      destination,
    });

    console.log(`Reservation created: seat ${reservation.seatNumber} for trip ${trip._id}`);

    try {
      const confirmationNotification = new Notification({
        user: req.user.id,
        reservation: reservation._id,
        shuttle: trip.shuttle,
        type: "confirmation",
        title: "Reservation Confirmed",
        message: `Your seat ${parsedSeatNumber} has been reserved for ${trip.departureTime}`,
        scheduledFor: new Date(),
        isSent: true,
        sentAt: new Date(),
      });
      await confirmationNotification.save();
    } catch (notifError) {
      console.error("Error creating confirmation notification:", notifError);
    }

    const seatsAvailable = Math.max(0, capacity - (reservedCount + 1));

    res.json({
      reservation: {
        ...reservation.toObject(),
        seatNumber: reservation.seatNumber,
      },
      seatsAvailable,
    });
  } catch (err) {
    console.error("Error reserving seat:", err);
    res.status(500).json({ message: "Server error" });
  }
};
