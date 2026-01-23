export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);
  const projectId = parseIntParam(event.context.params?.projectId);

  const dynamicFields = await db.dynamicProjectField.findMany({
    where: { projectId },
  });

  return { dynamicFields: dynamicFields };
});
