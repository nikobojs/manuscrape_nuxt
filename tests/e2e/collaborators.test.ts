import { afterEach } from 'vitest';
import { setup } from '@nuxt/test-utils';
import { prisma } from './helpers';

await setup();

await afterEach(async () => {
  await prisma.user.deleteMany();
});

export * from './collaborators';