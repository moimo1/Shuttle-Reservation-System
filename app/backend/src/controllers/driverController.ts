import Reservation from "../models/Reservation.js";
import Shuttle from "../models/Shuttle.js";
import Trip from "../models/Trip.js";
import User from "../models/User.js";

export const getShuttleReservations = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get the driver's assigned shuttles
    const driverShuttles = await Shuttle.find({ driver: userId }).select("_id");
    const shuttleIds = driverShuttles.map((s) => s._id);

    if (shuttleIds.length === 0) {
      return res.json([]);
    }

    // Get reservations for the driver's shuttles
    const reservations = await Reservation.find({
      status: "active",
      shuttle: { $in: shuttleIds },
    })
      .populate("user", "name email")
      .populate("shuttle", "name")
      .populate("trip", "departureTime route direction")
      .sort({ seatNumber: 1 });

    const passengers = reservations.map((reservation: any) => {
      const trip = reservation.trip;
      const shuttle = reservation.shuttle;
      return {
        name: reservation.user?.name || "Unknown",
        email: reservation.user?.email || "",
        destination: reservation.destination,
        seatNumber: reservation.seatNumber,
        departureTime: trip?.departureTime || null,
        shuttleName: shuttle?.name || "Shuttle",
      };
    });

    res.json(passengers);
  } catch (err) {
    console.error("Error fetching shuttle reservations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDriverHistory = async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date, destination, minPassengers } = req.query;

    // Get the driver's assigned shuttles
    const driverShuttles = await Shuttle.find({ driver: userId }).select("_id");
    const shuttleIds = driverShuttles.map((s) => s._id);

    if (shuttleIds.length === 0) {
      return res.json([]);
    }

    // Get all reservations (including past ones for history)
    let query: any = { 
      status: "active",
      shuttle: { $in: shuttleIds },
    };

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
      .populate("shuttle", "name")
      .populate("trip", "departureTime route direction")
      .sort({ createdAt: -1, seatNumber: 1 });

    // Group reservations by trip and date
    const tripMap = new Map<string, any>();

    reservations.forEach((reservation: any) => {
      const trip = reservation.trip;
      const shuttle = reservation.shuttle;
      if (!trip || !shuttle) return;

      const reservationDate = new Date(reservation.createdAt);
      const dateKey = reservationDate.toISOString().split("T")[0];
      const tripKey = `${trip._id}-${dateKey}`;

      if (!tripMap.has(tripKey)) {
        tripMap.set(tripKey, {
          id: tripKey,
          date: dateKey,
          time: trip.departureTime || "TBD",
          route: shuttle.name,
          passengerCount: 0,
          passengers: [],
        });
      }

      const tripData = tripMap.get(tripKey);
      tripData.passengerCount++;
      tripData.passengers.push({
        name: reservation.user?.name || "Unknown",
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

