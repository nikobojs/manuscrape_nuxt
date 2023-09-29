import { describe, test, expect } from 'vitest';
import { withTempUser, testProject, deleteUser, createProject, getMe, inviteToProject } from './helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User deletion', async () => {
  test('delete user without token returns 401', async () => {
    // call delete user endpoint and expect it to return 204
    const res = await deleteUser('', { password: 'abcd12345' });
    const text = await res.text();
      expect(res.status, text).toBe(401);
  });

  test('can delete own user', async () => {
    const email = 'nfb+test-0@codecollective.dk';
    const password = 'abcd1234';
    let userId: undefined | number;

    await withTempUser(async (user, token) => {
      expect(user?.email).toBe(email)
      userId = user.id;

      // call delete user endpoint and expect it to return 204
      const res = await deleteUser(token, { password });
      const text = await res.text();
      expect(res.status, text).toBe(204);

      // verify cookie
      // TODO: improve!
      expect(res.headers.getSetCookie().length).toBeGreaterThan(0)
    }, email, password);

    // expect user is deleted in database
    const noUser = await prisma.user.findFirst({
      where: { id: userId },
    });
    expect(noUser).toBe(null);
  });


  test('removes projects with no users attached', async () => {
    const email = 'nfb+test-0@codecollective.dk';
    const password = 'abcd1234';
    let projectId: number | null = null;
    
    // with a temporary user, create project, get project id, delete user
    await withTempUser(async (_user, token) => {
      await createProject(token, testProject);
      const meRes = await getMe(token);
      const json = await meRes.json();
      expect(json?.projectAccess?.length).toBe(1);
      projectId = json?.projectAccess?.[0]?.project?.id;
      expect(typeof projectId).toBe('number');
      const res = await deleteUser(token, { password });
      const text = await res.text();
      expect(res.status, text).toBe(204);
    }, email, password);

    // expect project is deleted from database as well
    expect(typeof projectId).toBe('number');
    const project = await prisma.project.findFirst({ where: { id: projectId! }});
    expect(project).toBe(null);
  });


  test('does not remove projects with users attached', async () => {
    const email = 'nfb+test-0@codecollective.dk';
    const email2 = 'nfb+test-1@codecollective.dk';
    const password = 'abcd1234';
    let projectId: number | null = null;
    
    // create 'userA'
    await withTempUser(async (_userA, tokenA) => {
      // [userA] create new project
      await createProject(tokenA, testProject);

      // [userA] get projectId through getMe-endpoint
      const meRes = await getMe(tokenA);
      const json = await meRes.json();
      expect(json?.projectAccess?.length).toBe(1);
      projectId = json?.projectAccess?.[0]?.project?.id;
      expect(typeof projectId).toBe('number');

      // create 'userB'
      await withTempUser(async (_userB, tokenB) => {

        // [userA] invite userB to the project
        const inviteRes = await inviteToProject(tokenA, projectId!, { email: email2 });
        expect(inviteRes.status).toBe(202);

        // [userA] delete userA
        const res = await deleteUser(tokenA, { password });
        const text = await res.text();
        expect(res.status, text).toBe(204);
      }, email2);
    }, email, password);

    // expect projectId to be number
    expect(typeof projectId).toBe('number');

    // expect that project still exists and has author set to null
    const project = prisma.project.findFirst({
      where: { id: projectId! },
      select: { author: true }
    });
    expect(project).not.toBe(null);
    const author = await project.author();
    expect(author).toBe(null);
  });
});
