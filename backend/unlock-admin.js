const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authUtil = require('./src/utils/auth');

async function main() {
  const email = "admin@admin.com";
  const user = await prisma.user.findFirst({
    where: { email }
  });
  if (user) {
    console.log("Found admin user. Current state:", {
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      mustChangePassword: user.mustChangePassword
    });
    
    const newHash = authUtil.hashPassword("123456");
    await prisma.user.update({
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
  .finally(() => prisma.$disconnect());
