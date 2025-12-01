import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import shuttleRoutes from "./routes/shuttleRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/shuttles", shuttleRoutes);
app.use("/api/reservations", reservationRoutes);

export default app;