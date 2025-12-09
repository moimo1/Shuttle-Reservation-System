import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
dotenv.config();
connectDB();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Accessible at http://localhost:${PORT} or http://192.168.1.2:${PORT}`);
});
//# sourceMappingURL=server.js.map