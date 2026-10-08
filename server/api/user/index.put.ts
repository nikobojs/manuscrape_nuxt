import { emailChangedTemplate } from "~~/server/utils/mails/templates/email-changed";
import { captureException } from "@sentry/node";
import { UpdateUserSchema } from "#shared/schemas/UpdateUser";

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  const { id, name } = user;
  const body = await readBody(event);
  const parsedBody = await UpdateUserSchema.validate(body);

  // resolve the previous email from the db — the session snapshot can be
  // older than the latest email change and must not be used as "old email"
  const previousUser = await getUserById(id, { email: true });
  const previousEmail = previousUser?.email || null;

  await updateUserProfile(id, parsedBody.email, parsedBody.name);

  // keep the session user in sync with the new profile — never fail the
  // profile update itself if the session write breaks
  try {
    await setUserSession(event, {
      user: {
        id,
        email: parsedBody.email,
        name: parsedBody.name,
        authSource: user.authSource,
      } as CurrentUser,
    });
  } catch (e) {
    captureException(e, {
      level: "error",
    });
    console.error("Unable to update session after profile update:");
    console.error(e);
  }

  if (parsedBody.email !== previousEmail) {
    console.log("Email has changed for user", id);
    // only send email-changed notifications to old emails if they exist
    if (previousEmail) {
      const emailHtml = emailChangedTemplate(
        name,
        previousEmail,
        parsedBody.email || "",
      );
      try {
        await sendMail(
          previousEmail,
          "Your ManuScrape email was changed",
          emailHtml,
        );
      } catch (e) {
        captureException(e, {
          level: "error",
        });
        console.error("Unable to send email:");
        console.error(e);
      }
    }
  }
  setResponseStatus(event, 204);
});
