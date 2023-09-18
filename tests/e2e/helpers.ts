import { expect } from "vitest";
import { fetch } from "@nuxt/test-utils";

const contentTypeJson = {
  "Content-Type": "application/json",
};

const authHeader = (token: string) => ({
  "Authentication": token,
});

export async function login(json: any): Promise<Response> {
  const res = await fetch(
    "/api/auth",
    {
      method: "POST",
      body: JSON.stringify(json),
      headers: {
        ...contentTypeJson,
      },
    },
  );
  return res;
}

export async function signup(json: any): Promise<Response> {
  const res = await fetch(
    "/api/user",
    {
      method: "POST",
      body: JSON.stringify(json),
      headers: {
        ...contentTypeJson,
      },
    },
  );
  return res;
}

export async function createProject(
  token: string,
  json: any,
): Promise<Response> {
  const res = await fetch(
    "/api/projects",
    {
      method: "POST",
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
  const res = await fetch(
    "/api/user",
    {
      method: "GET",
      headers: {
        ...authHeader(token),
      },
    },
  );

  return res;
}

export async function fetchObservations(
  token: string,
  projectId: number,
): Promise<Response> {
  const res = await fetch(
    "/api/projects/" + projectId + "/observations",
    {
      method: "GET",
      headers: {
        ...authHeader(token),
      },
    },
  );

  return res;
}

export async function openProjectPage(token: string, projectId: number) {
  const res = await fetch(
    `/projects/${projectId}`,
    {
      headers: {
        ...authHeader(token),
      },
      redirect: 'manual',
    },
  );
  return res;
}

export async function openLoginPage(): Promise<Response> {
  const res = await fetch('/login');
  return res;
}

export async function openSignUpPage(): Promise<Response> {
  const res = await fetch('/user/new');
  return res;
}

export async function openIndexPage(): Promise<Response> {
  const res = await fetch('/', { redirect: 'manual' });
  return res;
}

export async function expectRedirect(res: Response, to: string) {
  expect(res?.status).toBe(302);
  expect(res?.headers.get("location")).toEqual(to);
}

let emailIndex = 0;
const freshEmail = () => `nfb+test${emailIndex++}@codecollective.dk`;

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
