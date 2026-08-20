import { count, eq, inArray } from "drizzle-orm";
import {
  dynamicProjectFields,
  observations,
  projectAccesses,
  projectExports,
  projectFields,
  projectInvitations,
  projects,
} from "../drizzle/schema";
import { getProjectFieldsByProjectIds } from "./projectFields";
import { getDynamicFieldsByProjectIds } from "./dynamicFields";
import { db } from "./drizzle";

type ProjectInsert = Awaited<typeof projects.$inferInsert>;

export type ProjectSelect = Partial<
  Record<keyof typeof projects.$inferSelect, boolean>
>;

export async function createProject(newProject: ProjectInsert) {
  return db
    .insert(projects)
    .values({
      ...newProject,
      authorCanDelockObservations: !!newProject.authorCanDelockObservations,
      ownerCanDelockObservations: !!newProject.ownerCanDelockObservations,
    })
    .returning({
      id: projects.id,
    })
    .then((res) => res[0]!);
}

export function getProjectById<
  T extends Partial<Record<keyof ProjectSelect, boolean>>,
>(projectId: number, select: T) {
  return db.query.projects.findFirst({
    columns: select,
    where: eq(projects.id, projectId),
  });
}

export function updateProject(
  projectId: number,
  patch: Partial<ProjectInsert>,
) {
  return db.update(projects).set(patch).where(eq(projects.id, projectId));
}

export function removeProjectOwnershipByUserId(userId: number) {
  return db
    .update(projects)
    .set({ authorId: null })
    .where(eq(projects.authorId, userId));
}

export async function getSmallProjects(
  projectIds: number[],
): Promise<SmallProject[]> {
  const projectRes = await db
    .select({
      id: projects.id,
      createdAt: projects.createdAt,
      storageLimit: projects.storageLimit,
      name: projects.name,
      authorCanDelockObservations: projects.authorCanDelockObservations,
      ownerCanDelockObservations: projects.ownerCanDelockObservations,
      contributorsCanReadAllObservations:
        projects.contributorsCanReadAllObservations,
      contributorsCanExport: projects.contributorsCanExport,
      observationCount: count(observations.id), // TODO: rename to observationCount
    })
    .from(projects)
    .leftJoin(observations, eq(projects.id, observations.projectId))
    .groupBy(projects.id)
    .where(inArray(projects.id, projectIds));

  // project fields
  const fieldsRes: SmallProjectField[] = await getProjectFieldsByProjectIds(
    projectIds,
    {
      choices: true,
      createdAt: true,
      id: true,
      index: true,
      label: true,
      projectId: true,
      required: true,
      type: true,
    },
  );

  // dynamic project fields
  const dynamicFieldsRes = await getDynamicFieldsByProjectIds(projectIds, {
    choices: true,
    createdAt: true,
    field0Id: true,
    field1Id: true,
    operator: true,
    id: true,
    index: true,
    label: true,
    projectId: true,
    required: true,
    type: true,
  });

  // tags
  const tagsRes: {
    id: number;
    name: string;
    projectId: number;
    createdById: number | null;
  }[] = await getObservationTagsByProjectIds(projectIds);
  const projectTagMap = Object.groupBy(
    tagsRes,
    (x: {
      id: number;
      name: string;
      projectId: number;
      createdById: number | null;
    }) => x.projectId,
  );
  const projectFieldMap = Object.groupBy(
    fieldsRes,
    (x: SmallProjectField) => x.projectId,
  );
  const projectDynamicFieldMap = Object.groupBy(
    dynamicFieldsRes,
    (x) => x.projectId,
  );

  return projectRes.map((p) => {
    const _fields = projectFieldMap[p.id]! satisfies SmallProjectField[];
    const _result = {
      ...p,
      fields: _fields,
      dynamicFields: projectDynamicFieldMap[p.id] || [],
      tags: projectTagMap[p.id] || [],
    } satisfies SmallProject;

    return _result;
  });
}

/**
 * Returns the projects that no one has access to
 */
export async function getDanglingProjects(): Promise<number[]> {
  let projectRes = await db
    .select({
      projectId: projects.id,
      accessCount: count(projectAccesses.userId),
    })
    .from(projects)
    .leftJoin(projectAccesses, eq(projectAccesses.projectId, projects.id))
    .groupBy(projects.id);

  projectRes = projectRes.filter((p) => p.accessCount === 0);
  return projectRes.map((x) => x.projectId);
}

export function deleteProjectsByIds(projectIds: number[]) {
  return db.transaction(async (tx) => {
    await db
      .delete(observations)
      .where(inArray(observations.projectId, projectIds));
    await db
      .delete(projectExports)
      .where(inArray(projectExports.projectId, projectIds));
    await db
      .delete(projectAccesses)
      .where(inArray(projectAccesses.projectId, projectIds));
    await db
      .delete(projectFields)
      .where(inArray(projectFields.projectId, projectIds));
    await db
      .delete(dynamicProjectFields)
      .where(inArray(dynamicProjectFields.projectId, projectIds));
    await db
      .delete(projectInvitations)
      .where(inArray(projectInvitations.projectId, projectIds));
    await db.delete(projects).where(inArray(projects.id, projectIds));
  });
}
