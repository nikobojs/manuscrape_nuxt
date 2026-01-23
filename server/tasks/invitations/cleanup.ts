import { captureException } from "@sentry/node";

export default defineTask({
  meta: {
    name: "invitations:cleanup",
    description: "Remove expired collaborator invitations",
  },
  run: async ({ payload, context }) => {
    console.log("Removing expired collaborator invitations..");

    try {
      const deleted = await db.projectInvitation.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });

      if (deleted.count > 0) {
        console.debug("deleted", deleted.count, "expired invitations");
      }
    } catch (e: any) {
      console.error(e);
      captureException(e);
    }

    return { result: "Success" };
  },
});
