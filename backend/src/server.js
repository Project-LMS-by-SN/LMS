require("dotenv").config();

const app = require("./app");
const { seedAdminUser } = require("./controllers/user.controller");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedAdminUser();
});