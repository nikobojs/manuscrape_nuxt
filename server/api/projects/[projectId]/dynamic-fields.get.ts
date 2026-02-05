import { getDynamicFieldsByProjectIds } from "~~/server/utils/dynamicFields";

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);
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
