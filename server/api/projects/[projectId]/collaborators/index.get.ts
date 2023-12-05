import { ProjectRole } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);
  const user = await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const allowedRoles: ProjectRole[] = [ProjectRole.OWNER];

  // TODO: write test and try deprecase following projectaccess test
  const access = await prisma.projectAccess.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: user.id,
      }
    },
    select: {
      role: true,
    }
  });

  if (!access) throw createError({
    statusCode: 403,
    statusMessage: 'You do not have access to this project'
  });

  if (!allowedRoles.includes(access.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have the required project permissions to see its contributors'
    });
  }

  const collaborators: Collaborator[] = await prisma.projectAccess.findMany({
    where: { projectId },
    select: {
      role: true,
      createdAt: true,
      nameInProject: true,
      user: {
        select: {
          id: true,
          email: true,
        }
      }
    }
  });

  if (!collaborators) {
    throw createError({
      statusCode: 404,
      statusMessage: 'The project does not exist'
    });
  }

  return { collaborators };
});
