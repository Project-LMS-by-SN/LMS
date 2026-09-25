const prisma = require("./src/config/prisma");
const authUtil = require("./src/utils/auth");

async function main() {
  const hash = authUtil.hashPassword("Password123!");
  await prisma.user.update({
    where: { email: "admin@admin.com" },
    data: { passwordHash: hash }
  });
  console.log("Password reset successfully.");
}

main().finally(() => prisma.$disconnect());
