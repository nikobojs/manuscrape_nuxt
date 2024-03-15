import { describe, test, expect } from 'vitest';
import {
  testProject,
  duplicateProject,
  withTempProject,
  withTempUser,
  createProject,
  getMe,
  openProjectPage,
  defaultPassword,
  getObservations,
  patchProject,
  invite,
  patchField
} from './helpers';

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

  test('user can edit the name of a project', async () =>  {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      expect(project.id).toBeTypeOf('number');

      // patch project with a new name
      const newName = 'edited name 0';
      const updateRes = await patchProject(token, project.id, { name: newName})
      expect(updateRes.status).toBe(200);

      // fetch updated project to verify new name is returned
      const userRes = await getMe(token);
      expect(userRes.status).toBe(200);
      const userJson = await userRes.json();
      expect(typeof userJson.id).toBe("number");
      expect(Array.isArray(userJson?.projectAccess)).toBe(true)
      expect(userJson?.projectAccess?.length).toBe(1);
      const updatedProject = userJson.projectAccess[0].project;

      // verify changes are persistant
      expect(updatedProject.name).toStrictEqual(newName);
    });
  });

  test('user can not edit other user\'s project', async () =>  {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      expect(project.id).toBeTypeOf('number');

      await withTempUser(async (_user, tokenA) => {
        // patch project with a new name
        const newName = 'edited name 0';
        const updateRes = await patchProject(tokenA, project.id, { name: newName})
        expect(updateRes.status).toBe(403);
      });
    });
  });

  test('user can edit delocking settings', async () =>  {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      expect(project.id).toBeTypeOf('number');

      // patch project with a new name
      const updateRes = await patchProject(
        token,
        project.id,
        {
          ownerCanDelockObservations: true,
          authorCanDelockObservations: true,
        },
      );

      expect(updateRes.status).toBe(200);
      const userRes = await getMe(token);
      const userJson = await userRes.json();
      expect(typeof userJson.id).toBe("number");
      expect(Array.isArray(userJson?.projectAccess)).toBe(true)
      expect(userJson?.projectAccess?.length).toBe(1);
      const updatedProject = userJson.projectAccess[0].project;

      // expect settings where updated
      expect(updatedProject.ownerCanDelockObservations).toBe(true);
      expect(updatedProject.authorCanDelockObservations).toBe(true);
    });
  });

  test('collaborator can not edit other user\'s project', async () =>  {
    const collaboratorEmail = 'update-settings-collaborator-0@codecollective.dk';
    await withTempProject(async (user, project, _obs, token) => {
      // invite collaborator
      const inviteRes = await invite(
        token,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);

      // sign up as collaborator
      await withTempUser(async (user2, tokenA) => {
        expect(user2.projectAccess.length).toBe(1);

        // try patch project as collaborator
        const newName = 'edited name 0';
        const updateRes = await patchProject(tokenA, project.id, { name: newName})

        // expect it to fail
        expect(updateRes.status).toBe(403);
      }, collaboratorEmail);
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
      const observationRes = await getObservations(tokenA, projectId);
      expect(observationRes.status).toBe(200);

      // with a new user ensure observations from other project cannot be read
      await withTempUser(async (_userB, tokenB) => {
        const observationRes = await getObservations(tokenB, projectId);
        const observationJson = await observationRes.json();
        expect(Object.keys(observationJson)).not.includes('observations')
        expect(observationRes.status).toBe(403);
      });
    });
  });

  test('project owner can duplicate project with a unique name', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf('number');

      // try duplicate project
      const dupRes = await duplicateProject(
        token,
        projectId,
        { name: 'project-2' },
      );
      const json = await dupRes.json();
      expect(dupRes.status).toBe(201);

      // ensure new project is in response
      // const json = await dupRes.json();
      expect(Object.keys(json)).includes('id', 'Response should have id');
      expect(Object.keys(json)).includes('fields', 'Response should have fields');
      expect(Object.keys(json)).includes('name', 'Response should have name');
      const newProjectId = json.id;
      expect(newProjectId).toBeTypeOf('number');
      expect(json.fields?.length).toBeTypeOf('number')
      expect(json.fields?.length).toBe(project.fields.length);

      // expect project was created
      const meRes = await getMe(token);
      const meJson = await meRes.json();
      expect(meJson.projectAccess.length).toBe(2);

      // expect new project to be in response
      const projectIds = meJson.projectAccess.map((p: any) => p?.project.id)
      const projectNames = meJson.projectAccess.map((p: any) => p?.project.name)
      expect(projectIds).toContain(newProjectId);
      expect(projectNames).toContain('project-1');
      expect(projectNames).toContain('project-2');
    }, undefined, defaultPassword, {
      name: 'project-1'
    });
  });
});