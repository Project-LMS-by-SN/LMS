const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Ensure Atlas mongodb+srv SRV records resolve reliably on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  // Ignore if custom dns servers cannot be set
}

let isConnected = false;

const getMongoUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith("mongodb://") || process.env.DATABASE_URL.startsWith("mongodb+srv://"))) {
    return process.env.DATABASE_URL;
  }
  // Default fallback local MongoDB URI
  return "mongodb://localhost:27017/library_management_db";
};

let connectingPromise = null;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  if (connectingPromise) {
    return connectingPromise;
  }

  const uri = getMongoUri();

  connectingPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log(`🍃 MongoDB connected successfully: ${mongoose.connection.host || "localhost"}/${mongoose.connection.name || "db"}`);
    } catch (error) {
      isConnected = false;
      console.error(`⚠️ MongoDB connection warning: ${error.message}`);
      console.error(`👉 Please ensure MONGODB_URI in backend/.env points to your MongoDB Atlas cluster or running MongoDB instance.`);
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ MongoDB runtime error:", err.message);
});

module.exports = { connectDB, getMongoUri };