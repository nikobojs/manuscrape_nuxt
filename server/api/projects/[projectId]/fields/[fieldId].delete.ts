
import type { JsonObject } from '@prisma/client/runtime/library';
import { ProjectRole } from '@prisma-postgres/client';
import { captureException } from '@sentry/node';

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const fieldId = parseIntParam(event.context.params?.fieldId);

  // find project and field based on params
  const field = await db.projectField.findFirst({
    where: { projectId, id: fieldId },
    select: {
      id: true,
      choices: true,
      label: true,
      type: true,
    }
  });

  // find project and field count
  const project = await db.project.findFirst({
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
    const err = createError({
      statusCode: 400,
      statusMessage: 'Field is not in project or project does not exist'
    });
    captureException(err);
    throw err;
  }

  // ensure the field is not the last one
  if (project._count.fields === 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A project needs at least one parameter, so you cannot delete the last one'
    });
  }

  // get all the affected observations and update with their original 'data' value
  const affectedObservations = await db.observation.findMany({
    where: { projectId },
    select: { data: true, id: true }
  })

  // define array of affected observation id and its new 'data' value
  const dataUpdates = affectedObservations.map((o) => {
    if (typeof o.data !== 'object' || !o.data) {
      const err = createError({
        statusCode: 500,
        statusMessage: 'Observation has no data'
      });
      captureException(err);
      throw err;
    }

    if (!(field.label in o.data)) {
      captureException('Field label not found in affectedObservations');
    } else {
      delete (o.data as JsonObject)[field.label]
    }

    return o;
  });

  // update related observations and delete projec
  await db.$transaction([
    ...dataUpdates.map(o =>
      db.observation.update({
        data: { data: o.data || {} },
        where: { id: o.id },
      }),
    ),
    db.projectField.delete({
      where: { id: fieldId }
    }),
  ]);

  // get the updated fields to ensure indexes are ok
  const updatedFields = await db.projectField.findMany({
    where: { projectId },
    select: { id: true, index: true }
  })

  // verify and update indexes if needed
  await enforceCorrectIndexes(updatedFields)

  setResponseStatus(event, 204);
  return { success: true };
});