import yup from "yup";
import {
  getResetPasswordTokenByTokenHash,
  hashResetPasswordToken,
  useResetPasswordToken,
} from "~~/server/utils/resetPasswordTokens";
import { updateUserPassword } from "~~/server/utils/users";

const querySchema = yup
  .object({
    password: yup
      .string()
      .required("Password is required")
      .typeError("Password is not valid")
      .min(3),
    token: yup
      .string()
      .required("Token is required")
      .typeError("Token is not valid")
      .min(3),
  })
  .required("Email is not defined");
export default safeResponseHandler(async (event) => {
  const config = useRuntimeConfig();
  // retrieve validated query with email
  let token = "";
  let password = "";
  try {
    const bodyRaw = await readBody(event);
    const body = await querySchema.validate(bodyRaw);
    token = body.token;
    password = body.password;
  } catch (e: any) {
    const errMsg = e?.message;
    console.error(errMsg, "helloooo");
    return await delayedError(event, 400, errMsg);
  }

  // make sure password is strong enough
  const strongEnough = passwordStrongEnough(password);
  if (!strongEnough.valid) {
    return await delayedError(event, 400, strongEnough.reason);
  }

  // regenerate password token hash
  const tokenHash = hashResetPasswordToken(token);

  // fetch token data from db, from token hash
  const dbToken = await getResetPasswordTokenByTokenHash(tokenHash, {
    id: true,
    revokedAt: true,
    usedAt: true,
    expiresAt: true,
    tokenHash: true,
    userId: true,
  });

  // validate it exists and is not used or revoled
  if (!dbToken || dbToken.usedAt || dbToken.revokedAt) {
    return await delayedError(
      event,
      404,
      "This link is already used. Please retry from the start",
    );
  }

  // validate it is not expired
  const dateExpiresAt = dbToken.expiresAt.replace(" ", "T") + "Z";
  const expiresAt = new Date(dateExpiresAt).getTime();
  if (expiresAt < Date.now()) {
    return await delayedError(
      event,
      400,
      "This link has expired. Please retry from the start",
    );
  }

  // fetch related user, ensure user exists
  const user = await getUserById(dbToken.userId, { id: true });
  if (!user) {
    return await delayedError(
      event,
      400,
      "This link was valid, but the user does not exist anymore",
    );
  }

  // set token usedAt to now and revokes all other reset password tokens for this user
  await useResetPasswordToken(user.id, dbToken.id);

  // update password
  await updateUserPassword(user.id, password, config.saltRounds);

  // return ok
  return { success: true };
});
