const db = require("./src/config/mongoClient");

async function updateAdminPro() {
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  const adminEmail = "admin@admin.com";
  const updated = await db.user.updateMany({
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
  .finally(() => db.$disconnect());

