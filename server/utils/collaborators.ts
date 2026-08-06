import { eq, inArray } from "drizzle-orm";
import { projectAccesses, users } from "../drizzle/schema";

export async function getCollaboratorsInProjects(projectIds: number[]) {
  const collaborators = await db
    .select({
      role: projectAccesses.role,
      createdAt: projectAccesses.createdAt,
      nameInProject: projectAccesses.nameInProject,
      user_id: projectAccesses.userId,
      project_id: projectAccesses.projectId,
      user_email: users.email,
      user_name: users.name,
    })
    .from(projectAccesses)
    .leftJoin(users, eq(projectAccesses.userId, users.id))
    .where(inArray(projectAccesses.projectId, projectIds))
    .groupBy((t) => [t.user_id, t.user_email, t.user_name, t.project_id]);

  return collaborators satisfies Collaborator[];
}
