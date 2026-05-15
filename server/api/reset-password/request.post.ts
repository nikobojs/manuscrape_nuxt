import yup from "yup";
import { captureException } from "@sentry/node";
import {
  createResetPasswordToken,
  generateResetPasswordToken,
  userCanRequestPasswordResetToken,
} from "~~/server/utils/resetPasswordTokens";

const bodySchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .typeError("Email is not valid"),
  })
  .required("Email is not defined");

export default safeResponseHandler(async (event) => {
  const config = useRuntimeConfig();
  // retrieve validated query with email
  let email = "";
  try {
    const rawBody = await readBody(event);
    const body = await bodySchema.validate(rawBody);
    email = body.email;
  } catch (e: any) {
    const errMsg = e?.message;
    console.error("hellooo", errMsg);
    return await delayedError(event, 400, errMsg);
  }

  // validate email with internal regex as well
  if (!isValidEmail(email)) {
    console.error("Invalid email");
    return await delayedError(event, 400, "Invalid email");
  }

  // fetch user based on email, ensure user exists
  const user = await getUserByEmail(email, { id: true });
  if (!user) {
    const errMsg = "User could not be found";
    console.error(errMsg);
    captureException(errMsg, { data: { email } });
    return await delayedError(event, 400, errMsg);
  }

  // retrieve ip address and user_agent
  const ip = getHeader(event, "x-forwarded-for");
  const userAgent = getHeader(event, "user-agent");

  if (process.env.VITEST !== "true" && (!ip || !userAgent)) {
    const errMsg = "Unable to get ip or user-agent";
    console.log(process.env);
    console.error(errMsg);
    captureException(errMsg, { data: { ip, userAgent } });
    return await delayedError(event, 500, errMsg);
  }

  // ensure user is allowed to create new tokens
  const canCreateNew = await userCanRequestPasswordResetToken(user.id);
  if (!canCreateNew.ok) {
    const errMsg =
      canCreateNew.msg || "User cannot create new reset tokens at the moment";
    console.error(errMsg);
    captureException(errMsg, { data: { email } });
    return await delayedError(event, 400, errMsg);
  }

  // generate raw token string
  const token = generateResetPasswordToken();

  // create reset password token (also invalidates all other reset password tokens for the user)
  await createResetPasswordToken(
    user.id,
    ip || "unset",
    userAgent || "unset",
    token,
  );

  // log the token if it is not available
  if (process.env.NODE_ENV !== "production") {
    console.log(`Token '${token}' was generated for user ${email}`);
  }

  const resetLink =
    config.public.baseUrl +
    "/reset-password?token=" +
    encodeURIComponent(token);
  const html = resetPasswordTemplate(email, resetLink);

  try {
    // send email
    console.log("Resetting password for user:", {
      ip,
      userAgent,
      token,
      resetLink,
      userId: user.id,
    });
    await sendMail(email, "Reset ManuScrape password", html);
  } catch (e) {
    captureException(e, {
      level: "error",
    });
    console.error("Unable to send email:");
    console.error(e);
    return await delayedError(
      event,
      500,
      "Unable to send emails. We looking into this",
    );
  }

  // prepare response body
  const responseBody: Record<string, any> = {
    success: true,
  };

  // if testing, return the actual token
  if (process.env.VITEST === "true") {
    responseBody.token = token;
  }

  const res = await delayedResponse(event, responseBody);
  return res;
});
