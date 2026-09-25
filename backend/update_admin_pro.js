const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "./prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function updateAdminPro() {
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  const adminEmail = "admin@admin.com";
  const updated = await prisma.user.updateMany({
    where: { email: adminEmail },
    data: {
      subscriptionTier: "PRO_200",
      subscriptionExpiry: expiryDate,
    },
  });

  console.log(`Updated ${updated.count} user(s) for email ${adminEmail} to PRO_200 expiring on ${expiryDate.toISOString()}`);
}

updateAdminPro()
  .catch((e) => console.error("Error updating admin pro:", e))
  .finally(() => prisma.$disconnect());
