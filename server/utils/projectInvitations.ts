import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { projectInvitations } from "../drizzle/schema";

export async function getProjectInvitationByEmail(
  email: string,
  projectId: number,
  invitationSalt: string,
) {
  const hash = generateInvitationHash(email, invitationSalt);

  const existing = await db.query.projectInvitations.findFirst({
    where: and(
      eq(projectInvitations.emailHash, hash),
      eq(projectInvitations.projectId, projectId),
      gte(projectInvitations.expiresAt, new Date()),
    ),
    columns: {
      createdAt: true,
      emailHash: true,
      expiresAt: true,
      id: true,
      inviterId: true,
      projectId: true,
    },
  });

  return existing;
}

export async function getAllProjectInvitationsByEmail(
  email: string,
  invitationSalt: string,
) {
  const hash = generateInvitationHash(email, invitationSalt);

  const invis = await db.query.projectInvitations.findMany({
    where: and(
      eq(projectInvitations.emailHash, hash),
      gte(projectInvitations.expiresAt, new Date()),
    ),
    columns: {
      createdAt: true,
      emailHash: true,
      expiresAt: true,
      id: true,
      inviterId: true,
      projectId: true,
    },
  });

  return invis;
}

export async function createProjectInvitation(
  email: string,
  expiresAt: Date | string,
  inviterId: number,
  projectId: number,
  invitationSalt: string,
) {
  const emailHash = generateInvitationHash(email, invitationSalt);

  if (typeof expiresAt === "string") {
    expiresAt = new Date(expiresAt);
  }
  return db.insert(projectInvitations).values({
    emailHash,
    expiresAt,
    inviterId,
    projectId,
    createdAt: new Date(),
  });
}

export function deleteProjectInvitations(invitationIds: number[]) {
  return db
    .delete(projectInvitations)
    .where(inArray(projectInvitations.id, invitationIds));
}

export function removeExpiredProjectInvitations() {
  return db
    .delete(projectInvitations)
    .where(lte(projectInvitations.expiresAt, new Date()))
    .returning({ id: projectInvitations.id });
}
