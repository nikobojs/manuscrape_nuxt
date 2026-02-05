import * as yup from "yup";
import { daysInFuture } from "#shared/utils/datetime";
import { getUserByEmail } from "~~/server/utils/users";
import {
  createProjectInvitation,
  getProjectInvitationByEmail,
} from "~~/server/utils/projectInvitations";

const AddCollaboratorSchema = yup
  .object({
    email: yup.string().required(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);
  const body = await readBody(event);
  const config = useRuntimeConfig();
  const user = await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const allowedRoles: ProjectRole[] = ["OWNER"];
  let parsed: { email: string };

  // validate with yup
  try {
    parsed = await AddCollaboratorSchema.validate(body);
  } catch (e: any) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required body parameters",
    });
  }

  const access = await ensureProjectAccess(user.id, projectId);
  if (!allowedRoles.includes(access.role)) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "You do not have the required project permissions to invite collaborators",
    });
  }

  const collaborator = await getUserByEmail(parsed.email, {
    id: true,
    email: true,
  });

  // if collaborator is already an existing user,
  // just let them join the project immediatly
  if (collaborator) {
    const existing = await getProjectAccess(collaborator.id, projectId);
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: "User already has access to project",
      });
    }

    await createProjectAccess(
      collaborator.id,
      projectId,
      collaborator.email,
      "INVITED",
    );

    setResponseStatus(event, 202);
    return { success: true };

    // if user does not exist in db, create projectInvitation and return the link
  } else {
    // check if invitation is already sent to user
    const existing = await getProjectInvitationByEmail(
      parsed.email,
      projectId,
      config.invitationSalt,
    );

    // if invitation already exists, throw up
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage:
          "User is already invited to project. They just need to sign up on ManuScrape to get access.",
      });
    }

    // create invitation
    await createProjectInvitation(
      parsed.email,
      daysInFuture(7),
      user.id,
      projectId,
      config.invitationSalt,
    );

    setResponseStatus(event, 201);

    return {
      success: true,
    };
  }
});
