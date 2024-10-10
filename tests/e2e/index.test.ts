import { beforeEach } from 'vitest';
import { setup } from '@nuxt/test-utils';
import { db } from './helpers';

// TODO: add minio & upload test vars to avoid poisening the prod envs

await setup({
  env: {
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    DATABASE_TYPE: process.env.TEST_DATABASE_TYPE,
  },
  logLevel: 0,
});

beforeEach(async () => {
  // TODO: extract to seperate function and utilize cascade
  console.log('begin delete all')
  const err = (err: any) => {
    console.error(err);
    throw err;
  };

  await db.projectAccess.deleteMany().catch(err);
  await db.project.deleteMany().catch(err);
  await db.user.deleteMany().catch(err);
  console.log('done delete all')
});

export * from './auth';
export * from './projects';
export * from './projectFields';
export * from './invitations';
export * from './deletion';
export * from './collaborators';
export * from './observations';
export * from './dynamicFields';
export * from './projectExports';