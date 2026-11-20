import { captureException } from "@sentry/node";

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, ["OWNER"]);

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
  // note: 'data' is a jsonb column, so it is already parsed to an object
  const dataUpdates = affectedObservations
    .map((o) => {
      if (!o.data || typeof o.data !== "object") {
        // capture error without telling user. Skip modifying this observation
        const err = createError({
          statusCode: 500,
          statusMessage: `Observation #${o.id} has malformed data when modifying observations after field deletion`,
        });
        captureException(err, { data: { affectedObservationId: o.id } });
        return null;
      }

      // if deleted field is not in data, skip
      const data = { ...(o.data as Record<string, any>) };
      if (field.label in data) {
        // delete field data from observation data
        delete data[field.label];
        return { id: o.id, data };
      }

      return null;
    })
    .filter((u): u is { id: number; data: Record<string, any> } => u !== null);

  // update related observations and delete field
  await db.transaction(async (tx) => {
    for (const o of dataUpdates) {
      await updateObservationData(o.id, o.data);
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
