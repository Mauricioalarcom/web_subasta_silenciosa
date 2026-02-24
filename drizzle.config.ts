import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load .env so CLI can access DATABASE_URL when run outside the app runtime
dotenv.config({ path: "./.env" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("Missing DATABASE_URL in environment. Set it in .env or export it in your shell.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});