// TODO: write more tests!

import { describe, test, expect } from "vitest";
import {
  withTempUser,
  withTempProject,
  deleteObservation,
  inviteToProject,
  freshEmail,
  createObservation,
  patchObservation,
  getObservations,
  getAdjacentObservations,
  testObservations,
  patchProject,
  countExportedObservations,
} from "./helpers";

describe("Observations", () => {
  test("basic create project + create 3 observations flow works normally", async () => {
    await withTempProject(async (user, project, observations, token) => {
      expect(user.projectAccess.map((a) => a.project.id)).toContain(project.id);
      expect(observations.length).toBe(3);
    });
  });

  test("delocking observations as collaborator respects project settings", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      expect(project.authorCanDelockObservations).toBe(false);
      expect(project.ownerCanDelockObservations).toBe(false);

      await withTempUser(async (_userB, tokenCollaborator) => {
        const inviteRes = await inviteToProject(token, project.id, {
          email: otherEmail,
        });
        expect(inviteRes.status).toBe(202);

        // create new observation
        const createObsRes = await createObservation(
          tokenCollaborator,
          project.id,
        );
        expect(createObsRes.status).toBe(201);
        const createObsJson = await createObsRes.json();
        expect(createObsJson).toHaveProperty("id");
        const obsId = createObsJson["id"];

        // publish observation and expect it to go well
        const publishRes = await patchObservation(
          tokenCollaborator,
          project.id,
          obsId,
          { isDraft: false },
        );
        const publishJson = await publishRes.json();
        expect(publishRes.status, JSON.stringify(publishJson)).toBe(200);

        // expect observation is published
        const updatedObsRes = await getObservations(token, project.id);
        const updatedObsJson = await updatedObsRes.json();
        expect(Array.isArray(updatedObsJson.observations), updatedObsJson).toBe(
          true,
        );
        const updatedObs = updatedObsJson.observations.find(
          (o: any) => o.id === createObsJson.id,
        );
        expect(updatedObs).toBeTruthy();
        expect(updatedObs.isDraft).toBe(false);

        // try to set isDraft=true (aka delock) the observation
        // should fail because project.authorCanDelockObservation == false
        const patchRes0 = await patchObservation(
          tokenCollaborator,
          project.id,
          obsId,
          {
            isDraft: true,
          },
        );
        expect(patchRes0.status).toBe(403);

        // change rule as the project owner, to make delocking possible for collaborators
        const patchProjectRes = await patchProject(token, project.id, {
          authorCanDelockObservations: true,
        });
        expect(patchProjectRes.status).toBe(204);

        // try to set isDraft=faiwtruelse (aka delock) the observation
        // should work now because project.authorCanDelockObservation == true
        const patchRes1 = await patchObservation(
          tokenCollaborator,
          project.id,
          obsId,
          {
            isDraft: true,
          },
        );
        const patchRes1Json = await patchRes1.json();
        expect(patchRes1.status, JSON.stringify(patchRes1Json)).toBe(200);
      }, otherEmail);
    });
  });

  test("delocking observations as owner respects project settings", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      expect(project.authorCanDelockObservations).toBe(false);
      expect(project.ownerCanDelockObservations).toBe(false);
      const inviteRes = await inviteToProject(token, project.id, {
        email: otherEmail,
      });
      expect(inviteRes.status).toBe(201);

      await withTempUser(async (_userB, tokenCollaborator) => {
        // create new observation
        const createObsRes = await createObservation(
          tokenCollaborator,
          project.id,
        );
        expect(createObsRes.status).toBe(201);
        const createObsJson = await createObsRes.json();
        expect(createObsJson).toHaveProperty("id");
        const obsId = createObsJson["id"];

        // publish observation and expect it to go well
        const publishRes = await patchObservation(
          tokenCollaborator,
          project.id,
          obsId,
          { isDraft: false },
        );
        const publishJson = await publishRes.json();
        expect(publishRes.status, JSON.stringify(publishJson)).toBe(200);

        // delock observation as owner - expected to fail due to ownerCanDelockObservations == false
        const delock0Res = await patchObservation(token, project.id, obsId, {
          isDraft: true,
        });
        const delock0Json = await delock0Res.json();
        expect(delock0Res.status, JSON.stringify(delock0Json)).toBe(403);

        // change rule as the project owner, to make delocking possible for owners
        const patchProjectRes = await patchProject(token, project.id, {
          ownerCanDelockObservations: true,
        });
        expect(patchProjectRes.status).toBe(204);

        // delock observation as owner - expected to work because ownerCanDelockObservations == false
        const delock1Res = await patchObservation(token, project.id, obsId, {
          isDraft: true,
        });
        const delock1Json = await delock1Res.json();
        expect(delock1Res.status, JSON.stringify(delock1Json)).toBe(200);
      }, otherEmail);
    });
  });

  test("invited user cannot patch another users' observation", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, token) => {
      const createObsRes = await createObservation(token, project.id);
      expect(createObsRes.status).toBe(201);
      const createObsJson = await createObsRes.json();
      expect(createObsJson).toHaveProperty("id");
      const obsId = createObsJson["id"];

      await withTempUser(async (_userB, tokenB) => {
        const inviteRes = await inviteToProject(token, project.id, {
          email: otherEmail,
        });
        expect(inviteRes.status).toBe(202);

        const patchRes0 = await patchObservation(tokenB, project.id, obsId, {});
        const patchRes1 = await patchObservation(token, project.id, obsId, {});
        expect(patchRes0.status).toBe(403);
        expect(patchRes1.status).toBe(200);
      }, otherEmail);
    });
  });

  test("invited user can only delete its own observations drafts", async () => {
    await withTempProject(async (user, project, observations, token) => {
      // expect this observation to be published
      expect(observations.length).greaterThan(0);
      expect(observations[0]!.isDraft).toBe(false);

      await withTempUser(async (userB, tokenB) => {
        // invite to the project
        const inviteRes = await inviteToProject(token, project.id, {
          email: userB.email,
        });
        expect(inviteRes.status).toBe(202);

        // delete published observation from other collaborator
        // - expect to fail because it is published and owned by another user
        const deleteRes0 = await deleteObservation(
          tokenB,
          project.id,
          observations[0]!.id,
        );
        expect(deleteRes0.status).toBe(403);

        // create observation and publish it
        const createObsRes0 = await createObservation(tokenB, project.id);
        expect(createObsRes0.status).toBe(201);
        const createObsJson0 = await createObsRes0.json();
        expect(createObsJson0).toHaveProperty("id");
        const obsId0 = createObsJson0["id"];
        const patchRes = await patchObservation(tokenB, project.id, obsId0, {
          isDraft: false,
          data: {
            "Date time field": new Date().toISOString(),
            "Text field": "Test text",
          },
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
        expect(createObsJson).toHaveProperty("id");
        const obsId1 = createObsJson["id"];

        // try delete new observation and expect 200 OK
        const deleteRes2 = await deleteObservation(token, project.id, obsId1);
        expect(deleteRes2.status).toBe(200);
      });
    });
  });

  test("project owner cannot delete drafts of other users", async () => {
    await withTempProject(async (user, project, observations, token) => {
      // expect this observation to be published
      expect(observations.length).greaterThan(0);
      expect(observations[0]!.isDraft).toBe(false);

      await withTempUser(async (userB, tokenB) => {
        // invite to the project
        const inviteRes = await inviteToProject(token, project.id, {
          email: userB.email,
        });
        expect(inviteRes.status).toBe(202);

        // create observation
        const createObsRes0 = await createObservation(tokenB, project.id);
        expect(createObsRes0.status).toBe(201);
        const createObsJson0 = await createObsRes0.json();
        expect(createObsJson0).toHaveProperty("id");
        const obsId0 = createObsJson0["id"];

        // try delete observation draft as OWNER - expect to fail
        const deleteRes1 = await deleteObservation(token, project.id, obsId0);
        expect(deleteRes1.status).toBe(403);
      });
    });
  });

  test("invited user can't see another users' observations", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, _observations, tokenA) => {
      await withTempUser(async (_userB, tokenB) => {
        const inviteRes = await inviteToProject(tokenA, project.id, {
          email: otherEmail,
        });
        expect(inviteRes.status).toBe(202);

        let observationRes = await getObservations(tokenB, project.id);
        expect(observationRes.status).toBe(200);
        let observationJson = await observationRes.json();
        expect(Array.isArray(observationJson?.observations));
        expect(observationJson.observations.length).toBe(0);

        const createObsRes = await createObservation(tokenA, project.id);
        expect(createObsRes.status).toBe(201);

        // expect invited cant see other users' observations
        observationRes = await getObservations(tokenB, project.id);
        expect(observationRes.status).toBe(200);
        observationJson = await observationRes.json();
        expect(Array.isArray(observationJson?.observations));
        expect(observationJson.observations.length).toBe(0);

        // expect project owner can see all observations
        observationRes = await getObservations(tokenA, project.id);
        expect(observationRes.status).toBe(200);
        observationJson = await observationRes.json();
        expect(Array.isArray(observationJson?.observations));
        expect(observationJson.observations.length).toBe(
          testObservations.length + 1,
        );
      }, otherEmail);
    });
  });

  test("user can fetch observation count endpoint", async () => {
    await withTempProject(async (user, project, observations, token) => {
      expect(observations.length).greaterThan(0);
      const countRes = await countExportedObservations(token, project.id, {
        includeTags: true,
        startDate: "1970-01-01",
        endDate: "3333-09-01",
        type: "NVIVO",
      });
      expect(countRes.status).toBe(200);
      const json = await countRes.json();
      expect(Object.keys(json)).toContain("observationCount");
      expect(Object.keys(json)).toContain("imageCount");
      expect(Object.keys(json)).toContain("uploadsCount");
      expect(json["observationCount"]).toEqual(observations.length);
    });
  });

  test("uninvited user cannot fetch observation count", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, observations, tokenA) => {
      await withTempUser(async (_userB, tokenB) => {
        expect(observations.length).greaterThan(0);
        const countResA = await countExportedObservations(tokenA, project.id, {
          includeTags: true,
          startDate: "1970-01-01",
          endDate: "3333-09-01",
          type: "NVIVO",
        });
        const countResB = await countExportedObservations(tokenB, project.id, {
          includeTags: true,
          startDate: "1970-01-01",
          endDate: "3333-09-01",
          type: "NVIVO",
        });
        expect(countResA.status).toBe(200);
        expect(countResB.status).toBe(403);
        const jsonA = await countResA.json();
        const jsonB = await countResB.json();
        expect(Object.keys(jsonA)).toContain("observationCount");
        expect(Object.keys(jsonA)).toContain("imageCount");
        expect(Object.keys(jsonA)).toContain("uploadsCount");
        expect(jsonA["observationCount"]).toEqual(observations.length);
      }, otherEmail);
    });
  });

  test("invited user can fetch observation count", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, observations, tokenA) => {
      await withTempUser(async (_userB, tokenB) => {
        const inviteRes = await inviteToProject(tokenA, project.id, {
          email: otherEmail,
        });
        expect(inviteRes.status).toBe(202);
        const countResA = await countExportedObservations(tokenA, project.id, {
          includeTags: true,
          startDate: "1970-01-01",
          endDate: "3333-09-01",
          type: "NVIVO",
        });
        const countResB = await countExportedObservations(tokenB, project.id, {
          includeTags: true,
          startDate: "1970-01-01",
          endDate: "3333-09-01",
          type: "NVIVO",
        });
        expect(countResA.status).toBe(200);
        expect(countResB.status).toBe(200);
        const jsonA = await countResA.json();
        const jsonB = await countResB.json();
        expect(Object.keys(jsonA)).toContain("observationCount");
        expect(Object.keys(jsonA)).toContain("imageCount");
        expect(Object.keys(jsonA)).toContain("uploadsCount");
        expect(jsonA["observationCount"]).toEqual(observations.length);
        expect(Object.keys(jsonB)).toContain("observationCount");
        expect(Object.keys(jsonB)).toContain("imageCount");
        expect(Object.keys(jsonB)).toContain("uploadsCount");
        expect(jsonB["observationCount"]).toEqual(observations.length);
      }, otherEmail);
    });
  });

  test("adjacent endpoint returns prev and next observation IDs", async () => {
    await withTempProject(async (_user, project, observations, token) => {
      // withTempProject creates 3 observations. Sort them by id to know the order.
      const sortedObs = [...observations].sort((a, b) => a.id - b.id);
      const oldest = sortedObs[0]!;
      const middle = sortedObs[1]!;
      const newest = sortedObs[2]!;

      // Middle observation: should have prev (older) and next (newer)
      const middleRes = await getAdjacentObservations(token, project.id, middle.id);
      expect(middleRes.status).toBe(200);
      const middleJson = await middleRes.json();
      expect(middleJson.prevId).toBe(oldest.id);
      expect(middleJson.nextId).toBe(newest.id);

      // Oldest observation: should have next but no prev
      const oldestRes = await getAdjacentObservations(token, project.id, oldest.id);
      expect(oldestRes.status).toBe(200);
      const oldestJson = await oldestRes.json();
      expect(oldestJson.prevId).toBeNull();
      expect(oldestJson.nextId).toBe(middle.id);

      // Newest observation: should have prev but no next
      const newestRes = await getAdjacentObservations(token, project.id, newest.id);
      expect(newestRes.status).toBe(200);
      const newestJson = await newestRes.json();
      expect(newestJson.prevId).toBe(middle.id);
      expect(newestJson.nextId).toBeNull();
    });
  });

  test("adjacent endpoint works with a single observation", async () => {
    await withTempProject(
      async (_user, project, _observations, token) => {
        // create a single observation
        const createRes = await createObservation(token, project.id);
        expect(createRes.status).toBe(201);
        const obs = await createRes.json();

        const res = await getAdjacentObservations(token, project.id, obs.id);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.prevId).toBeNull();
        expect(json.nextId).toBeNull();
      },
      undefined,
      undefined,
      undefined,
      undefined,
      false, // don't create the default test observations
    );
  });

  test("adjacent endpoint returns 403 for non-existent observation", async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const res = await getAdjacentObservations(token, project.id, 999999);
      expect(res.status).toBe(403);
    });
  });

  test("unauthenticated user cannot access adjacent endpoint", async () => {
    await withTempProject(async (_user, project, observations, _token) => {
      const res = await getAdjacentObservations("", project.id, observations[0]!.id);
      expect(res.status).toBe(401);
    });
  });

  test("adjacent endpoint respects project boundaries", async () => {
    // Create two projects, each with observations.
    // Observations in project A should not appear as adjacent in project B.
    await withTempProject(async (_userA, projectA, observationsA, tokenA) => {
      await withTempProject(async (_userB, projectB, observationsB, _tokenB) => {
        // Get adjacent for an observation in project B
        const resB = await getAdjacentObservations(
          tokenA,
          projectB.id,
          observationsB[0]!.id,
        );
        // User A doesn't have access to project B -> 403
        expect(resB.status).toBe(403);
      });
    });
  });

  test("adjacent endpoint respects ownership filter for contributors", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (_user, project, observations, token) => {
      // project has contributorsCanReadAllObservations = false by default
      expect(project.contributorsCanReadAllObservations).toBe(false);

      await withTempUser(async (_userB, tokenB) => {
        const inviteRes = await inviteToProject(token, project.id, {
          email: otherEmail,
        });
        expect(inviteRes.status).toBe(202);

        // Contributor B creates their own observation
        const createRes = await createObservation(tokenB, project.id);
        expect(createRes.status).toBe(201);
        const obsB = await createRes.json();

        // As contributor B, fetching adjacent for their own observation:
        // should not see the owner's observations (ownership filter)
        const res = await getAdjacentObservations(tokenB, project.id, obsB.id);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.prevId).toBeNull();
        expect(json.nextId).toBeNull();

        // As owner, fetching adjacent for the owner's newest observation:
        // owner sees all observations, so nextId should point to B's observation
        const sortedObs = [...observations].sort((a, b) => a.id - b.id);
        const newestOwnerObs = sortedObs[sortedObs.length - 1]!;
        const ownerRes = await getAdjacentObservations(
          token,
          project.id,
          newestOwnerObs.id,
        );
        expect(ownerRes.status).toBe(200);
        const ownerJson = await ownerRes.json();
        expect(ownerJson.nextId).toBe(obsB.id);
      }, otherEmail);
    });
  });

  test("adjacent endpoint updates after creating new observations", async () => {
    await withTempProject(async (_user, project, observations, token) => {
      const sortedObs = [...observations].sort((a, b) => a.id - b.id);
      const newest = sortedObs[sortedObs.length - 1]!;

      // Before creating: newest observation has no next
      const beforeRes = await getAdjacentObservations(token, project.id, newest.id);
      expect(beforeRes.status).toBe(200);
      const beforeJson = await beforeRes.json();
      expect(beforeJson.nextId).toBeNull();

      // Create a new observation (will have a higher ID)
      const createRes = await createObservation(token, project.id);
      expect(createRes.status).toBe(201);
      const newObs = await createRes.json();
      expect(newObs.id).toBeGreaterThan(newest.id);

      // After creating: newest observation now has next pointing to the new one
      const afterRes = await getAdjacentObservations(token, project.id, newest.id);
      expect(afterRes.status).toBe(200);
      const afterJson = await afterRes.json();
      expect(afterJson.nextId).toBe(newObs.id);
    });
  });
});
