import { useScheduler } from "#scheduler"
import { captureException } from "@sentry/node";

export default defineNitroPlugin(() => {
  startScheduler()
});


function startScheduler() {
  const scheduler = useScheduler();

  scheduler.run(async () => {
    try {
      const deleted = await prisma.projectInvitation.deleteMany({
        where: { expiresAt : { lte: new Date() }},
      });

      if (deleted.count > 0) {
        console.debug('deleted', deleted.count, 'expired invitations');
      }
    } catch(e: any) {
      console.error(e);
      captureException(e);
    }
  }).everyFiveMinutes();
}