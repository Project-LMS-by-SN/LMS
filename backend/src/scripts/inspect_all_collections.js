const path = require("path");
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");

async function inspectAll() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error("No MONGODB_URI found!");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas (single connection, maxPoolSize: 1)...");
  // Limit pool size to 1 to respect Atlas free tier
  await mongoose.connect(uri, {
    maxPoolSize: 1,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections.\n`);

  const summary = {};

  for (const colInfo of collections) {
    const colName = colInfo.name;
    const col = db.collection(colName);
    const count = await col.countDocuments();
    const samples = await col.find({}).limit(3).toArray();
    summary[colName] = {
      count,
      samples,
    };
    console.log(`--- Collection: [${colName}] (Total: ${count} docs) ---`);
    if (samples.length > 0) {
      console.log(`Sample (first doc):`, JSON.stringify(samples[0], null, 2));
    } else {
      console.log(`(Empty collection)`);
    }
    console.log("\n");
  }

  await mongoose.disconnect();
  console.log("Finished inspecting all collections.");
}

inspectAll().catch((err) => {
  console.error("Inspection failed:", err);
  process.exit(1);
});
