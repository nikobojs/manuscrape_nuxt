import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  await ensureURLResourceAccess(event, event.context.user);

  const result = await prisma.observation.create({
    data: {
      userId: user.id,
      projectId: projectId,
      isDraft: true,
      data: {}
    }
  });

  setResponseStatus(event, 201);

  return {
    id: result.id,
    msg: 'observation created!'
  }
})
