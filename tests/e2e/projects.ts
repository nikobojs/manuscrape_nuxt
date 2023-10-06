import { describe, test, expect } from 'vitest';
import { testProject, withTempUser, createProject, getMe, fetchObservations, openProjectPage, inviteToProject, signup } from './helpers';
import { prisma } from './helpers';

describe('Project management', () => {
  test('user can create project', async () =>  {
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, testProject);
      const json = await res.json();
      expect(res.status, json?.statusMessage).toBe(201);
    });
  });

  test('user cannot create project with 2 fields with same label', async () =>  {
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, {
        ...testProject,
        name: 'unused name 0',
        fields: [
          { label: 'asdasd', type: 'INT', required: false, },
          { label: 'asdasd', type: 'STRING', required: true },
        ]
      });
      const json = await res.json();
      expect(res.status, json?.statusMessage).toBe(400);
    });
  });

  test('user cannot access other users project page', async () =>  {
    await withTempUser(async (_userA, tokenA) => {
      // create project
      const projectRes = await createProject(tokenA, testProject);
      const projectJson = await projectRes.json();
      expect(projectRes.status, projectJson?.statusMessage).toBe(201);

      // expect project was created
      const meRes = await getMe(tokenA);
      const meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(1);

      // retrieve project details
      const projectId = meJson.projectAccess[0].project?.id;
      expect(typeof projectId).toBe('number');

      // ensure user can now access project page
      const res = await openProjectPage(tokenA, projectId);
      expect(res.status).toBe(200);

      // with a new user ensure observations from other project cannot be read
      await withTempUser(async (_userB, tokenB) => {
        const res = await openProjectPage(tokenB, projectId);
        const { status, headers } = res;
        const text = await res.text();
        expect(status).toBe(302);
        expect(headers.get('location')).toBe('/');
      });
    });
  });

  test('user cannot access other users project endpoint', async () =>  {
    await withTempUser(async (_userA, tokenA) => {
      // expect user has no projects yet
      let meRes = await getMe(tokenA);
      let meJson: CurrentUser = await meRes.json();
      expect(meJson.projectAccess.length).toBe(0);

      // create project
      const projectRes = await createProject(tokenA, testProject);
      const projectJson = await projectRes.json();
      expect(projectRes.status, projectJson?.statusMessage).toBe(201);

      // expect project was created
      meRes = await getMe(tokenA);
      meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(1);

      // retrieve project details
      const projectId = meJson.projectAccess[0].project?.id;
      expect(typeof projectId).toBe('number');

      // ensure observations can be fetched
      const observationRes = await fetchObservations(tokenA, projectId);
      expect(observationRes.status).toBe(200);

      // with a new user ensure observations from other project cannot be read
      await withTempUser(async (_userB, tokenB) => {
        const observationRes = await fetchObservations(tokenB, projectId);
        const observationJson = await observationRes.json();
        expect(Object.keys(observationJson)).not.includes('observations')
        expect(observationRes.status).toBe(403);
      });
    });
  });

  test('invitations are accepted if user exists', async () =>  {
    await withTempUser(async (_userA, tokenA) => {
      // expect user has no projects yet
      let meRes = await getMe(tokenA);
      let meJson: CurrentUser = await meRes.json();
      expect(meJson.projectAccess.length).toBe(0);

      // create project
      const projectRes = await createProject(tokenA, testProject);
      const projectJson = await projectRes.json();
      expect(projectRes.status, projectJson?.statusMessage).toBe(201);

      // expect project was created
      meRes = await getMe(tokenA);
      meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(1);

      // retrieve project details
      const projectId = meJson.projectAccess[0].project?.id;
      expect(typeof projectId).toBe('number');

      // get length of invitations (to assert that none will be created)
      const invCountBefore = await prisma.projectInvitation.count()

      // create new user and invite him to project
      await withTempUser(async (_userB) => {
        const res = await inviteToProject(tokenA, projectId, { email: _userB.email });
        expect(res.status).toBe(202);

        // get length of invitations again (to assert that none is created)
        const invCountAfter = await prisma.projectInvitation.count()
        expect(invCountBefore).toBe(invCountAfter)
      });
    });
  });

  test('invitations are created if user does not exist', async () =>  {
    const nonExistingEmail = 'hi+sd98s9u3uf8h@codecollective.dk';
    await withTempUser(async (_userA, tokenA) => {
      // expect user has no projects yet
      let meRes = await getMe(tokenA);
      let meJson: CurrentUser = await meRes.json();
      expect(meJson.projectAccess.length).toBe(0);

      // create project
      const projectRes = await createProject(tokenA, testProject);
      const projectJson = await projectRes.json();
      expect(projectRes.status, projectJson?.statusMessage).toBe(201);

      // expect project was created
      meRes = await getMe(tokenA);
      meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(1);

      // retrieve project details
      const projectId = meJson.projectAccess[0].project?.id;
      expect(typeof projectId).toBe('number');

      // get length of invitations (to assert that one is created later)
      const invCountBefore = await prisma.projectInvitation.count()

      // create invitation to non-existing user
      const res = await inviteToProject(tokenA, projectId, { email: nonExistingEmail });
      expect(res.status).toBe(201);

      // get length of invitations again (to assert it was created)
      const invCountAfter = await prisma.projectInvitation.count()
      expect(invCountBefore).toBe(invCountAfter - 1);
    });
  });


  test('acceptance of project invitations works as expected', async () =>  {
    const nonExistingEmail = 'hi+h93mdlsm4ngid@codecollective.dk';
    await withTempUser(async (_userA, tokenA) => {
      // expect user has no projects yet
      let meRes = await getMe(tokenA);
      let meJson: CurrentUser = await meRes.json();
      expect(meJson.projectAccess.length).toBe(0);

      // create project
      const projectRes = await createProject(tokenA, testProject);
      const projectJson = await projectRes.json();
      expect(projectRes.status, projectJson?.statusMessage).toBe(201);

      // expect project was created
      meRes = await getMe(tokenA);
      meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(1);

      // retrieve project details
      const projectId = meJson.projectAccess[0].project?.id;
      expect(typeof projectId).toBe('number');

      // create invitation to non-existing user
      const inviteRes = await inviteToProject(tokenA, projectId, { email: nonExistingEmail });
      expect(inviteRes.status).toBe(201);

      const signupRes = await signup({
        email: nonExistingEmail,
        password: 'abcdefg1234567!',
      });
      expect(signupRes.status).toBe(201);
      const json = await signupRes.json();
      expect(Object.keys(json)).toContain('token');
      expect(json['token']).toBeTruthy();

      meRes = await getMe(json['token']);
      expect(meRes.status).toBe(200);
      const me = await meRes.json();
      expect(me.projectAccess?.length).toBe(1);
      expect(me.projectAccess[0].project?.id).toBe(projectId);
    });
  });

  test('the same email cannot be invited twice to project', async () =>  {
    const nonExistingEmail = 'hi+bbudmjym4ngjhdksnc@codecollective.dk';
    await withTempUser(async (_userA, tokenA) => {
      // expect user has no projects yet
      let meRes = await getMe(tokenA);
      let meJson: CurrentUser = await meRes.json();
      expect(meJson.projectAccess.length).toBe(0);

      // create project
      const projectRes = await createProject(tokenA, testProject);
      const projectJson = await projectRes.json();
      expect(projectRes.status, projectJson?.statusMessage).toBe(201);

      // expect project was created
      meRes = await getMe(tokenA);
      meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(1);

      // retrieve project details
      const projectId = meJson.projectAccess[0].project?.id;
      expect(typeof projectId).toBe('number');

      // create invitation to non-existing user
      let inviteRes = await inviteToProject(tokenA, projectId, { email: nonExistingEmail });
      expect(inviteRes.status).toBe(201);
    
      // do it again and assert it returns 400
      inviteRes = await inviteToProject(tokenA, projectId, { email: nonExistingEmail });
      expect(inviteRes.status).toBe(409);
    });
  });
});