import { createObservation } from "~~/server/utils/observations";

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  await ensureURLResourceAccess(event, event.context.user);

  const result = await createObservation(user.id, projectId, "{}");

  setResponseStatus(event, 201);

  return {
    id: result!.id,
    msg: "observation created!",
  };
});
