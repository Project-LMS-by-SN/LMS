const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Set it in backend/.env");
}

// Simple PBKDF2 password hashing (100% pure JS, secure, no native binaries needed)
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const comparePassword = (password, storedHash) => {
  // Support bcrypt hashed passwords just in case (fallback if DB already has them)
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    // If bcrypt is not installed, we can't compare it, but seeding will create pbkdf2 hashes.
    // If we want to be safe, we check if bcryptjs is importable.
    try {
      const bcrypt = require("bcryptjs");
      return bcrypt.compareSync(password, storedHash);
    } catch (e) {
      console.warn("bcryptjs not available, cannot compare bcrypt hash");
      return false;
    }
  }

  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === checkHash;
};

// Base64URL encoders/decoders
const base64UrlEncode = (str) => {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (str) => {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
};

// Pure JS JWT generation
const signToken = (payload, expiresInDays = 7) => {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// Pure JS JWT verification
const verifyToken = (token) => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSignature) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
};

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
};
