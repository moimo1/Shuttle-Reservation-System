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

