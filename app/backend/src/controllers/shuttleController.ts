import Shuttle from "../models/Shuttle.js";
import Reservation from "../models/Reservation.js";

export const getShuttles = async (req: any, res: any) => {
  try {
    const shuttles = await Shuttle.find();
    res.json(shuttles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const reserveShuttle = async (req: any, res: any) => {
  try {
    const shuttle = await Shuttle.findById(req.params.shuttleId);
    if (!shuttle) return res.status(404).json({ message: "Shuttle not found" });
    if (shuttle.seatsAvailable <= 0)
      return res.status(400).json({ message: "No seats available" });

    const reservation = await Reservation.create({
      user: req.user.id,
      shuttle: shuttle._id,
      seatNumber: shuttle.seatsAvailable,
    });

    shuttle.seatsAvailable -= 1;
    await shuttle.save();

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
