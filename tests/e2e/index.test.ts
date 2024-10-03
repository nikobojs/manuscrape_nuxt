import { beforeEach } from 'vitest';
import { setup } from '@nuxt/test-utils';
import { db } from './helpers';

// TODO: add minio & upload test vars to avoid poisening the prod envs

await setup({
  env: {
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    DATABASE_TYPE: process.env.TEST_DATABASE_TYPE,
  },
  logLevel: 0, // experimental, not documented?
});

beforeEach(async () => {
  // TODO: extract to seperate function and utilize cascade
  await db.observation.deleteMany({ where: {} });
  await db.projectInvitation.deleteMany({ where: {} });
  await db.dynamicProjectField.deleteMany({ where: {} });
  await db.projectField.deleteMany({ where: {} });
  await db.projectExport.deleteMany({ where: {} });
  await db.projectAccess.deleteMany({ where: {} });
  await db.imageUpload.deleteMany({ where: {} });
  await db.fileUpload.deleteMany({ where: {} });
  await db.project.deleteMany({ where: {} });
  await db.user.deleteMany({
    where: {}
  });
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