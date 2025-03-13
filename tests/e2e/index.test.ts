import { beforeEach, beforeAll } from 'vitest';
import { setup } from '@nuxt/test-utils';
import { removeStuff } from './helpers';

// TODO: add minio & upload test vars to avoid poisening the prod envs

const dbType = process.env.TEST_DATABASE_TYPE;
let dbUrl = process.env.PG_TEST_DATABASE_URL;
if (dbType === 'mssql') {
  dbUrl = process.env.MSSQL_TEST_DATABASE_URL;
}

if (!dbUrl) {
  throw new Error('Test database URL could not be determined from .env file')
}

await setup({
  env: {
    DATABASE_URL: dbUrl,
    DATABASE_TYPE: dbType,
  },
  logLevel: 0,
});

beforeAll(removeStuff);
beforeEach(removeStuff);

export * from './auth';
export * from './projects';
export * from './projectFields';
export * from './invitations';
export * from './deletion';
export * from './collaborators';
export * from './observations';
export * from './dynamicFields';
export * from './projectExports';
