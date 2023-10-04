import { useScheduler } from "#scheduler"

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
      // TODO: report error
    }
  }).everyFiveMinutes();
}