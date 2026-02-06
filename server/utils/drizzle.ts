import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~~/server/drizzle/schema";

const url = process.env.DATABASE_URL;
console.log("pg url:", url);
const queryClient = postgres(process.env.DATABASE_URL as string);
export const db = drizzle({ client: queryClient, schema });
