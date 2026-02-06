import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import * as dotenv from "dotenv";

let url = process.env.DATABASE_URL;
if (!url) {
  dotenv.config();
  url = process.env.DATABASE_URL;
}

if (process.env.NODE_ENV === "test") {
  url = process.env.TEST_DATABASE_URL;
}
const queryClient = postgres(url as string);
export const db = drizzle({ client: queryClient, schema, connection: { url } });
