const crypto = require("crypto");
const mongoClient = require("../config/mongoClient");

/**
 * Generates a cryptographically random, unpredictable token.
 * @param {string} prefix 'adm' or 'att'
 * @returns {string} e.g. 'adm_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c'
 */
const generateSecureToken = (prefix = "tok") => {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
};

/**
 * Ensures all branches in the database have cryptographically secure
 * admission and attendance tokens. Runs automatically on startup.
 */
const ensureAllBranchesHaveTokens = async (txDb) => {
  const db = txDb || mongoClient;
  try {
    const branches = await db.branch.findMany({
      orderBy: { id: "asc" },
    });

    for (const branch of branches) {
      let needsUpdate = false;
      const dataToUpdate = {};

      if (!branch.admissionToken || !branch.admissionToken.startsWith("adm_")) {
        // Generate unique token
        let token = generateSecureToken("adm");
        // Ensure uniqueness
        while (await db.branch.findFirst({ where: { admissionToken: token, id: { not: branch.id } } })) {
          token = generateSecureToken("adm");
        }
        dataToUpdate.admissionToken = token;
        needsUpdate = true;
      }

      if (!branch.attendanceToken || !branch.attendanceToken.startsWith("att_")) {
        let token = generateSecureToken("att");
        while (await db.branch.findFirst({ where: { attendanceToken: token, id: { not: branch.id } } })) {
          token = generateSecureToken("att");
        }
        dataToUpdate.attendanceToken = token;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db.branch.update({
          where: { id: branch.id },
          data: dataToUpdate,
        });
        console.log(`[BranchTokens] Configured secure QR tokens for Branch ${branch.id} (${branch.name})`);
      }
    }
  } catch (error) {
    console.error("[BranchTokens] Error ensuring branch tokens:", error.message);
  }
};

module.exports = {
  generateSecureToken,
  ensureAllBranchesHaveTokens,
};
