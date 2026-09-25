const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "./prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function updateAllAdminsExpiry() {
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  // Update admin100@admin.com
  await prisma.user.updateMany({
    where: { email: "admin100@admin.com" },
    data: {
      subscriptionTier: "PRO_100",
      subscriptionExpiry: expiryDate,
    },
  });

  // Update admin200@admin.com
  await prisma.user.updateMany({
    where: { email: "admin200@admin.com" },
    data: {
      subscriptionTier: "PRO_200",
      subscriptionExpiry: expiryDate,
    },
  });

  // Update any other OWNER user who has a tier set but no expiry date
  const ownersWithoutExpiry = await prisma.user.findMany({
    where: {
      role: "OWNER",
      subscriptionExpiry: null,
    },
  });

  for (const owner of ownersWithoutExpiry) {
    const tier = owner.subscriptionTier === "FREE" ? "PRO_200" : owner.subscriptionTier;
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        subscriptionTier: tier,
        subscriptionExpiry: expiryDate,
      },
    });
    console.log(`Updated owner ${owner.email} with tier ${tier} and 3-month expiry.`);
  }

  console.log("All branch admin accounts updated with 3-month subscription expiry!");
}

updateAllAdminsExpiry()
  .catch((e) => console.error("Error updating all admins:", e))
  .finally(() => prisma.$disconnect());
