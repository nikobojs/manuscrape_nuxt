export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user);
  const tagId = parseIntParam(event.context.params?.tagId);

  await db.observationTag.deleteMany({ where: { tagId } });
  await db.tag.delete({ where: { id: tagId } });
  return { msg: 'Tag deleted' };
});
