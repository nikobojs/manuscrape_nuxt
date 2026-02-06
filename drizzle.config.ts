import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/drizzle/schema.ts",
  out: "./server/drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
