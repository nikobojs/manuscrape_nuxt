import { createObservation } from "~~/server/utils/observations";

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  await ensureURLResourceAccess(event, user, ["OWNER", "INVITED"]);

  const result = await createObservation(user.id, projectId, "{}");

  setResponseStatus(event, 201);

  return {
    id: result!.id,
    msg: "observation created!",
  };
});
