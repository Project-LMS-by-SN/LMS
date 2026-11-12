const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const backendEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
const rootEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();

const app = require("./app");
const { connectDB } = require("./config/db");
const { seedAdminUser } = require("./controllers/user.controller");
const { autoSuspendExpiredStudents } = require("./controllers/student.controller");

const PORT = process.env.PORT || 3000;
const LIFECYCLE_SWEEP_MS = 15 * 60 * 1000;

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await connectDB();
    await seedAdminUser();
    await autoSuspendExpiredStudents(undefined, { force: true });
    setInterval(() => {
      autoSuspendExpiredStudents(undefined, { force: true }).catch((err) =>
        console.error("Scheduled lifecycle sweep error:", err.message)
      );
    }, LIFECYCLE_SWEEP_MS).unref();
  } catch (err) {
    console.error("Initialization warning:", err.message);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`👉 Run 'Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force' or change PORT in backend/.env`);
    process.exit(1);
  } else {
    console.error("Server error:", err.message);
  }
});
