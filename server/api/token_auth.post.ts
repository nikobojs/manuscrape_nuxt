import { compare } from "bcryptjs";
import * as yup from "yup";

// NOTE: this endpoint only exists to support backward
//       compatability with the old manuscrape clients
// - This file is to be deleted when newer native clients have been releases,
//   along with full deprecation of the current token authorization
export const SignInRequestSchema = yup
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
  if (!config.tokenApiEnabled) {
    throw createError({
      message: "The token API is deprecated. Please update your client",
      status: 400,
    });
  }

  // read body and initiate parsed body
  const body = await readBody(event);
  let parsed: SignInBody | undefined;
  // validate with yup and save to variable 'parsed'
  try {
    parsed = await SignInRequestSchema.validate(body);
  } catch (e: any) {
    const msg = e?.message || "Missing required body parameters";
    return await delayedError(event, 400, msg, true);
  }
  // fetch user from db with email from request body
  const user = await getUserByEmail(parsed.email, {
    id: true,
    email: true,
    name: true,
    password: true,
    createdAt: true,
    samlNameId: true,
    samlOrganizationName: true,
    authSource: true,
  });
  // handle if user does not exist
  if (!user) {
    return await delayedError(event, 403, `User does not exist`);
  }
  if (user.authSource === "SAML" || !user.password) {
    return await delayedError(
      event,
      400,
      "User does not have a password. Only password users can use the token API",
    );
  }
  // handle if password mismatch
  const passwordOk = await compare(parsed.password, user.password);
  if (!passwordOk) {
    return await delayedError(event, 403, "Wrong password");
  }

  // create session and get token for tests
  const authResult = await authorize(event, user, null);

  // return delayed success response with token for test compatibility
  const res = await delayedResponse(event, {
    success: true,
    token: authResult.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
  return res;
});
