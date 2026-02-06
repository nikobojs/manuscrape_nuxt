import { eq, inArray } from "drizzle-orm";
import { hash } from "bcrypt";
import { users } from "../drizzle/schema";
import { getProjectAccessesByUserId } from "./projectAccess";
import { getSmallProjects } from "./project";

type UserSelect = Partial<Record<keyof typeof users.$inferSelect, boolean>>;

export async function createUser(
  email: string,
  passwordClear: string,
  saltRounds: number,
) {
  // salt and hash password
  const hashedPassword = await hash(passwordClear, saltRounds);
  return db
    .insert(users)
    .values({
      email: email,
      password: hashedPassword,
      createdAt: new Date(),
    })
    .returning({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .then((x) => x[0]!);

  // const user = await db.user.create({
  //   data: {
  //     email: parsed.email,
  //     password: hashedPassword,
  //   },
  //   select: {
  //     id: true,
  //     email: true,
  //     password: true,
  //     createdAt: true,
  //   },
  // });
}

export async function getUserById<
  T extends Partial<Record<keyof UserSelect, boolean>>,
>(userId: number, select: T) {
  const _user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: select,
  });

  return _user;
}

export async function getUsersByIds<
  T extends Partial<Record<keyof UserSelect, boolean>>,
>(userIds: number[], select: T) {
  const _user = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    columns: select,
  });

  return _user;
}

export async function getUserByEmail<
  T extends Partial<Record<keyof UserSelect, boolean>>,
>(email: string, select: T) {
  const _user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: select,
  });

  return _user;
}

export function deleteUserById(userId: number) {
  return db.delete(users).where(eq(users.id, userId));
}

export async function getFullUserById(userId: number) {
  const user = await getUserById(userId, {
    id: true,
    email: true,
    password: true,
    createdAt: true,
  });

  const accesses = await getProjectAccessesByUserId(userId);

  const projectIds = Array.from(new Set(accesses.map((a) => a.projectId)));
  const projectsRes = await getSmallProjects(projectIds);
  const projectIdMap = Object.groupBy(projectsRes, (x) => x.id);

  const enrichedAccesses = accesses.map(
    (a) =>
      ({
        ...a,
        project: projectIdMap[a.projectId]![0]!,
      }) satisfies ExtendedProjectAccess,
  );

  const enrichedUser = {
    ...user,
    projectAccess: enrichedAccesses,
  };

  return enrichedUser;
}
