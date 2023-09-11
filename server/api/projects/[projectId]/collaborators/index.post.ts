
import { PrismaClient, ProjectRole } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';
import * as yup from 'yup';

const prisma = new PrismaClient();

const AddCollaboratorSchema = yup.object({
  email: yup.string().required(),
}).required();

export default safeResponseHandler(async (event) => {
  const body = await readBody(event);
  const user = requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const allowedRoles: ProjectRole[] = [ProjectRole.OWNER];
  let parsed: {email: string} | undefined;

  // validate with yup
  try {
    parsed = await AddCollaboratorSchema.validate(body);
  } catch(e: any) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required body parameters',
    });
  }

  // todo: abstract this to util
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

  const collaborator = await prisma.user.findFirst({
    where: {
      email: parsed.email,
    },
    select: { id: true }
  });

  if (!collaborator) {
    throw createError({
      statusCode: 410,
      statusMessage: 'No user has that email'
    });
  }

  const existing = await prisma.projectAccess.findFirst({
    where: {
      user: { email: parsed.email },
    },
    select: { projectId: true }
  });

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User already has access to project'
    });
  }

  await prisma.projectAccess.create({
    data: {
      projectId,
      userId: collaborator.id,
      role: ProjectRole.INVITED,
    }
  });

  setResponseStatus(event, 201)
  return { success: true };    
});
