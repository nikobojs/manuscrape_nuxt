import * as yup from 'yup';

const patchObservationSchema = yup.object({
  isDraft: yup.bool().optional(),
  data: yup.object().optional(),
}).required()


export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);
  await ensureURLResourceAccess(event, event.context.user);

  const body = await readBody(event);
  let patch = await patchObservationSchema.validate(body);
  patch = removeKeysByUndefinedValue(patch);

  // fetch existing observation
  const project = await prisma.project.findUnique({
    select: {
      id: true,
      authorCanDelockObservations: true,
      ownerCanDelockObservations: true,
    },
    where: {
      id: projectId,
    }
  });

  // if it does not exist, then throw up
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project was not found',
    })
  }


  // fetch existing observation
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      isDraft: true,
      projectId: true,
      user: {
        select: {
          id: true
        },
      },
    },
    where: {
      id: observationId,
    }
  });

  // if it does not exist, then throw up
  if (!observation || observation.projectId !== projectId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Observation was not found',
    })
  }

  // find user role
  const access = await prisma.projectAccess.findUnique({
    where: {
      projectId_userId: {
        userId: user.id,
        projectId: project.id,
      }
    },
    select: {
      role: true,
    }
  });
  const role = access?.role;
  if (typeof role !== 'string') {
    // report invalid role
    console.error(`Project access role '${role}' is not valid`);
    return false;
  }


  // find out if user is author of observation
  const isAuthor = observation.user?.id === user.id;
  const isProjectOwner = role === 'OWNER';

  // if patch includes isDraft
  if (Object.keys(patch).includes('isDraft')) {

    // if unpublishing while observation is already unpublished
    if (patch.isDraft && observation.isDraft) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Observation is already delocked',
      });

    // if trying to publish, while isDraft is already false / already published
    } else if (!patch.isDraft && !observation.isDraft) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Observation is already published',
      });
    // if trying to delock
    } else if (patch.isDraft && !observation.isDraft) {
      // if not either (isAuther && isAuthorRule) and (isOwner && isOwnerRule),
      // don't allow unpublishing
      if (
        !(isAuthor && project.authorCanDelockObservations) &&
        !(isProjectOwner && project.ownerCanDelockObservations)
      ) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You are not allowed to delock observation',
        });
      }
    // if trying to publish the observation, only allow author
    } else if (!patch.isDraft && observation.isDraft) {
      if (!isAuthor) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You are not allowed to publish this observation',
        });
      }
    }

  }

  const result = await prisma.observation.update({
    select: {
      id: true,
    }, where: {
      id: observationId,
    }, data: {
      ...patch,
      updatedAt: new Date().toISOString(),
    }
  });

  return {
    id: result.id,
    msg: 'observation draft patched!'
  }
})


// TODO: move to util
function removeKeysByUndefinedValue(
  obj: Record<string, any>
): Record<string, any> {
  const result = {} as Record<string, any>;
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}
