import { ProjectRole } from '@prisma-postgres/client';
import { safeResponseHandler } from '~/server/utils/safeResponseHandler';
import { parseIntParam } from '~/server/utils/request';
import { requireUser } from '~/server/utils/authorize';

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER, ProjectRole.INVITED]);
  const user = await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const collaboratorId = parseIntParam(event.context.params?.collaboratorId);

  // TODO: abstract this to server util
  const access = await db.projectAccess.findUnique({
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

  // ensure user has access
  if (!access) throw createError({
    statusCode: 403,
    statusMessage: 'You do not have access to this project'
  });

  // if not owner, only allow deletion of self
  const isOwner = access.role === ProjectRole.OWNER;
  if (!isOwner && collaboratorId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not allowed to disconnect other collaborators from project'
    });
  }

  // get collaborator access
  const collaboratorAccess = await db.projectAccess.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: collaboratorId,
      }
    },
    select: {
      role: true,
    }
  });

  // ensure collaborator marked for deletion is actually connected to project
  if (!collaboratorAccess) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collaborator is not connected to project'
    });
  }

  // remove collaborator access to project
  await db.projectAccess.deleteMany({
    where: { userId: collaboratorId, projectId: projectId },
  })

  return { success: true };
});