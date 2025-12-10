import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
import { getLocalIP } from "./utils/getLocalIP.js";

dotenv.config();
connectDB();   

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const localIP = getLocalIP();

app.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("=".repeat(50));
  console.log(`📍 Local access:    http://localhost:${PORT}`);
  console.log(`🌐 Network access:  http://${localIP}:${PORT}`);
  console.log("\n💡 For multi-user access:");
  console.log(`   Update frontend config with IP: ${localIP}`);
  console.log(`   File: app/frontend/src/config/api.ts`);
  console.log("=".repeat(50) + "\n");
});