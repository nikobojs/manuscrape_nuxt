import { afterEach } from 'vitest';
import { setup } from '@nuxt/test-utils';
import { prisma } from './helpers';

await setup();

await afterEach(async () => {
  await prisma.user.deleteMany();
});

export * from './auth';
export * from './projects';
export * from './projectFields';
export * from './invitations';
export * from './deletion';
export * from './collaborators';
export * from './observations';
export * from './dynamicFields';