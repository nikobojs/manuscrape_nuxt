import { emailChangedTemplate } from "~~/server/utils/mails/templates/email-changed";
import { captureException } from "@sentry/node";
import { UpdateUserSchema } from "#shared/schemas/UpdateUser";

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  const { id, email, name } = user;
  const body = await readBody(event);
  const parsedBody = await UpdateUserSchema.validate(body);
  await updateUserProfile(id, parsedBody.email, parsedBody.name);
  if (body.email !== email) {
    // TODO: send email was changed warning
    console.log("Email has changed for user", id);
    // only send email-changed notifications to old emails if they exist
    if (email) {
      const emailHtml = emailChangedTemplate(name, email, body.email);
      try {
        await sendMail(email, "Your ManuScrape email was changed", emailHtml);
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
