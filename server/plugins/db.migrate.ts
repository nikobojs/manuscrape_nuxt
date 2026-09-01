import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default defineNitroPlugin(async () => {
  if (process.env.SKIP_MIGRATIONS === "true") {
    console.log("[migrate] skipped (SKIP_MIGRATIONS=true)");
    return;
  }

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    // Serialize concurrent boots: only one instance migrates at a time,
    // others wait, then see an up-to-date journal and no-op.
    await sql`SELECT pg_advisory_lock(727447)`;
    const db = drizzle(sql);
    await migrate(db, {
      migrationsFolder: "server/drizzle/migrations",
      migrationsTable: "__drizzle_migrations",
    });
    console.info("> migrations ok");
  } finally {
    await sql`SELECT pg_advisory_unlock(727447)`;
    await sql.end();
  }
});
