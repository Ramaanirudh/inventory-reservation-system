import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npm run seed",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // @ts-ignore - Prisma 7 CLI supports directUrl, but it is not fully typed in all config environments yet
    directUrl: process.env["DATABASE_URL_UNPOOLED"],
  },
});
