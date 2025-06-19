export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user);
  const projectId = parseIntParam(event.context.params?.projectId);
  const tagId = parseIntParam(event.context.params?.tagId);

  const usageCount = await db.observationTag.count({
    where: {
      tagId,
      observation: {
        projectId,
      },
    },
  });

  return { usageCount };

});
