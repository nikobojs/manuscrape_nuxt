import { deleteTagById } from "~~/server/utils/observationTags";

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user);
  const tagId = parseIntParam(event.context.params?.tagId);
  await deleteTagById(tagId);
  return { msg: "Tag deleted" };
});
