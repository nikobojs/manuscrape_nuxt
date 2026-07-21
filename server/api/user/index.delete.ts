import { compare } from "bcrypt";
import * as yup from "yup";

export const DeleteUserSchema = yup
  .object({
    password: yup.string().typeError("Password is not valid"),
  })
  .required();

export default safeResponseHandler(async (event) => {
  const { id: userId } = await requireUser(event);

  // parse body
  const body = await readBody(event);
  let parsed;
  try {
    parsed = await DeleteUserSchema.validate(body);
  } catch (e: any) {
    const msg = e?.message || "Missing required body parameters";
    return await delayedError(event, 400, msg, true);
  }

  // fetch user from db with email from request body
  const user = await getUserById(userId, { password: true });

  // handle if user does not exist
  if (!user) {
    return await delayedError(event, 403, "User does not exist");
  }

  // validate password if user has one
  if (user.password) {
    if (!parsed.password) {
      return await delayedError(
        event,
        403,
        "User has a password, but you didn't send one",
      );
    }
    const passwordOk = await compare(parsed.password, user.password);
    if (!passwordOk) {
      return await delayedError(event, 403, "Wrong password");
    }
  }

  await deleteProjectAccessByUserId(userId);
  await removeProjectOwnershipByUserId(userId);
  await removeUserFromObservations(userId);
  await removeUserFromProjectExports(userId);

  // retrieve affected projects to be deleted
  // NOTE: fetches projects where user is the only one with access
  const projectIdsToDelete = await getDanglingProjects();
  await deleteProjectsByIds(projectIdsToDelete);

  // delete user
  await deleteUserById(userId);

  // logout, user is deleted, right?
  event.context.user = undefined;
  resetAuthCookie(event);

  // return 204 No content
  setResponseStatus(event, 204);
  return {};
});
