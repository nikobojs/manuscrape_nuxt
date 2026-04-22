import { captureException } from "@sentry/node";
import {
  getObservationsByProjectId,
  updateObservationData,
} from "~~/server/utils/observations";
import {
  deleteProjectField,
  getProjectFieldById,
  getProjectFieldCountByProjectId,
  updateProjectFieldIndexes,
} from "~~/server/utils/projectFields";

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const fieldId = parseIntParam(event.context.params?.fieldId);

  const fieldCount = await getProjectFieldCountByProjectId(projectId);

  // find project and field based on params
  const field = await getProjectFieldById(fieldId, {
    id: true,
    choices: true,
    label: true,
    type: true,
  });

  if (!field || fieldCount === 0) {
    const err = createError({
      statusCode: 400,
      statusMessage: "Field is not in project or project does not exist",
    });
    captureException(err);
    throw err;
  }

  // ensure the field is not the last one
  if (fieldCount === 1) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "A project needs at least one parameter, so you cannot delete the last one",
    });
  }

  // get all the affected observations and update with their original 'data' value
  const affectedObservations = await getObservationsByProjectId(projectId, {
    data: true,
    id: true,
  });

  // define array of affected observation id and its new 'data' value
  const dataUpdates = affectedObservations.map((o) => {
    if (typeof o.data !== "string" || !o.data) {
      // capture error without telling user. Skip modifying this observation
      // TODO: consider removing this capture as this probably happens for all empty observations
      const err = createError({
        statusCode: 500,
        statusMessage:
          "Observation has no data when modifying observations after field deletion",
      });
      captureException(err, { data: { affectedObservation: o } });
      return o;
    }

    // try parse observation json
    try {
      const data = JSON.parse(o.data);
      // if deleted field is not in data, skip
      if (field.label in data) {
        // delete field data from observation data
        delete (data as any)[field.label];
        o.data = JSON.stringify(data);
      }
    } catch (e) {
      // capture error without telling user. Skip modifying this observation
      const err = createError({
        statusCode: 500,
        statusMessage: `Observation #${o.id} data could not be parsed to JSON`,
      });
      captureException(err);
    }

    return o;
  });

  // update related observations and delete project
  await db.transaction(async (tx) => {
    for (const o of dataUpdates) {
      const newData = o.data || {};
      await updateObservationData(o.id, newData);
    }

    await deleteProjectField(fieldId);
  });

  // get the updated fields to ensure indexes are ok
  const updatedFields = await getProjectFieldsByProjectIds([projectId], {
    id: true,
    index: true,
  });

  // verify and update indexes if needed
  await updateProjectFieldIndexes(updatedFields);

  setResponseStatus(event, 204);
  return { success: true };
});
