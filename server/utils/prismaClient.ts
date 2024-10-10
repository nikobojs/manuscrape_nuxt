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
    console.info('> database type: postgres')
    return new PostgresClient({ datasourceUrl: process.env.PG_DATABASE_URL });
  } else {
    console.info('> database type: mssql')
    return new MSSqlClient({ datasourceUrl: process.env.MSSQL_DATABASE_URL });
  }
}

export const db = getdb() as PostgresClient & MSSqlClient;
