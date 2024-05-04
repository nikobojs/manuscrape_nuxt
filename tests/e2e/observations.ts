// TODO: write more tests!


import { describe, test, expect } from 'vitest';
import {
  withTempUser, withTempProject, deleteObservation, inviteToProject, freshEmail,
  createObservation, patchObservation, getObservations, testObservations, patchProject
} from './helpers';

describe('Observations', () => {
  test('basic create project + create 3 observations flow works normally', async () =>  {
    await withTempProject(async (user, project, observations, token) => {
      expect(user.projectAccess.map(a => a.project.id)).toContain(project.id)
      expect(observations.length).toBe(3);
    });
  });

  test('delocking observations as collaborator respects project settings', async () =>  {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      expect(project.authorCanDelockObservations).toBe(false);
      expect(project.ownerCanDelockObservations).toBe(false);

      await withTempUser(async (_userB, tokenCollaborator) => {
        const inviteRes = await inviteToProject(token, project.id, { email: otherEmail });
        expect(inviteRes.status).toBe(202);

        // create new observation
        const createObsRes = await createObservation(tokenCollaborator, project.id);
        expect(createObsRes.status).toBe(201);
        const createObsJson = await createObsRes.json();
        expect(createObsJson).toHaveProperty('id');
        const obsId = createObsJson['id'];

        // publish observation and expect it to go well
        const publishRes = await patchObservation(tokenCollaborator, project.id, obsId, { isDraft: false });
        const publishJson = await publishRes.json();
        expect(publishRes.status, JSON.stringify(publishJson)).toBe(200);

        // expect observation is published
        const updatedObsRes = await getObservations(token, project.id);
        const updatedObsJson = await updatedObsRes.json();
        expect(Array.isArray(updatedObsJson.observations), updatedObsJson).toBe(true)
        const updatedObs = updatedObsJson.observations.find((o: any) => o.id === createObsJson.id)
        expect(updatedObs).toBeTruthy();
        expect(updatedObs.isDraft).toBe(false);

        // try to set isDraft=true (aka delock) the observation
        // should fail because project.authorCanDelockObservation == false
        const patchRes0 = await patchObservation(tokenCollaborator, project.id, obsId, {
          isDraft: true,
        });
        expect(patchRes0.status).toBe(403);

        // change rule as the project owner, to make delocking possible for collaborators
        const patchProjectRes = await patchProject(token, project.id, {
          authorCanDelockObservations: true,
        });
        expect(patchProjectRes.status).toBe(200);

        // try to set isDraft=faiwtruelse (aka delock) the observation
        // should work now because project.authorCanDelockObservation == true
        const patchRes1 = await patchObservation(tokenCollaborator, project.id, obsId, {
          isDraft: true,
        });
        const patchRes1Json = await patchRes1.json();
        expect(patchRes1.status, JSON.stringify(patchRes1Json)).toBe(200);
      }, otherEmail)
    });
  });

  test('delocking observations as owner respects project settings', async () =>  {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      expect(project.authorCanDelockObservations).toBe(false);
      expect(project.ownerCanDelockObservations).toBe(false);
      const inviteRes = await inviteToProject(token, project.id, { email: otherEmail });
      expect(inviteRes.status).toBe(201);

      await withTempUser(async (_userB, tokenCollaborator) => {
        // create new observation
        const createObsRes = await createObservation(tokenCollaborator, project.id);
        expect(createObsRes.status).toBe(201);
        const createObsJson = await createObsRes.json();
        expect(createObsJson).toHaveProperty('id');
        const obsId = createObsJson['id'];

        // publish observation and expect it to go well
        const publishRes = await patchObservation(tokenCollaborator, project.id, obsId, { isDraft: false });
        const publishJson = await publishRes.json();
        expect(publishRes.status, JSON.stringify(publishJson)).toBe(200);

        // delock observation as owner - expected to fail due to ownerCanDelockObservations == false
        const delock0Res = await patchObservation(token, project.id, obsId, { isDraft: true });
        const delock0Json = await delock0Res.json();
        expect(delock0Res.status, JSON.stringify(delock0Json)).toBe(403);

        // change rule as the project owner, to make delocking possible for owners
        const patchProjectRes = await patchProject(token, project.id, {
          ownerCanDelockObservations: true,
        });
        expect(patchProjectRes.status).toBe(200);

        // delock observation as owner - expected to work because ownerCanDelockObservations == false
        const delock1Res = await patchObservation(token, project.id, obsId, { isDraft: true });
        const delock1Json = await delock1Res.json();
        expect(delock1Res.status, JSON.stringify(delock1Json)).toBe(200);
      }, otherEmail);
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