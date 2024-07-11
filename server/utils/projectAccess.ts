export async function ensureProjectAccess(userId: number, projectId: number) {
  const projectAccess = await prisma.projectAccess.findFirst({
    select: {
      role: true,
    },
    where: {
      projectId,
      userId: userId,
    },
  });

  // require access to project
  if (!projectAccess) {
    // TODO: report error
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have access to this project",
    });
  }
}
