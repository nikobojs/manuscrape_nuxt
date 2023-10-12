// TODO: write more tests!


import { describe, test, expect } from 'vitest';
import { testProject, withTempUser, withTempProject, createProject, getMe, fetchObservations, openProjectPage, inviteToProject, signup, freshEmail, createObservation, patchObservation, getObservations, testObservations } from './helpers';
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