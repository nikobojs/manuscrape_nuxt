
import Prisma from '@prisma/client'
const { PrismaClient } = Prisma
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../utils/authorize';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const projectId = parseIntParam(event.context.params?.projectId);

  const dynamicFields = await prisma.dynamicProjectField.findMany({
    where: { projectId }
  });

  return { dynamicFields: dynamicFields };
});