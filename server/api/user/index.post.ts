import * as yup from "yup";

export const SignUpRequestSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .typeError("Email is not valid"),
    password: yup
      .string()
      .required("Password is required")
      .typeError("Password is not valid"),
  })
  .required();

export default safeResponseHandler(async (event) => {
  const config = useRuntimeConfig();

  // read body and initiate parsed body
  const body = await readBody(event);
  let parsed: SignUpBody | undefined;

  // validate with yup and save to variable 'parsed'
  try {
    parsed = await SignUpRequestSchema.validate(body);
  } catch (e: any) {
    const msg = e?.message || "Missing required body parameters";
    return await delayedError(event, 400, msg, true);
  }

  // ensure user isn't already created
  const existingUser = await getUserByEmail(parsed.email, { id: true });
  if (existingUser) {
    return await delayedError(event, 409, "User already exists");
  }

  // validate email
  if (!isValidEmail(parsed.email)) {
    return await delayedError(event, 400, "Invalid email");
  }

  // validate password
  const { valid, reason } = passwordStrongEnough(parsed.password);
  if (!valid) {
    return await delayedError(event, 400, reason);
  }

  // create user
  const user = await createUser(
    parsed.email,
    parsed.password,
    config.saltRounds,
  );

  // get all pending invitations based on hashed email
  // TODO: refactor crypto stuff
  const invitations = await getAllProjectInvitationsByEmail(
    parsed.email,
    config.invitationSalt,
  );
  const invitationIds = invitations.map((i) => i.id);
  const invitationProjectIds = Array.from(
    new Set(invitations.map((i) => i.projectId)),
  );

  // accept invitations if any
  if (invitations.length > 0) {
    await createMultipleProjectAccess(
      user.id,
      parsed.email,
      invitationProjectIds,
      "INVITED",
    );
    // delete accepted invitations
    await deleteProjectInvitations(invitationIds);
  }

  // authorize user
  const { token } = await authorize(event, user, null);

  // return delayed response
  setResponseStatus(event, 201);
  const res = await delayedResponse(event, { id: user.id, token });
  return res;
});
