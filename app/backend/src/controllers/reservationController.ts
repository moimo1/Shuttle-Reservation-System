import Reservation from "../models/Reservation.js";

export const getUserReservations = async (req: any, res: any) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id }).populate("shuttle");
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
