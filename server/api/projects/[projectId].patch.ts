import * as yup from "yup";

export const PatchProjectFieldSchema = yup
  .object({
    name: yup.string().optional(),
    description: yup.string().optional(),
    canDelockObservations: yup.boolean().optional(),
    ownerCanPatchObservations: yup.boolean().optional(),
    contributorsCanReadAllObservations: yup.boolean().optional(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, ["OWNER"]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const body = await readBody(event);
  const patch = await PatchProjectFieldSchema.validate(body);
  await updateProject(projectId, patch);
  setResponseStatus(event, 204);
});
