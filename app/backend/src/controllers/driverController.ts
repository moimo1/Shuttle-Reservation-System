import Reservation from "../models/Reservation.js";
import Shuttle from "../models/Shuttle.js";

export const getShuttleReservations = async (req: any, res: any) => {
  try {
    const { shuttleId, departureTime, destination } = req.query;

    let query: any = { status: "active" };

    if (shuttleId) {
      query.shuttle = shuttleId;
    } else if (departureTime) {
      const shuttles = await Shuttle.find({ departureTime });
      const shuttleIds = shuttles.map((s) => s._id);
      query.shuttle = { $in: shuttleIds };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    const reservations = await Reservation.find(query)
      .populate("user", "name email")
      .populate("shuttle", "name departureTime")
      .sort({ seatNumber: 1 });

    const passengers = reservations.map((reservation: any) => ({
      name: reservation.user.name,
      email: reservation.user.email,
      destination: reservation.destination,
      seatNumber: reservation.seatNumber,
      departureTime: reservation.shuttle.departureTime,
      shuttleName: reservation.shuttle.name,
    }));

    res.json(passengers);
  } catch (err) {
    console.error("Error fetching shuttle reservations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDriverHistory = async (req: any, res: any) => {
  try {
    const { date, destination, minPassengers } = req.query;

    // Get all reservations (including past ones for history)
    let query: any = { status: "active" };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    const reservations = await Reservation.find(query)
      .populate("user", "name email")
      .populate("shuttle", "name departureTime")
      .sort({ createdAt: -1, seatNumber: 1 });

    // Group reservations by shuttle and date
    const tripMap = new Map<string, any>();

    reservations.forEach((reservation: any) => {
      const shuttle = reservation.shuttle;
      if (!shuttle) return;

      const reservationDate = new Date(reservation.createdAt);
      const dateKey = reservationDate.toISOString().split("T")[0];
      const tripKey = `${shuttle._id}-${dateKey}`;

      if (!tripMap.has(tripKey)) {
        tripMap.set(tripKey, {
          id: tripKey,
          date: dateKey,
          time: shuttle.departureTime,
          route: shuttle.name,
          passengerCount: 0,
          passengers: [],
        });
      }

      const trip = tripMap.get(tripKey);
      trip.passengerCount++;
      trip.passengers.push({
        name: reservation.user.name,
        destination: reservation.destination,
      });
    });

    let trips = Array.from(tripMap.values());

    // Filter by minPassengers if provided
    if (minPassengers) {
      const min = parseInt(minPassengers, 10);
      if (!isNaN(min)) {
        trips = trips.filter((trip) => trip.passengerCount >= min);
      }
    }

    // Sort by date (newest first)
    trips.sort((a, b) => b.date.localeCompare(a.date));

    res.json(trips);
  } catch (err) {
    console.error("Error fetching driver history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

