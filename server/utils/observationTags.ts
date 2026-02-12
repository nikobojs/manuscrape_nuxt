import { and, count, eq, inArray } from "drizzle-orm";
import { getObservationsByProjectId } from "./observations";
import { observationTags, tags, users } from "../drizzle/schema";

export async function countTagUsageInProject(tagId: number, projectId: number) {
  const obs = await getObservationsByProjectId(projectId, { id: true });
  const obsIds = obs.map((x) => x.id);
  const usageCount = await db
    .select({ count: count(observationTags.tagId) })
    .from(observationTags)
    .where(
      and(
        eq(observationTags.tagId, tagId),
        inArray(observationTags.observationId, obsIds),
      ),
    );
  return usageCount[0]?.count || 0;
}

export async function getObservationTagsInProject(projectId: number) {
  return db.query.tags.findMany({
    where: eq(tags.projectId, projectId),
    columns: {
      createdById: true,
      id: true,
      name: true,
    },
  });
}

export async function getObservationTagByTagName(
  tagName: string,
  projectId: number,
) {
  return db.query.tags.findFirst({
    where: and(eq(tags.name, tagName), eq(tags.projectId, projectId)),
    columns: {
      createdById: true,
      id: true,
      name: true,
    },
  });
}

export async function getObservationTagsByProjectIds(projectIds: number[]) {
  return db.query.tags.findMany({
    where: inArray(tags.projectId, projectIds),
    columns: {
      createdById: true,
      id: true,
      name: true,
      projectId: true,
    },
  });
}

export async function deleteTagById(tagId: number) {
  await db.transaction(async (tx) => {
    await tx.delete(observationTags).where(eq(observationTags.tagId, tagId));
    await tx.delete(tags).where(eq(tags.id, tagId));
  });
}

export async function addUserToTags(
  tags: { createdById: number | null; id: number; name: string }[],
): Promise<
  {
    createdById: number | null;
    id: number;
    name: string;
    createdBy: { id: number; email: string } | null;
  }[]
> {
  const userIds = Array.from(new Set(tags.map((t) => t.createdById))).filter(
    (x) => x !== null,
  );
  const userRes = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, userIds));
  const userMap = Object.groupBy(userRes, (u) => u.id);
  const newTags = tags.map((t) => {
    const res: {
      createdById: number | null;
      id: number;
      name: string;
      createdBy: { id: number; email: string } | null;
    } = { ...t, createdBy: null };
    if (t.createdById) {
      const tagUser = userMap[t.createdById]?.[0]!;
      res.createdBy = tagUser;
    }
    return res;
  });
  return newTags;
}

export async function createObservationTag(
  tagName: string,
  projectId: number,
  userId: number,
) {
  return db
    .insert(tags)
    .values({
      name: tagName,
      projectId,
      createdById: userId,
    })
    .returning({
      id: tags.id,
      name: tags.name,
    })
    .then((v) => v[0]);
}
