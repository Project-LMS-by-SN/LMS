const prisma = require("../config/prisma");

/**
 * Extracts 2 alphabets from a library name or returns 'LB' as default.
 * E.g.: "Main Branch" -> "MB", "My Library" -> "ML", "Central Library" -> "CL"
 */
const extractTwoAlphabets = (name) => {
  if (!name || typeof name !== "string") return "LB";
  const clean = name.replace(/[^a-zA-Z\s]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1 && words[0].length === 1) {
    return (words[0] + "B").toUpperCase();
  }
  return "LB";
};

/**
 * Extracts 6 digits from phone or generates a 6-digit sequence.
 * E.g. "+91 9876543210" -> "543210" (last 6 digits)
 */
const extractSixDigits = (phone, fallbackNumber = 100001) => {
  if (phone && typeof phone === "string") {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 6) {
      return digits.slice(-6);
    }
  }
  return String(fallbackNumber).padStart(6, "0").slice(-6);
};

/**
 * Generates a guaranteed unique library code:
 * - 2 Alphabets derived from library name (e.g., 'MB' from 'Main Branch')
 * - 6 Digits derived from phone number (e.g. '543210' from '9876543210')
 * Format: 8 characters (e.g., MB543210, ML354862)
 *
 * @param {string} [libraryName]
 * @param {string} [phone]
 * @param {object} [txPrisma]
 * @returns {Promise<string>}
 */
const generateUniqueLibraryCode = async (libraryName, phone, txPrisma) => {
  let db = prisma;
  let name = libraryName;
  let ph = phone;

  // Handle case where first param is db instance
  if (libraryName && typeof libraryName.branch !== "undefined") {
    db = libraryName;
    name = null;
    ph = null;
  } else if (txPrisma) {
    db = txPrisma;
  }

  const alpha = extractTwoAlphabets(name);

  // Find max sequence in case phone is not provided
  const branches = await db.branch.findMany({ select: { id: true, code: true } });
  let maxSeq = 100000;
  for (const b of branches) {
    if (b.code) {
      const match = b.code.match(/^[A-Za-z]{2}(\d{6})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  let digits = extractSixDigits(ph, maxSeq + 1);
  let candidate = `${alpha}${digits}`;

  // If candidate already taken, increment sequence until unique
  let currentNum = parseInt(digits, 10) || (maxSeq + 1);
  while (await db.branch.findFirst({ where: { code: candidate } })) {
    currentNum++;
    digits = String(currentNum).padStart(6, "0").slice(-6);
    candidate = `${alpha}${digits}`;
  }

  return candidate;
};

/**
 * Ensures all branches in the database have a unique code formatted as:
 * 2 Alphabets (from library name) + 6 Digits (from phone number / sequence).
 */
const ensureAllBranchesHaveCode = async (txPrisma) => {
  const db = txPrisma || prisma;
  const branches = await db.branch.findMany({
    orderBy: { id: "asc" }
  });

  for (const branch of branches) {
    // Check if code is already set to 2 alphabets + 6 digits matching this branch
    const alpha = extractTwoAlphabets(branch.name);
    const digits = extractSixDigits(branch.phone, 100000 + branch.id);
    const expectedPrefix = `${alpha}`;

    // If branch code is null or does not start with this branch's initials
    const needsUpdate = !branch.code || !/^[A-Za-z]{2}\d{6}$/.test(branch.code) || !branch.code.startsWith(expectedPrefix);

    if (needsUpdate) {
      let code = `${alpha}${digits}`;
      let currentNum = parseInt(digits, 10) || (100000 + branch.id);

      while (await db.branch.findFirst({ where: { code, id: { not: branch.id } } })) {
        currentNum++;
        const nextDigits = String(currentNum).padStart(6, "0").slice(-6);
        code = `${alpha}${nextDigits}`;
      }

      await db.branch.update({
        where: { id: branch.id },
        data: { code }
      });
      console.log(`[BranchCode] Updated Branch ${branch.id} (${branch.name}) code to ${code} (Name initials + Phone digits)`);
    }
  }
};

module.exports = {
  extractTwoAlphabets,
  extractSixDigits,
  generateUniqueLibraryCode,
  ensureAllBranchesHaveCode,
};
