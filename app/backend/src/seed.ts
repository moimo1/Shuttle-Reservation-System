import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Shuttle from "./models/Shuttle.js";
import Trip from "./models/Trip.js";
import Reservation from "./models/Reservation.js";

dotenv.config();

async function seed() {
  await connectDB();

  // Clean existing data to make the seed deterministic
  await Promise.all([
    User.deleteMany({}),
    Shuttle.deleteMany({}),
    Trip.deleteMany({}),
    Reservation.deleteMany({}),
  ]);

  const password = await bcrypt.hash("password123", 10);

  const users = await User.insertMany([
    { name: "Ava Johnson", email: "ava@example.com", password, role: "passenger" },
    { name: "Liam Chen", email: "liam@example.com", password, role: "driver" },
    { name: "Maya Patel", email: "maya@example.com", password, role: "passenger" },
    { name: "Noah Smith", email: "noah@example.com", password, role: "driver" },
  ]);

  const routeForward = "Maryheights Campus -> Holy Family Parish Church -> BGH -> SSS -> Main Campus";
  const routeReverse = "Main Campus -> SSS -> BGH -> Holy Family Parish Church -> Maryheights Campus";

  // Assign drivers to shuttles (users[1] and users[3] are drivers)
  const shuttles = await Shuttle.insertMany([
    { name: "Shuttle A", baseRoute: routeForward, seatsCapacity: 20, driver: users[1]._id }, // Liam Chen
    { name: "Shuttle B", baseRoute: routeForward, seatsCapacity: 20, driver: users[3]._id }, // Noah Smith
    { name: "Shuttle C", baseRoute: routeForward, seatsCapacity: 20, driver: users[1]._id }, // Liam Chen (can drive multiple)
  ]);

  const trips = await Trip.insertMany([
    // Shuttle A - Forward trips (Morning/Afternoon)
    { shuttle: shuttles[0]._id, departureTime: "06:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "08:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "10:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "11:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "12:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    // Shuttle A - Reverse trips (Afternoon/Evening)
    { shuttle: shuttles[0]._id, departureTime: "13:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "14:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "16:30", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "18:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[0]._id, departureTime: "19:30", route: routeReverse, direction: "reverse", seatsCapacity: 20 },

    // Shuttle B - Forward trips (Morning/Afternoon)
    { shuttle: shuttles[1]._id, departureTime: "06:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "08:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "09:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "11:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "13:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    // Shuttle B - Reverse trips (Afternoon/Evening)
    { shuttle: shuttles[1]._id, departureTime: "14:30", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "15:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "17:30", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "18:30", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[1]._id, departureTime: "20:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },

    // Shuttle C - Forward trips (Morning/Afternoon)
    { shuttle: shuttles[2]._id, departureTime: "07:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "09:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "10:00", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "12:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "15:30", route: routeForward, direction: "forward", seatsCapacity: 20 },
    // Shuttle C - Reverse trips (Afternoon/Evening)
    { shuttle: shuttles[2]._id, departureTime: "16:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "17:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "19:00", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
    { shuttle: shuttles[2]._id, departureTime: "20:30", route: routeReverse, direction: "reverse", seatsCapacity: 20 },
  ]);

  await Reservation.insertMany([
    {
      user: users[0]._id,
      shuttle: shuttles[0]._id,
      trip: trips[0]._id,
      seatNumber: 1,
      destination: "Main Campus",
      status: "active",
    },
    {
      user: users[1]._id,
      shuttle: shuttles[1]._id,
      trip: trips[5]._id,
      seatNumber: 2,
      destination: "BGH",
      status: "active",
    },
    {
      user: users[1]._id,
      shuttle: shuttles[2]._id,
      trip: trips[10]._id,
      seatNumber: 5,
      destination: "Holy Family Parish Church",
      status: "cancelled",
      cancelledAt: new Date(),
    },
    {
      user: users[2]._id,
      shuttle: shuttles[0]._id,
      trip: trips[3]._id,
      seatNumber: 7,
      destination: "SSS",
      status: "active",
    },
  ]);

  console.log("✅ Seed complete. Created users, shuttles, reservations.");
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  mongoose.connection.close().finally(() => process.exit(1));
});
