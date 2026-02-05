import * as yup from "yup";
import {
  createObservationTag,
  getObservationTagByTagName,
} from "~~/server/utils/observationTags";

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);

  const projectId = parseIntParam(event.context.params?.projectId);
  const userId = event.context.user.id;

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

  const created = await createObservationTag(newTag.name, projectId, userId);

  setResponseStatus(event, 201);
  return { tag: created };
});
