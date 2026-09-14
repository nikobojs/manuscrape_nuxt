export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user);
  const tagId = parseIntParam(event.context.params?.tagId);
  await deleteTagById(tagId);
  return { msg: "Tag deleted" };
});
