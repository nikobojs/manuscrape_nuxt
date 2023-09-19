import { afterEach } from 'vitest';
import { setup } from '@nuxt/test-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

await setup();

await afterEach(async () => {
  await prisma.user.deleteMany();
});

export * from './auth';
export * from './projects';
export * from './deletion';
