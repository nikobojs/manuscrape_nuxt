import { createError } from "h3";
import { and, count, desc, eq, inArray, isNotNull, not } from "drizzle-orm";
import {
  fileUploads,
  imageUploads,
  projectExports,
  users,
} from "../drizzle/schema";

type ProjectExportInsert = Omit<
  Awaited<typeof projectExports.$inferInsert>,
  "id" | "createdAt"
>;
type ProjectExportSelect = Partial<
  Record<keyof typeof projectExports.$inferSelect, boolean>
>;

export type ExportSettings = {
  type: NonNullable<"NVIVO" | "UPLOADS" | "MEDIA" | undefined>;
  startDate: string;
  endDate: string;
  includeTags: NonNullable<boolean | undefined>;
};

export const ProjectExportSelectColumns: Partial<
  Record<keyof ProjectExportSelect, boolean>
> = {
  id: true,
  projectId: true,
  type: true,
  mimetype: true,
  createdAt: true,
  startDate: true,
  endDate: true,
  size: true,
  status: true,
  error: true,
  observationsCount: true,
  userId: true,
};

type ProjectExportReturnType = Pick<
  typeof projectExports._.inferSelect,
  keyof typeof ProjectExportSelectColumns
>;

export async function getProjectExportById<
  T extends Partial<Record<keyof ProjectExportSelect, boolean>>,
>(projectExportId: number, select: T) {
  const projExport = await db.query.projectExports.findFirst({
    where: eq(projectExports.id, projectExportId),
    columns: select,
  });

  return projExport;
}

export async function getProjectExportsByProjectId<
  T extends Partial<Record<keyof ProjectExportSelect, boolean>>,
>(projectId: number, select: T) {
  const exports = await db.query.projectExports.findMany({
    where: and(
      eq(projectExports.projectId, projectId),
      not(eq(projectExports.status, "ERRORED")),
    ),
    columns: select,
  });
  return exports;
}

export async function getProjectExportsGenerating(projectId: number) {
  const res = (await db.query.projectExports.findMany({
    where: and(
      eq(projectExports.projectId, projectId),
      eq(projectExports.status, "GENERATING"),
    ),
    columns: ProjectExportSelectColumns,
    orderBy: desc(projectExports.createdAt),
  })) as ProjectExportReturnType[] satisfies Omit<FullProjectExport, "user">[];
  return addUserToProjectExports(res);
}

export async function getProjectExportsPaginated(
  projectId: number,
  take: number,
  skip: number,
) {
  const page = (await db.query.projectExports.findMany({
    columns: ProjectExportSelectColumns,
    where: and(
      eq(projectExports.projectId, projectId),
      not(eq(projectExports.status, "ERRORED")),
      isNotNull(projectExports.userId),
    ),
    orderBy: desc(projectExports.createdAt),
    offset: skip,
    limit: take,
  })) as ProjectExportReturnType[] satisfies Omit<FullProjectExport, "user">[];

  return addUserToProjectExports(page);
}

export async function addUserToProjectExports(
  exp: Omit<FullProjectExport, "user">[],
) {
  const userIds: number[] = exp.map((p) => p.userId as number);
  const _users = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: {
      id: true,
      email: true,
      name: true,
    },
  });

  const fullExports: FullProjectExport[] = [];
  for (const p of exp) {
    const u = _users.find((_u) => _u.id === p.userId)!;
    const full: FullProjectExport = { ...p, user: u };
    fullExports.push(full);
  }

  return fullExports;
}

export async function ensureExportHasData(
  observationIds: number[],
  config: ExportSettings,
) {
  if (observationIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "There are no observations in this project within the given time interval",
    });
  }
  let res: { count: number }[] = [];
  if (config.type === "MEDIA") {
    res = await db
      .select({ count: count(imageUploads.id) })
      .from(imageUploads)
      .where(inArray(imageUploads.observationId, observationIds));
  } else if (config.type === "NVIVO") {
  } else if (config.type === "UPLOADS") {
    res = await db
      .select({ count: count(fileUploads.id) })
      .from(fileUploads)
      .where(inArray(fileUploads.observationId, observationIds));
  }

  if (res.length === 0 && ["MEDIA", "UPLOADS"].includes(config.type)) {
    throw createError({
      statusCode: 400,
      message:
        config.type === "UPLOADS"
          ? "There are no files to download"
          : "There are no observation images to download",
    });
  }
}

export async function deleteProjectExport(exportId: number) {
  await db.delete(projectExports).where(eq(projectExports.id, exportId));
}

export function removeUserFromProjectExports(userId: number) {
  return db
    .update(projectExports)
    .set({ userId })
    .where(eq(projectExports.userId, userId));
}
