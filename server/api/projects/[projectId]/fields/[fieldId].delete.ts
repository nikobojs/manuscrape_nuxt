
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../utils/authorize';
import { JsonObject } from '@prisma/client/runtime/library';

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const fieldId = parseIntParam(event.context.params?.fieldId);

  // find project and field based on params
  const field = await prisma.projectField.findFirst({
    where: { projectId, id: fieldId },
    select: {
      id: true,
      choices: true,
      label: true,
      type: true,
    }
  });

  // find project and field count
  const project = await prisma.project.findFirst({
    select: {
      id: true,
      _count: {
        select: {
          fields: true,
        },
      },
    },
    where: { id: projectId },
  });

  if (!field || !project) {
    // TODO: report
    throw createError({
      statusCode: 400,
      statusMessage: 'Field is not in project or project does not exist'
    });
  }

  // ensure the field is not the last one
  if (project._count.fields === 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A project needs at least one parameter, so you cannot delete the last one'
    });
  }

  // get all the affected observations and update with their original 'data' value
  const affectedObservations = await prisma.observation.findMany({
    where: { projectId },
    select: { data: true, id: true }
  })

  // define array of affected observation id and its new 'data' value
  const dataUpdates = (await affectedObservations).map((o) => {
    if (typeof o.data !== 'object' || !o.data) {
      // TODO: report
      throw createError({
        statusCode: 500,
        statusMessage: 'Observation has no data'
      });
    }

    if (!(field.label in o.data)) {
      // TODO: report
      console.warn('Field label not found in observation data')
    } else {
      delete (o.data as JsonObject)[field.label]
    }

    return o;
  });

  // update related observations and delete projec
  await prisma.$transaction([
    ...dataUpdates.map(o =>
      prisma.observation.update({
        data: { data: o.data || {} },
        where: { id: o.id },
      }),
    ),
    prisma.projectField.delete({
      where: { id: fieldId }
    }),
  ]);

  setResponseStatus(event, 204);
  return { success: true };
});