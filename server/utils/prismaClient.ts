import { PrismaClient as PostgresClient } from "@prisma-postgres/client";
import { PrismaClient as MSSqlClient } from "@prisma-mssql/client";

let dbType = 'postgres'
if (process.env.DATABASE_TYPE) {
  dbType = process.env.DATABASE_TYPE
} else {
  const config = useRuntimeConfig().app;
  dbType = config.databaseType
}

if (!['postgres', 'mssql'].includes(dbType)) {
  throw new Error(`The database type '${dbType}' is not supported`);
}

export function getdb(): PostgresClient | MSSqlClient {
  if (dbType === 'postgres') {
    console.warn('DATABASE_URL:', process.env.DATABASE_URL);
    return new PostgresClient({ datasources: {db: {url: process.env.DATABASE_URL}}});
  } else {
    return new MSSqlClient();
  }
}

export const db = getdb() as PostgresClient & MSSqlClient;
