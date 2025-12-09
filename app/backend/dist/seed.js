import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Shuttle from "./models/Shuttle.js";
import Reservation from "./models/Reservation.js";
dotenv.config();
async function seed() {
    await connectDB();
    // Clean existing data to make the seed deterministic
    await Promise.all([
        User.deleteMany({}),
        Shuttle.deleteMany({}),
        Reservation.deleteMany({}),
    ]);
    const password = await bcrypt.hash("password123", 10);
    const users = await User.insertMany([
        { name: "Ava Johnson", email: "ava@example.com", password },
        { name: "Liam Chen", email: "liam@example.com", password },
        { name: "Maya Patel", email: "maya@example.com", password },
        { name: "Noah Smith", email: "noah@example.com", password },
    ]);
    const shuttles = await Shuttle.insertMany([
        { name: "Campus Loop", departureTime: "08:00", seatsAvailable: 20 },
        { name: "Airport Express", departureTime: "10:30", seatsAvailable: 15 },
        { name: "City Center", departureTime: "14:00", seatsAvailable: 18 },
    ]);
    await Reservation.insertMany([
        {
            user: users[0]._id,
            shuttle: shuttles[0]._id,
            seatNumber: 1,
            destination: "Main Library",
            status: "active",
        },
        {
            user: users[1]._id,
            shuttle: shuttles[1]._id,
            seatNumber: 2,
            destination: "Airport Terminal 1",
            status: "active",
        },
        {
            user: users[1]._id,
            shuttle: shuttles[2]._id,
            seatNumber: 5,
            destination: "City Hall",
            status: "cancelled",
            cancelledAt: new Date(),
        },
        {
            user: users[2]._id,
            shuttle: shuttles[0]._id,
            seatNumber: 7,
            destination: "Engineering Building",
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
//# sourceMappingURL=seed.js.map