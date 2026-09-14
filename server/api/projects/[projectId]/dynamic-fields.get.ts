export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, ["OWNER"]);
  const projectId = parseIntParam(event.context.params?.projectId);

  const dynamicFields = await getDynamicFieldsByProjectIds([projectId], {
    createdAt: true,
    field0Id: true,
    field1Id: true,
    id: true,
    operator: true,
    label: true,
    projectId: true,
  });

  return { dynamicFields: dynamicFields };
});
