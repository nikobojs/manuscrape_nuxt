import { describe, test, expect } from 'vitest';
import { testProject, withTempUser, createProject, getMe, fetchObservations, openProjectPage } from './helpers';

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
});