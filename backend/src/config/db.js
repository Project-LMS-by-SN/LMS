const path = require("path");
const fs = require("fs");
const dns = require("dns");
const dotenv = require("dotenv");

// Ensure .env is loaded whether running from project root or backend directory
const backendEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
const rootEnvPath = path.resolve(__dirname, "../../../.env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();

const mongoose = require("mongoose");

// Ensure Atlas mongodb+srv SRV records resolve reliably on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  // Ignore if custom dns servers cannot be set
}

let isConnected = false;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "CRITICAL: MONGODB_URI is not set in environment variables. Please configure MONGODB_URI in backend/.env with your MongoDB Atlas connection string."
    );
  }
  if (uri.includes("localhost") || uri.includes("127.0.0.1")) {
    console.warn("⚠️ Warning: MONGODB_URI points to a local address. Online MongoDB Atlas should be used.");
  }
  return uri;
};

let connectingPromise = null;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }
  if (connectingPromise) {
    return connectingPromise;
  }

  const uri = getMongoUri();

  connectingPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
        minPoolSize: 1,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log(`🍃 MongoDB Atlas connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return mongoose.connection;
    } catch (error) {
      isConnected = false;
      console.error(`❌ MongoDB Atlas connection error: ${error.message}`);
      console.error(`👉 Please verify MONGODB_URI in backend/.env points to your active MongoDB Atlas cluster.`);
      throw error;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
};

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("⚠️ MongoDB Atlas disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ MongoDB Atlas runtime error:", err.message);
});

module.exports = { connectDB, getMongoUri };
