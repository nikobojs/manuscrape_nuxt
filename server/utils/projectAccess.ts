import { captureException } from "@sentry/node";
import { and, eq } from "drizzle-orm";
import { projectAccesses } from "~~/server/drizzle/schema";

export async function ensureProjectAccess(
  userId: number,
  projectId: number,
): Promise<{ role: "OWNER" | "INVITED" }> {
  const projectAccess = await getProjectAccess(userId, projectId);

  // require access to project
  if (!projectAccess) {
    const errMsg = `User ${userId} requested access to a project they don't have access to`;
    captureException(errMsg);
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have access to this project",
    });
  }

  return projectAccess;
}

export async function getProjectAccessesByUserId(userId: number) {
  const _projectAccesses = await db.query.projectAccesses.findMany({
    where: eq(projectAccesses.userId, userId),
    columns: {
      createdAt: true,
      nameInProject: true,
      projectId: true,
      role: true,
    },
  });
  return _projectAccesses;
}

export async function getProjectAccess(userId: number, projectId: number) {
  const access = await db.query.projectAccesses.findFirst({
    where: and(
      eq(projectAccesses.projectId, projectId),
      eq(projectAccesses.userId, userId),
    ),
    columns: {
      role: true,
    },
  });
  return access;
}

export async function deleteProjectAccess(userId: number, projectId: number) {
  return db
    .delete(projectAccesses)
    .where(
      and(
        eq(projectAccesses.projectId, projectId),
        eq(projectAccesses.userId, userId),
      ),
    );
}

export async function patchProjectAccess(
  userId: number,
  projectId: number,
  patch: { nameInProject: string; role: ProjectRole },
) {
  return db
    .update(projectAccesses)
    .set(patch)
    .where(
      and(
        eq(projectAccesses.projectId, projectId),
        eq(projectAccesses.userId, userId),
      ),
    );
}

export async function createProjectAccess(
  userId: number,
  projectId: number,
  nameInProject: string,
  role: ProjectRole,
) {
  return db.insert(projectAccesses).values({
    userId: userId,
    projectId: projectId,
    nameInProject: nameInProject,
    role: role,
  });
}

export function deleteProjectAccessByUserId(userId: number) {
  return db.delete(projectAccesses).where(eq(projectAccesses.userId, userId));
}

export function createMultipleProjectAccess(
  userId: number,
  email: string,
  projectIds: number[],
  role: ProjectRole,
) {
  return db.insert(projectAccesses).values(
    projectIds.map((projectId) => ({
      projectId,
      userId,
      role,
      nameInProject: email,
    })),
  );
}
