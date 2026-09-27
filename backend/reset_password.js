const db = require("./src/config/mongoClient");
const authUtil = require("./src/utils/auth");

async function main() {
  const hash = authUtil.hashPassword("Password123!");
  await db.user.update({
    where: { email: "admin@admin.com" },
    data: { passwordHash: hash }
  });
  console.log("Password reset successfully.");
}

main().finally(() => db.$disconnect());
