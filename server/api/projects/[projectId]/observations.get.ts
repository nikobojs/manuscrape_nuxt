import { numberBetween } from "#shared/utils/validate";
import { extractTagsFromObservation } from "#shared/utils/extractTagsFromObservation";
import { and, asc, count, desc, eq, SQL } from "drizzle-orm";
import { observations, users } from "~~/server/drizzle/schema";
import { getFullObservationsByProjectId } from "~~/server/utils/observations";
import { captureException } from "@sentry/node";

export default safeResponseHandler(async (event) => {
  // require login
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  // fetch project access object from db
  const projectId = parseIntParam(event.context.params?.projectId);
  const projectAccess = await ensureProjectAccess(user.id, projectId);

  // require access to project
  if (!projectAccess) {
    const errMsg = `User ${user.id} requested access to observations they don't have access to`;
    captureException(errMsg);
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have access to this project",
    });
  }

  const project = await getProjectById(projectId, {
    contributorsCanReadAllObservations: true,
  });

  // define helper variables
  const isOwner = projectAccess.role === "OWNER";

  // define all query parameters
  // TODO: decrease amount of code somehow
  const take = queryParam<number>({
    name: "take",
    event: event,
    defaultValue: 10,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(1, 21),
    required: true,
  }) as number;
  const skip = queryParam<number>({
    name: "skip",
    event: event,
    defaultValue: 0,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(0, 1999999999),
    required: true,
  }) as number;
  const orderDirection = queryParam<"asc" | "desc">({
    name: "orderDirection",
    event: event,
    defaultValue: "desc",
    parse: (v) => v as "asc" | "desc",
    validate: (v) => ["asc", "desc"].includes(v),
    required: true,
  });
  const orderBy = queryParam<"user" | "createdAt" | "id">({
    name: "orderBy",
    event: event,
    defaultValue: "createdAt",
    parse: (v) => v as "user" | "createdAt" | "id",
    validate: (v) => ["user", "createdAt", "id"].includes(v),
    required: true,
  });
  const filter = queryParam<"all" | "published" | "drafts">({
    name: "filter",
    event: event,
    defaultValue: "all",
    parse: (v: string) => v as "all" | "published" | "drafts",
    validate: (v) => ["all", "published", "drafts"].includes(v),
    required: true,
  });
  const ownership = queryParam<"me" | "everyone">({
    name: "ownership",
    event: event,
    defaultValue: "everyone",
    parse: (v: string) => v as "me" | "everyone",
    validate: (v) => ["me", "everyone"].includes(v),
    required: true,
  });

  // create initial observation where statement
  const whereAnd: SQL<unknown>[] = [eq(observations.projectId, projectId)];

  // set observation ownership filter in where statement
  // NOTE: only allow project OWNER to see everyone's observations
  if (
    ownership === "me" ||
    (!isOwner && !project?.contributorsCanReadAllObservations)
  ) {
    // whereStatement.userId = event.context.user.id;
    whereAnd.push(eq(observations.userId, event.context.user.id));
  }

  // set published/drafts/all filter in where statement
  if (filter === "drafts") {
    // whereStatement.isDraft = true;
    whereAnd.push(eq(observations.isDraft, true));
  } else if (filter === "published") {
    // whereStatement.isDraft = false;
    whereAnd.push(eq(observations.isDraft, false));
  }

  // create order by / sorting statement
  const orderFn = orderDirection === "asc" ? asc : desc;
  const orderByStatement =
    orderBy === "createdAt"
      ? orderFn(observations.createdAt)
      : orderBy === "user"
        ? orderFn(users.email)
        : orderFn(observations.id);

  const total = (
    await db
      .select({ count: count(observations.id) })
      .from(observations)
      .where(and(...whereAnd))
  )[0]!.count;
  const totalDraft = (
    await db
      .select({ count: count(observations.id) })
      .from(observations)
      .where(and(...whereAnd, eq(observations.isDraft, true)))
  )[0]!.count;

  const whereStatement = and(...whereAnd)!;
  // make the call
  const result = await getFullObservationsByProjectId(
    whereStatement,
    orderByStatement,
    skip,
    take,
  );

  // deprecated but working prisma query
  // const result = await db.observation.findMany({
  //   take,
  //   skip,
  //   where: whereStatement,
  //   select: observationColumns,
  //   orderBy: orderByStatement,
  // });

  // return the data!
  return {
    observations: result.map((obs) => extractTagsFromObservation(obs)),
    total,
    totalDraft,
  };
});
