import { expect } from "vitest";
import { fetch } from "@nuxt/test-utils";
import { daysInFuture } from "../../shared/utils/datetime";
import { db as _db } from "../../server/utils/drizzle";
import {
  projectInvitations,
  projects,
  dynamicProjectFields,
  fileUploads,
  imageUploads,
  users,
  tags,
  observationTags,
  observations,
  projectAccesses,
  projectExports,
  projectFields,
} from "../../server/drizzle/schema";

export const db = _db;

const contentTypeJson = {
  "Content-Type": "application/json",
};

const authHeader = (token: string): HeadersInit => ({
  Authentication: token,
});

export async function login(json: any): Promise<Response> {
  const res = await fetch("/api/auth", {
    method: "POST",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
    },
  });
  return res;
}

export async function signup(json: any): Promise<Response> {
  const res = await fetch("/api/user", {
    method: "POST",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
    },
  });
  return res;
}

export async function patchField(
  token: string,
  projectId: string | number,
  fieldId: string | number,
  json: any,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/fields/${fieldId}`, {
    method: "PATCH",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function createField(
  token: string,
  projectId: string | number,
  json: any,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/fields`, {
    method: "POST",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function deleteField(
  token: string,
  projectId: string | number,
  fieldId: string | number,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/fields/${fieldId}`, {
    method: "DELETE",
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function moveField(
  token: string,
  projectId: string | number,
  fieldId: string | number,
  json: any,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/fields/${fieldId}/move`, {
    method: "PATCH",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function removeCollaborator(
  token: string,
  projectId: string | number,
  userId: string | number,
): Promise<Response> {
  const res = await fetch(
    `/api/projects/${projectId}/collaborators/${userId}`,
    {
      method: "DELETE",
      headers: {
        ...contentTypeJson,
        ...authHeader(token),
      },
    },
  );
  return res;
}

export async function createProject(
  token: string,
  json: any,
): Promise<Response> {
  const res = await fetch("/api/projects", {
    method: "POST",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function patchProject(
  token: string,
  projectId: number,
  json: any,
): Promise<Response> {
  const res = await fetch("/api/projects/" + projectId, {
    method: "PATCH",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function duplicateProject(
  token: string,
  projectId: number,
  json: any,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/duplicate`, {
    method: "POST",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function createObservation(
  token: string,
  projectId: string | number,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/observations`, {
    method: "POST",
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function createDynamicField(
  token: string,
  projectId: string | number,
  json: any,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/dynamic-fields`, {
    method: "POST",
    body: JSON.stringify(json),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function patchObservation(
  token: string,
  projectId: string | number,
  observationId: string | number,
  json: any,
): Promise<Response> {
  const res = await fetch(
    `/api/projects/${projectId}/observations/${observationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(json),
      headers: {
        ...contentTypeJson,
        ...authHeader(token),
      },
    },
  );
  return res;
}

export async function patchCollaborator(
  token: string,
  projectId: string | number,
  collaboratorId: string | number,
  json: any,
): Promise<Response> {
  const res = await fetch(
    `/api/projects/${projectId}/collaborators/${collaboratorId}`,
    {
      method: "PATCH",
      body: JSON.stringify(json),
      headers: {
        ...contentTypeJson,
        ...authHeader(token),
      },
    },
  );
  return res;
}

export async function getMe(token: string): Promise<Response> {
  const res = await fetch("/api/user", {
    method: "GET",
    headers: {
      ...authHeader(token),
    },
  });

  return res;
}

export async function getObservations(
  token: string,
  projectId: number | string,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/observations`, {
    method: "GET",
    headers: {
      ...authHeader(token),
    },
  });

  return res;
}

export async function deleteUser(token: string, body: any): Promise<Response> {
  const res = await fetch("/api/user", {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: {
      ...authHeader(token),
      ...contentTypeJson,
    },
  });

  return res;
}

export async function deleteObservation(
  token: string,
  projectId: number,
  obsId: number,
): Promise<Response> {
  const res = await fetch(`/api/projects/${projectId}/observations/${obsId}`, {
    method: "DELETE",
    headers: {
      ...authHeader(token),
    },
  });

  return res;
}

export async function openProjectPage(token: string, projectId: number) {
  const res = await fetch(`/projects/${projectId}`, {
    headers: {
      ...authHeader(token),
    },
    redirect: "manual",
  });
  return res;
}

export async function openLoginPage(): Promise<Response> {
  const res = await fetch("/login");
  return res;
}

export async function openSignUpPage(): Promise<Response> {
  const res = await fetch("/user/new");
  return res;
}

export async function openIndexPage(): Promise<Response> {
  const res = await fetch("/", { redirect: "manual" });
  return res;
}

export async function expectRedirect(res: Response, to: string): Promise<void> {
  expect(res?.status).toBe(302);
  expect(res?.headers.get("location")).toEqual(to);
}

export async function createTag(token: string, projectId: number, body: any) {
  const res = await fetch(`/api/projects/${projectId}/tags/`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function getTagsInProject(token: string, projectId: number) {
  const res = await fetch(`/api/projects/${projectId}/tags/`, {
    method: "GET",
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function deleteTag(
  token: string,
  tagId: number,
  projectId: number,
) {
  const res = await fetch(`/api/projects/${projectId}/tags/${tagId}`, {
    method: "DELETE",
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function inviteToProject(
  token: string,
  projectId: number,
  body: any,
) {
  const res = await fetch(`/api/projects/${projectId}/collaborators/`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      ...contentTypeJson,
      ...authHeader(token),
    },
  });
  return res;
}

export async function exportProject(
  token: string,
  projectId: number,
  query: any,
) {
  const res = await fetch(
    `/api/projects/${projectId}/exports?${new URLSearchParams(query)}`,
    {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        ...contentTypeJson,
        ...authHeader(token),
      },
    },
  );
  return res;
}

export async function getExports(
  token: string,
  projectId: number | string,
  take = 20,
  skip = 0,
): Promise<Response> {
  const q = new URLSearchParams({
    take: take.toString(),
    skip: skip.toString(),
  });
  const url = `/api/projects/${projectId}/exports?${q}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...authHeader(token),
    },
  });
  return res;
}

export const testProject: NewProjectBody = {
  name: "Temporary test project",
  fields: [
    {
      label: "Begin timestamp",
      type: "DATETIME",
      required: false,
      index: 1,
    },
    {
      label: "End timestamp",
      type: "DATE",
      required: false,
      index: 2,
    },
    {
      label: "Text field",
      type: "STRING",
      required: true,
      index: 3,
    },
    {
      label: "Integer field",
      type: "INT",
      required: false,
      index: 4,
    },
    {
      label: "Float field",
      type: "FLOAT",
      required: false,
      index: 5,
    },
    {
      label: "Free text and autocomplete",
      type: "AUTOCOMPLETE_ADD",
      required: false,
      index: 6,
      choices: ["a", "b", "c"],
    },
    {
      label: "Multiple choice with free text",
      type: "MULTIPLE_CHOICE_ADD",
      required: false,
      index: 7,
      choices: ["a", "b", "c"],
    },
    {
      label: "Check me",
      type: "BOOLEAN",
      required: true,
      index: 8,
    },
  ],
};

export const testObservations = [
  {
    isDraft: false,
    data: {
      "Date time field": new Date().toISOString(),
      "Text field": "Test text",
    },
  },
  {
    isDraft: false,
    data: {
      "Date time field": daysInFuture(-20).toISOString(),
      "Text field": "Another test text",
    },
  },
  {
    isDraft: false,
    data: {
      "Date time field": daysInFuture(26.8).toISOString(),
      "Text field": "A third test text value",
    },
  },
];

let emailIndex = 0;
export const freshEmail = () => `nfb+test${emailIndex++}@codecollective.dk`;

export async function withTempUser(
  callback: (user: CurrentUser, token: string) => Promise<void>,
  email: string | undefined = undefined,
  password: string = "Password123",
): Promise<void> {
  // if email is not defined, set it to some new unique email
  if (email === undefined) {
    email = freshEmail();
  }

  // first, sign up new user
  const signupRes = await signup({
    email,
    password,
  });

  // ensure signup went well, including the token
  expect(signupRes.status).toBe(201);
  const json = await signupRes.json();
  expect(json).toHaveProperty("token");

  // fetch the current user, and save user id into variable 'userId'
  const userRes = await getMe(json.token);
  expect(userRes.status).toBe(200);
  const user = (await userRes.json()) as CurrentUser;
  expect(typeof user.id).toBe("number");

  // call the callback function with the new user and a fresh token
  await callback(user, json.token);
}

export const defaultPassword = "Password123";

export async function withTempProject(
  callback: (
    user: CurrentUser,
    project: FullProject,
    observations: FullObservation[],
    token: string,
  ) => Promise<void>,
  email: string | undefined = undefined,
  password: string = defaultPassword,
  projectOptions?: Record<string, any>,
  createObservations = true,
): Promise<void> {
  // if email is not defined, set it to some new unique email
  if (email === undefined) {
    email = freshEmail();
  }

  // first, sign up new user
  const signupRes = await signup({
    email,
    password,
  });

  // ensure signup went well, including the token
  expect(signupRes.status).toBe(201);
  const json = await signupRes.json();
  expect(json).toHaveProperty("token");

  // create new project
  const projectRes = await createProject(json.token, {
    ...testProject,
    ...projectOptions,
  });

  // ensure project creation went well
  expect(projectRes.status).toBe(201);
  const projectJson = (await projectRes.json()) as FullProject;
  expect(projectJson.id).toBeTypeOf("number");

  // create all test observations
  let observations = [];
  if (createObservations) {
    for (const testObs of testObservations) {
      const obsRes = await createObservation(json.token, projectJson.id);
      expect(obsRes.status).toBe(201);
      const obs = await obsRes.json();
      expect(obs?.id).toBeTypeOf("number");
      const patchRes = await patchObservation(
        json.token,
        projectJson.id,
        obs.id,
        testObs,
      );
      expect(patchRes.status).toBe(200);
    }

    // get all observations in project and test responses
    const observationRes = await getObservations(json.token, projectJson.id);
    expect(observationRes.status).toBe(200);
    const observationsJson = await observationRes.json();
    expect(observationsJson).toHaveProperty("observations");
    expect(Array.isArray(observationsJson.observations)).toBe(true);
    expect(observationsJson.observations.length).toBe(testObservations.length);
    observations = observationsJson.observations;
  }
  // fetch the current user, and check the project is available
  const userRes = await getMe(json.token);
  expect(userRes.status).toBe(200);
  const user = await userRes.json();
  expect(typeof user.id).toBe("number");
  expect(Array.isArray(user?.projectAccess)).toBe(true);
  expect(user?.projectAccess?.length).toBe(1);
  const project = user.projectAccess[0].project;
  expect(project.id).toBe(projectJson.id);

  // call the callback function with the new user and a fresh token
  await callback(user, project, observations, json.token);
}

export const delay = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export async function removeStuff() {
  try {
    console.log("begin delete all data from db..");
    await db.transaction(async (tx) => {
      await tx.delete(tags);
      await tx.delete(projectAccesses);
      await tx.delete(projectExports);
      await tx.delete(projectInvitations);
      await tx.delete(dynamicProjectFields);
      await tx.delete(projectFields);
      await tx.delete(fileUploads);
      await tx.delete(imageUploads);
      await tx.delete(observationTags);
      await tx.delete(observations);
      await tx.delete(projects);
      await tx.delete(users);
    });
    console.log("done delete all");
  } catch (e) {
    console.error(e);
    throw e;
  }
}
