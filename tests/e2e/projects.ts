import { describe, test, expect } from 'vitest';
import { testProject, withTempUser, createProject, getMe, fetchObservations, openProjectPage, inviteToProject, signup } from './helpers';

const wrongIndexes: any[][] = [
  [2,2],
  ['abc'],
  [0,0,0,0,0],
];

const correctedIndexes: number[][] = [
  [1,5,6,2,8],
  [3,5,6,2,8],
  [0,5,6,2,8],
  [1,2,3,4,5],
];

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
          { label: 'asdasd', type: 'INT', required: false, index: 0, },
          { label: 'asdasd', type: 'STRING', required: true, index: 1 },
        ]
      });
      const json = await res.json();
      expect(res.status, json?.statusMessage).toBe(400);
    });
  });

  test('a project with unparsable indexes will return 400', async () =>  {
    await withTempUser(async (_user, token) => {
      for (let i = 0; i < wrongIndexes.length; i++) {
        const index = wrongIndexes[i];

        const newFields = index.map((j) => ({
          label: 'testlabel ' + j * Math.floor(Math.random() *  132), // unique name :S
          type: 'STRING',
          index: j,
          required: false,
        }));

        const newProject = {
          ...testProject,
          name: 'unused name ' + i,
          fields: newFields,
        };

        const res = await createProject(token, newProject);
        const json = await res.json();

        expect(res.status, json?.statusMessage).toBe(400);
      }
    });
  });

  test('a project with wrong indexes, will get the indexes corrected', async () =>  {
    await withTempUser(async (_user, token) => {
      // for each field index list in correctedIndexes
      for (let i = 0; i < correctedIndexes.length; i++) {
        const index = correctedIndexes[i]; // example: [1,5,2,3,4]

        // ensure indexes in test data are valid for this test to have meaning.
        // they need to be unique numbers, because these are correctable by api
        const indexSet = new Set(index);
        expect(index.length).toBe(indexSet.size);

        // - labels should be unique due to correctIndexes having unique values
        // - create valid fields with index correctedIndex[i][j]
        const newFields = index.map((j) => ({
          label: 'testlabel ' + j,
          type: 'STRING',
          index: j,
          required: false,
        }));

        // create valid project with valid fields (but weird indexes)
        const newProject = {
          ...testProject,
          name: 'unused name ' + i,
          fields: newFields,
        };

        // assert project could be created
        const res = await createProject(token, newProject);
        const json = await res.json();
        expect(res.status, json?.statusMessage).toBe(201);

        // retrieve projectId
        expect('id' in json).toBe(true)
        const projectId = json['id'];
        expect(typeof projectId).toBe('number');

        // retrieve project and ensure access
        const meRes = await getMe(token);
        const user = await meRes.json();
        expect(user?.projectAccess?.length).toBeGreaterThan(0);
        const access = user.projectAccess?.find((a: any) => a.project?.id === projectId);
        expect(access).toBeTruthy();
        const project = access.project;
        expect(project).toBeTruthy();

        // retrieve fields
        expect(project?.fields?.length).toBeTypeOf('number');
        expect(project?.fields?.length).toBe(newFields.length);

        // validate field indexes to be sorted and equal to j: [0, 1, 2, 3, ...]
        for (let j = 0; j < project.fields.length; j++) {
          expect(project.fields[j]?.index).toBe(j);
        }
      }
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
        expect(status, text).toBe(302);
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