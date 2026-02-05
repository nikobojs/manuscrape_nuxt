import * as yup from "yup";
import {
  getProjectAccess,
  patchProjectAccess,
} from "~~/server/utils/projectAccess";

const PatchCollaboratorBody = yup
  .object({
    nameInProject: yup.string(),
    role: yup.string(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);
  await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const collaboratorId = parseIntParam(event.context.params?.collaboratorId);
  const body = await readBody(event);

  const { nameInProject, role } = await PatchCollaboratorBody.validate(body);
  const patch: any = {};

  // validate role in body and set in patch
  if (role && !["OWNER", "INVITED"].includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project role is not recognized!",
    });
  } else if (role) {
    patch.role = role;
  }

  // add nameInProject to draft if defined
  if (nameInProject) {
    patch.nameInProject = nameInProject;
  }

  // ensure something is going to be updated
  if (Object.keys(patch).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Collaborator patch cannot be empty",
    });
  }

  // ensure collaborator marked for patching is actually connected to project
  const collaboratorAccess = await getProjectAccess(collaboratorId, projectId);
  if (!collaboratorAccess) {
    throw createError({
      statusCode: 400,
      statusMessage: "Collaborator is not connected to project",
    });
  }

  await patchProjectAccess(collaboratorId, projectId, patch);

  return { success: true };
});
