import { compare } from "bcryptjs";
import * as yup from "yup";
import { AuthSource } from "#shared/types/auth-source";

export const SignInRequestSchema = yup
  .object({
    // email: yup.string().required('Email is required'),
    // password: yup.string().required('Password is required'),
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
  console.log("auth 0");
  // read body and initiate parsed body
  const body = await readBody(event);
  let parsed: SignInBody | undefined;
  console.log("auth 1");
  // validate with yup and save to variable 'parsed'
  try {
    parsed = await SignInRequestSchema.validate(body);
  } catch (e: any) {
    const msg = e?.message || "Missing required body parameters";
    return await delayedError(event, 400, msg, true);
  }
  console.log("auth 2");
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
  console.log("auth 3");
  // handle if user does not exist
  if (!user) {
    return await delayedError(event, 403, "User does not exist");
  }
  console.log("auth 4");
  if (!user.password || user.authSource === AuthSource.SAML) {
    return await delayedError(event, 403, "User is a SAML user");
  }
  console.log("auth 5");
  // handle if password mismatch
  const passwordOk = await compare(parsed.password, user.password);
  if (!passwordOk) {
    return await delayedError(event, 403, "Wrong password");
  }

  console.log("auth 6");
  // create cookies, tokens, etc
  const { token } = await authorize(event, user, null);

  // return delayed succes response
  console.log("auth 7");
  const res = await delayedResponse(event, { token });
  return res;
});
