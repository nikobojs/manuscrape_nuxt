// TODO: write more tests!


import { describe, test, expect } from 'vitest';
import {
  testProject, withTempUser, withTempProject, deleteObservation,
  createProject, getMe, openProjectPage, inviteToProject,
  signup, freshEmail, createObservation, patchObservation, getObservations, testObservations
} from './helpers';
import { prisma } from './helpers';

describe('Observations', () => {
  test('basic create project + create 3 observations flow works normally', async () =>  {
    await withTempProject(async (user, project, _observations, token) => {
      expect(user.projectAccess.map(a => a.project.id)).toContain(project.id)
    });
  });

  test('invited user cannot patch another users\' observation', async () =>  {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      const createObsRes = await createObservation(token, project.id);
      expect(createObsRes.status).toBe(201);
      const createObsJson = await createObsRes.json();
      expect(createObsJson).toHaveProperty('id');
      const obsId = createObsJson['id'];

      await withTempUser(async (_userB, tokenB) => {
        const inviteRes = await inviteToProject(token, project.id, { email: otherEmail });
        expect(inviteRes.status).toBe(202);

        const patchRes0 = await patchObservation(tokenB, project.id, obsId, {});
        const patchRes1 = await patchObservation(token, project.id, obsId, {});
        expect(patchRes0.status).toBe(403);
        expect(patchRes1.status).toBe(200);
      }, otherEmail)
    });
  });

  test('invited user can only delete its own observations drafts', async () =>  {
    await withTempProject(async (user, project, observations, token) => {
      // expect this observation to be published
      console.log(observations)
      expect(observations[0].isDraft).toBe(false);

      await withTempUser(async (userB, tokenB) => {
        // invite to the project
        const inviteRes = await inviteToProject(token, project.id, { email: userB.email });
        expect(inviteRes.status).toBe(202);

        // delete published observation from other collaborator
        // - expect to fail because it is published and owned by another user
        const deleteRes0 = await deleteObservation(tokenB, project.id, observations[0].id);
        expect(deleteRes0.status).toBe(403);

        // create observation and publish it
        const createObsRes0 = await createObservation(tokenB, project.id);
        expect(createObsRes0.status).toBe(201);
        const createObsJson0 = await createObsRes0.json();
        expect(createObsJson0).toHaveProperty('id');
        const obsId0 = createObsJson0['id'];
        const patchRes = await patchObservation(tokenB, project.id, obsId0, {
          isDraft: false,
          data: {
            'Date time field': new Date().toISOString(),
            'Text field': 'Test text',
          }
        });
        expect(patchRes.status).toBe(200);

        // try delete published observation
        // - expect to fail because invited cannot delete published observations (not even his own)
        const deleteRes1 = await deleteObservation(tokenB, project.id, obsId0);
        expect(deleteRes1.status).toBe(403);

        // create new observation draft and save id
        const createObsRes1 = await createObservation(token, project.id);
        expect(createObsRes1.status).toBe(201);
        const createObsJson = await createObsRes1.json();
        expect(createObsJson).toHaveProperty('id');
        const obsId1 = createObsJson['id'];

        // try delete new observation and expect 200 OK
        const deleteRes2 = await deleteObservation(token, project.id, obsId1);
        expect(deleteRes2.status).toBe(200);
      });

    });
  });

  test('project owner cannot delete drafts of other users', async () =>  {
    await withTempProject(async (user, project, observations, token) => {
      // expect this observation to be published
      console.log(observations)
      expect(observations[0].isDraft).toBe(false);

      await withTempUser(async (userB, tokenB) => {
        // invite to the project
        const inviteRes = await inviteToProject(token, project.id, { email: userB.email });
        expect(inviteRes.status).toBe(202);

        // create observation and publish it
        const createObsRes0 = await createObservation(tokenB, project.id);
        expect(createObsRes0.status).toBe(201);
        const createObsJson0 = await createObsRes0.json();
        expect(createObsJson0).toHaveProperty('id');
        const obsId0 = createObsJson0['id'];

        // try delete observation draft as OWNER - expect to fail
        const deleteRes1 = await deleteObservation(token, project.id, obsId0);
        expect(deleteRes1.status).toBe(403);
      });
    });
  });

  test('invited user can\'t see another users\' observations', async () =>  {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      await withTempUser(async (_userB, tokenB) => {
        const inviteRes = await inviteToProject(token, project.id, { email: otherEmail });
        expect(inviteRes.status).toBe(202);

        let observationRes = await getObservations(tokenB, project.id);
        expect(observationRes.status).toBe(200);
        let observationJson = await observationRes.json();
        expect(Array.isArray(observationJson?.observations));
        expect(observationJson.observations.length).toBe(0);

        const createObsRes = await createObservation(tokenB, project.id);
        expect(createObsRes.status).toBe(201);

        // expect invited cant see other users' observations
        observationRes = await getObservations(tokenB, project.id);
        expect(observationRes.status).toBe(200);
        observationJson = await observationRes.json();
        expect(Array.isArray(observationJson?.observations));
        expect(observationJson.observations.length).toBe(1);

        // expect project owner can see all observations
        observationRes = await getObservations(token, project.id);
        expect(observationRes.status).toBe(200);
        observationJson = await observationRes.json();
        expect(Array.isArray(observationJson?.observations));
        expect(observationJson.observations.length).toBe(testObservations.length + 1);
      }, otherEmail);
    });
  });
});