import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

dotenv.config();

async function dropOldIndex() {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const collection = db.collection("reservations");
    
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map((idx: any) => idx.name));

    try {
      await collection.dropIndex("user_1_shuttle_1_status_1");
      console.log("Successfully dropped old index: user_1_shuttle_1_status_1");
    } catch (err: any) {
      if (err.code === 27 || err.codeName === "IndexNotFound" || err.message?.includes("index not found")) {
        console.log("Old index does not exist (already removed or never created)");
      } else {
        throw err;
      }
    }

    const indexesAfter = await collection.indexes();
    const hasNewIndex = indexesAfter.some((idx: any) => 
      idx.name === "user_1_trip_1_status_1" || 
      (idx.key && idx.key.user === 1 && idx.key.trip === 1 && idx.key.status === 1)
    );
    
    if (hasNewIndex) {
      console.log("New index (user_1_trip_1_status_1) exists");
    } else {
      console.log("Warning: New index not found. It will be created automatically on next model sync.");
    }

    await mongoose.connection.close();
    console.log("Migration complete");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

dropOldIndex();

