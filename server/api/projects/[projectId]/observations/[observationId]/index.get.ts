import { safeResponseHandler } from '~/server/utils/safeResponseHandler';

export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(event.context.params?.observationId);
  const observation = await prisma.observation.findUnique({
    where: {
      id: observationId
    },
    select: observationColumns,
  });

  return observation;
});