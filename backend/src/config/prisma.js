const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

// Resolve the absolute path to dev.db (which is in backend/prisma/dev.db)
const dbPath = path.resolve(__dirname, "../../prisma/dev.db");

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
