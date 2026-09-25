const { defineConfig } = require("prisma/config");
const path = require("path");
require("dotenv/config");

// Resolve the sqlite path relative to this configuration file to be absolute (e.g. backend/prisma/dev.db)
const dbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")
  ? `file:${path.resolve(__dirname, "prisma", process.env.DATABASE_URL.replace("file:", ""))}`
  : process.env.DATABASE_URL;

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbUrl,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
});
