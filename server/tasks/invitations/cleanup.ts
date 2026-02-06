import { captureException } from "@sentry/node";
import { removeExpiredProjectInvitations } from "~~/server/utils/projectInvitations";

export default defineTask({
  meta: {
    name: "invitations:cleanup",
    description: "Remove expired collaborator invitations",
  },
  run: async ({ payload, context }) => {
    try {
      const deleted = await removeExpiredProjectInvitations();

      if (deleted.length > 0) {
        console.debug("deleted", deleted.length, "expired invitations");
      }
    } catch (e: any) {
      console.error(e);
      captureException(e);
    }

    return { result: "Success" };
  },
});
