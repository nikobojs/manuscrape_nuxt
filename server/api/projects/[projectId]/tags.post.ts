import * as yup from "yup";

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, [
    "OWNER",
    "INVITED",
  ]);

  const projectId = parseIntParam(event.context.params?.projectId);

  const NewTagSchema = yup.object({
    name: yup.string().trim().min(1).max(100).required(),
  });

  const body = await readBody(event);
  const newTag = await NewTagSchema.validate(body);

  const existing = await getObservationTagByTagName(newTag.name, projectId);
  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: `A tag named '${newTag.name}' already exists in this project.`,
    });
  }

  const created = await createObservationTag(newTag.name, projectId, user.id);

  setResponseStatus(event, 201);
  return { tag: created };
});
