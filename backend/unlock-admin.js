const db = require("./src/config/mongoClient");
const authUtil = require('./src/utils/auth');

async function main() {
  const email = "admin@admin.com";
  const user = await db.user.findFirst({
    where: { email }
  });
  if (user) {
    console.log("Found admin user. Current state:", {
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      mustChangePassword: user.mustChangePassword
    });
    
    const newHash = authUtil.hashPassword("123456");
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
        passwordHash: newHash,
        mustChangePassword: false
      }
    });
    console.log("Successfully unlocked admin@admin.com and set password to 123456.");
  } else {
    console.log("admin@admin.com not found in database.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => db.$disconnect());
