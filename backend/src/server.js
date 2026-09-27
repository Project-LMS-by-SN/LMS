require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");
const { seedAdminUser } = require("./controllers/user.controller");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await connectDB();
    await seedAdminUser();
  } catch (err) {
    console.error("Initialization warning:", err.message);
  }
});