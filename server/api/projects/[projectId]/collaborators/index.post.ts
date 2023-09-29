
import * as yup from 'yup';
import { PrismaClient, ProjectRole } from '@prisma/client';
import { safeResponseHandler } from '~/server/utils/safeResponseHandler';
import { parseIntParam } from '~/server/utils/request';
import { requireUser } from '~/server/utils/authorize';
import { daysInFuture } from '~/utils/datetime';
import { generateInvitationHash } from '~/server/utils/invitation';

const prisma = new PrismaClient();

const config = useRuntimeConfig();

const AddCollaboratorSchema = yup.object({
  email: yup.string().required(),
}).required();

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user);
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
      statusMessage: 'You do not have the required project permissions to invite collaborators'
    });
  }

  const collaborator = await prisma.user.findFirst({
    where: {
      email: parsed.email,
    },
    select: { id: true }
  });


  // if collaborator is already an existing user,
  // just let them join the project immediatly
  if (collaborator) {
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

    setResponseStatus(event, 202);
    return { success: true };

  // if user does not exist in db, create projectInvitation and return the link
  } else {
    const hash = generateInvitationHash(body.email);

    // check if invitation is already sent to user
    const existing = await prisma.projectInvitation.findFirst({
      where: {
        emailHash: hash,
        projectId: projectId,
        expiresAt: {
          gte: new Date(),
        }
      }
    })

    // if invitation already exists, throw up
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User is already invited to project'
      });
    }

    // create invitation
    await prisma.projectInvitation.create({
      data: {
        projectId,
        inviterId: user.id,
        expiresAt: daysInFuture(7),
        emailHash: hash,
      }
    });

    setResponseStatus(event, 201);

    return {
      success: true,
    };
  }
});