import Shuttle from "../models/Shuttle.js";
import Reservation from "../models/Reservation.js";
import Notification from "../models/Notification.js";

const TOTAL_SEATS = 20;

export const getShuttles = async (req: any, res: any) => {
  try {
    const shuttles = await Shuttle.find();
    const reservations = await Reservation.find(
      { status: "active" },
      "shuttle seatNumber"
    );

    const takenMap: Record<string, number[]> = {};
    reservations.forEach((r: any) => {
      // Handle both ObjectId and string formats
      const shuttleId = r.shuttle?._id ? r.shuttle._id.toString() : r.shuttle?.toString();
      if (!shuttleId) return;
      
      // Ensure seatNumber is parsed as integer
      const seatNum = typeof r.seatNumber === "number" 
        ? r.seatNumber 
        : parseInt(r.seatNumber, 10);
      
      if (!isNaN(seatNum) && seatNum >= 1 && seatNum <= TOTAL_SEATS) {
        if (!takenMap[shuttleId]) takenMap[shuttleId] = [];
        takenMap[shuttleId].push(seatNum);
      }
    });

    const enriched = shuttles.map((s: any) => {
      const shuttleIdStr = s._id.toString();
      const takenSeats = (takenMap[shuttleIdStr] || []).sort((a, b) => a - b);
      const seatsAvailable = Math.max(0, TOTAL_SEATS - takenSeats.length);
      
      return {
        ...s.toObject(),
        seatsAvailable, // Always calculate from reservations, ignore stored value
        takenSeats,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching shuttles:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const reserveShuttle = async (req: any, res: any) => {
  try {
    const { destination, seatNumber } = req.body;
    if (!destination) return res.status(400).json({ message: "Destination is required" });
    
    // Ensure seatNumber is parsed as an integer
    const parsedSeatNumber = parseInt(seatNumber, 10);
    if (isNaN(parsedSeatNumber) || parsedSeatNumber < 1 || parsedSeatNumber > TOTAL_SEATS)
      return res.status(400).json({ message: "Invalid seat number" });

    const shuttle = await Shuttle.findById(req.params.shuttleId);
    if (!shuttle) return res.status(404).json({ message: "Shuttle not found" });

    console.log(`Reserving seat ${parsedSeatNumber} for shuttle ${req.params.shuttleId}`);

    const existing = await Reservation.findOne({
      shuttle: shuttle._id,
      seatNumber: parsedSeatNumber,
      status: "active",
    });
    if (existing) return res.status(400).json({ message: "Seat already taken" });

    const existingUserReservation = await Reservation.findOne({
      shuttle: shuttle._id,
      user: req.user.id,
      status: "active",
    });
    if (existingUserReservation)
      return res
        .status(400)
        .json({ message: "You already reserved a seat for this shuttle" });

    // Check if user has an active reservation at the same departure time in a different shuttle
    const userActiveReservations = await Reservation.find({
      user: req.user.id,
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

    const reservedCount = await Reservation.countDocuments({
      shuttle: shuttle._id,
      status: "active",
    });
    if (reservedCount >= TOTAL_SEATS)
      return res.status(400).json({ message: "No seats available" });

    const reservation = await Reservation.create({
      user: req.user.id,
      shuttle: shuttle._id,
      seatNumber: parsedSeatNumber,
      destination,
    });

    console.log(`Reservation created: seat ${reservation.seatNumber} for shuttle ${shuttle._id}`);

    // Create confirmation notification
    try {
      const confirmationNotification = new Notification({
        user: req.user.id,
        reservation: reservation._id,
        shuttle: shuttle._id,
        type: "confirmation",
        title: "Reservation Confirmed",
        message: `Your seat ${parsedSeatNumber} has been reserved for ${shuttle.name} departing at ${shuttle.departureTime}`,
        scheduledFor: new Date(),
        isSent: true,
        sentAt: new Date(),
      });
      await confirmationNotification.save();
    } catch (notifError) {
      console.error("Error creating confirmation notification:", notifError);
      // Don't fail the reservation if notification creation fails
    }

    // Don't update shuttle.seatsAvailable - it's calculated from reservations
    // Calculate current availability for response
    const newReservedCount = reservedCount + 1;
    const seatsAvailable = Math.max(0, TOTAL_SEATS - newReservedCount);

    res.json({ 
      reservation: {
        ...reservation.toObject(),
        seatNumber: reservation.seatNumber, // Ensure seatNumber is included
      }, 
      seatsAvailable 
    });
  } catch (err) {
    console.error("Error reserving seat:", err);
    res.status(500).json({ message: "Server error" });
  }
};
