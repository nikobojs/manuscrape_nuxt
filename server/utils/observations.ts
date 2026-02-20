import { and, count, eq, gte, inArray, lte, SQL } from "drizzle-orm";
import {
  fileUploads,
  imageUploads,
  observations,
  observationTags,
  tags,
  users,
} from "../drizzle/schema";
import { getFileUploadsByObservationIds } from "./fileUploads";
import { getImageUploadsByObservationIds } from "./imageUploads";
import { getUsersByIds } from "./users";
import { getObservationTagsByProjectIds } from "./observationTags";

type ObservationSelect = Partial<
  Record<keyof typeof observations.$inferSelect, boolean>
>;

export async function getObservationById<
  T extends Partial<Record<keyof ObservationSelect, boolean>>,
>(obsId: number, select: T) {
  const res = await db.query.observations.findFirst({
    columns: select,
    where: eq(observations.id, obsId),
  });

  return res;
}

export async function getFullObservationsByProjectId(
  whereStatement: SQL<unknown>,
  orderByStatement: SQL<unknown>,
  offset: number,
  limit: number,
) {
  const allObs = await getObservations(
    {
      id: true,
    },
    whereStatement,
  );

  const obsIds = allObs.map((o) => o.id);

  const fullObservations = await db
    .select({
      createdAt: observations.createdAt,
      data: observations.data,
      id: observations.id,
      isDraft: observations.isDraft,
      projectId: observations.projectId,
      updatedAt: observations.updatedAt,
      uploadInProgress: observations.uploadInProgress,
      userId: observations.userId,
      author_email: users.email,
    })
    .from(observations)
    .innerJoin(users, eq(observations.userId, users.id))
    .where(inArray(observations.id, obsIds))
    .limit(limit)
    .offset(offset)
    .orderBy(orderByStatement);

  const resultIds = fullObservations.map((o) => o.id);
  const userIds = fullObservations
    .map((o) => o.userId)
    .filter((id) => id !== null);
  const projectIds = Array.from(
    new Set(fullObservations.map((o) => o.projectId)),
  );

  const fileUploadsRes = await getFileUploadsByObservationIds(resultIds, {
    id: true,
    createdAt: true,
    mimetype: true,
    originalName: true,
    observationId: true,
  });
  const imageUploadsRes = await getImageUploadsByObservationIds(resultIds, {
    id: true,
    createdAt: true,
    mimetype: true,
    originalName: true,
    observationId: true,
  });
  const relatedUsersRes = await getUsersByIds(userIds, {
    id: true,
    email: true,
  });
  const tagsRes = await getObservationTagsByProjectIds(projectIds);

  const fileUploadMap = Object.groupBy(fileUploadsRes, (f) => f.observationId);
  const observationImageMap = Object.groupBy(
    imageUploadsRes,
    (i) => i.observationId,
  );
  const projectTagsMap = Object.groupBy(tagsRes, (i) => i.projectId);

  const results: FullObservation[] = [];
  for (const o of fullObservations) {
    const result: FullObservation = {
      ...o,
      data: o.data as Record<string, any>,
      fileUploads: fileUploadMap[o.id] || [],
      image: observationImageMap[o.id]?.[0] || null,
      user: relatedUsersRes?.find((u) => u.id === o.userId) || null,
      tags: (projectTagsMap[o.projectId] || []).map((t) => ({
        id: t.id,
        name: t.name,
      })),
    };
    results.push(result);
  }

  return results;
}

export async function getObservations<
  T extends ObservationSelect,
  W extends SQL<unknown>,
>(select: T, where: W) {
  select.id = true;
  const res = await db.query.observations.findMany({
    columns: select,
    where: where,
  });

  return res;
}

export function updateObservationData(
  observationId: number,
  data: Record<string, any>,
) {
  return db
    .update(observations)
    .set({ data: data })
    .where(eq(observations.id, observationId));
}

export async function getObservationsByProjectId<
  T extends Partial<Record<keyof ObservationSelect, boolean>>,
>(projectId: number, select: T) {
  const res = await db.query.observations.findMany({
    columns: select,
    where: eq(observations.projectId, projectId),
  });

  return res;
}

export async function getObservationImage(observationId: number) {
  const imageRes = await db
    .select({
      id: imageUploads.id,
      createdAt: imageUploads.createdAt,
      mimetype: imageUploads.mimetype,
      originalName: imageUploads.originalName,
    })
    .from(imageUploads)
    .where(eq(imageUploads.observationId, observationId));
  return imageRes;
}

async function getObservationTagsByObservationId(observationId: number) {
  const res = await db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(observationTags)
    .innerJoin(tags, eq(observationTags.tagId, tags.id))
    .where(eq(observationTags.observationId, observationId));
  return res;
}

// adds relational data
export async function getFullObservation(observationId: number) {
  const o = await getObservationById(observationId, {
    createdAt: true,
    data: true,
    id: true,
    isDraft: true,
    projectId: true,
    updatedAt: true,
    uploadInProgress: true,
    userId: true,
  });
  if (!o) return null;

  const fileUploadsRes = await getFileUploadsByObservationId(observationId, {
    id: true,
    createdAt: true,
    mimetype: true,
    originalName: true,
  });
  const observationImage = await getObservationImage(observationId);
  const tags = await getObservationTagsByObservationId(observationId);
  let relatedUser = null;
  if (o.userId) {
    relatedUser = await getUserById(o.userId, { id: true, email: true });
  }

  return {
    ...o,
    fileUploads: fileUploadsRes,
    image: observationImage[0]!,
    user: relatedUser ? relatedUser : null,
    tags: tags,
    data: o.data as Record<string, any>,
  } satisfies FullObservation;
}

export async function findObservationTagsInArray(
  tagIds: number[],
  projectId: number,
) {
  const res = await db.query.tags.findMany({
    where: and(eq(tags.projectId, projectId), inArray(tags.id, tagIds)),
    columns: {
      id: true,
    },
  });
  return res.map((x) => x.id);
}

export async function setObservationDraft(
  tx: Transaction,
  observationId: number,
  isDraft: boolean,
) {
  await tx
    .update(observations)
    .set({
      isDraft: isDraft,
      updatedAt: new Date(),
    })
    .where(eq(observations.id, observationId));
}

export function setObservationUploadProgress(
  observationId: number,
  progress: boolean,
) {
  return db
    .update(observations)
    .set({ uploadInProgress: true, updatedAt: new Date() })
    .where(eq(observations.id, observationId));
}

export function deleteObservation(observationId: number) {
  return db.delete(observations).where(eq(observations.id, observationId));
}

export async function searchObservationIds(
  projectId: number,
  start: Date,
  end: Date,
  isDraft: boolean,
): Promise<number[]> {
  return db
    .select({ id: observations.id })
    .from(observations)
    .where(
      and(
        eq(observations.projectId, projectId),
        gte(observations.createdAt, start),
        lte(observations.createdAt, end),
        eq(observations.isDraft, isDraft),
      ),
    )
    .then((r) => r.map((x) => x.id));
}

export async function createObservation(
  userId: number,
  projectId: number,
  data: string,
) {
  return db
    .insert(observations)
    .values({
      userId: userId,
      projectId: projectId,
      isDraft: true,
      data,
    })
    .returning({ id: observations.id })
    .then((x) => x[0]!);
}

export function removeUserFromObservations(userId: number) {
  return db
    .update(observations)
    .set({ userId: null })
    .where(eq(observations.userId, userId));
}
