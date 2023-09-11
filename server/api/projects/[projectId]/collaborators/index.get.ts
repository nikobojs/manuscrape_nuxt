import { PrismaClient, ProjectRole } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  const user = requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const allowedRoles: ProjectRole[] = [ProjectRole.OWNER];

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

  const contributors = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      contributors: {
        select: {
          createdAt: true,
          user: {
            select: {
              email: true,
              id: true,
            }
          },
        },
      },
    }
  });

  if (!contributors) {
    throw createError({
      statusCode: 404,
      statusMessage: 'The project does not exist'
    });
  }

  return contributors;
});
