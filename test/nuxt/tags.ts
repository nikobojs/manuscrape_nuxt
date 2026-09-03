import { describe, test, expect } from "vitest";
import {
  withTempProject,
  withTempUser,
  getMe,
  getTagsInProject,
  createTag,
  deleteTag,
  patchObservation,
  getObservations,
  inviteToProject,
  freshEmail,
} from "./helpers";

describe("Observation tags", () => {
  test("project owner can create tag", async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf("number");

      // ensure no tags already exists
      const beforeTagsRes = await getTagsInProject(token, projectId);
      const beforeTagsJson = await beforeTagsRes.json();
      // expect(beforeTagsJson).toBe(14);
      expect("tags" in beforeTagsJson).toBe(true);
      expect(Array.isArray(beforeTagsJson?.tags));
      expect(beforeTagsJson.tags.length).toBe(0);

      // create new tag
      const newTag = {
        name: "hello",
      };
      const res = await createTag(token, projectId, newTag);
      expect(res.status).toBe(201);

      // ensure tag can be fetched afterwards
      const afterTagsRes = await getTagsInProject(token, projectId);
      const afterTagsJson = await afterTagsRes.json();
      expect(afterTagsJson.tags.length).toBe(1);
      expect(afterTagsJson.tags[0]!.name).toBe("hello");
    });
  });

  test("collaborator can create tag", async () => {
    const collaboratorEmail = "collaborator-tags-0@codecollective.dk";
    await withTempProject(async (user, project, _obs, tokenA) => {
      const inviteRes = await inviteToProject(tokenA, project.id, {
        email: collaboratorEmail,
      });
      expect(inviteRes.status).toBe(201);
      await withTempUser(async (user2, tokenB) => {
        // create new tag
        const newTag = {
          name: "hello123",
        };
        const res = await createTag(tokenB, project.id, newTag);
        expect(res.status).toBe(201);

        // ensure tag can be fetched afterwards
        const afterTagsRes = await getTagsInProject(tokenB, project.id);
        const afterTagsJson = await afterTagsRes.json();
        expect(afterTagsJson.tags.length).toBe(1);
        expect(afterTagsJson.tags[0]!.name).toBe("hello123");
      }, collaboratorEmail);
    });
  });

  test("user can own tag when not used in observations", async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf("number");

      // ensure no tags already exists
      const beforeTagsRes = await getTagsInProject(token, projectId);
      const beforeTagsJson = await beforeTagsRes.json();
      expect("tags" in beforeTagsJson).toBe(true);
      expect(Array.isArray(beforeTagsJson?.tags));
      expect(beforeTagsJson.tags.length).toBe(0);

      // create new tag
      const newTag = {
        name: "hello",
      };
      const createRes = await createTag(token, projectId, newTag);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      expect("tag" in createJson).toBe(true);
      const createdTag = createJson.tag!;

      // remove tag
      await deleteTag(token, createdTag.id, projectId);

      // ensure tag is removed after removal
      const afterTagsRes = await getTagsInProject(token, projectId);
      const afterTagsJson = await afterTagsRes.json();
      expect(afterTagsJson.tags.length).toBe(0);
    });
  });

  test("can add and remove tag from observation", async () => {
    await withTempProject(async (user, project, obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf("number");

      // ensure no tags already exists
      const beforeTagsRes = await getTagsInProject(token, projectId);
      const beforeTagsJson = await beforeTagsRes.json();
      expect("tags" in beforeTagsJson).toBe(true);
      expect(Array.isArray(beforeTagsJson?.tags));
      expect(beforeTagsJson.tags.length).toBe(0);

      // create new tag
      const newTag = {
        name: "hello",
      };
      const createRes = await createTag(token, projectId, newTag);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      expect("tag" in createJson).toBe(true);
      const createdTag = createJson.tag!;

      // add tag to observation
      await patchObservation(token, projectId, obs[0]!.id, {
        tags: {
          connect: [{ id: createdTag.id }],
        },
      });

      // verify it is set on observation
      let allObsResponse = await getObservations(token, projectId);
      let allObsJson = await allObsResponse.json();
      expect("observations" in allObsJson);
      expect(Array.isArray(allObsJson.observations)).toBe(true);
      let relevantObs: FullObservation | undefined = (
        allObsJson.observations as FullObservation[]
      ).find((o) => o.id === obs[0]!.id);
      expect(relevantObs).toBeTruthy();
      expect("tags" in relevantObs!).toBe(true);
      let foundTags = relevantObs!.tags.map((o) => o.name);
      expect(foundTags.includes("hello"));

      // remove tag from observation
      await patchObservation(token, projectId, obs[0]!.id, {
        tags: {
          disconnect: [{ id: createdTag.id }],
        },
      });

      // verify it is removed from observation
      allObsResponse = await getObservations(token, projectId);
      allObsJson = await allObsResponse.json();
      expect("observations" in allObsJson);
      expect(Array.isArray(allObsJson.observations)).toBe(true);
      relevantObs = (allObsJson.observations as FullObservation[]).find(
        (o) => o.id === obs[0]!.id,
      );
      expect(relevantObs).toBeTruthy();
      expect("tags" in relevantObs!).toBe(true);
      expect(Array.isArray(relevantObs!.tags)).toBe(true);
      expect(relevantObs!.tags.length).toBe(0);
    });
  });

  test("can still add and remove tag from locked observation", async () => {
    await withTempProject(async (user, project, obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf("number");

      // ensure no tags already exists
      const beforeTagsRes = await getTagsInProject(token, projectId);
      const beforeTagsJson = await beforeTagsRes.json();
      expect("tags" in beforeTagsJson).toBe(true);
      expect(Array.isArray(beforeTagsJson?.tags));
      expect(beforeTagsJson.tags.length).toBe(0);

      // create new tag
      const newTag1 = {
        name: "hello",
      };
      const newTag2 = {
        name: "another hello",
      };
      let createRes = await createTag(token, projectId, newTag1);
      expect(createRes.status).toBe(201);
      let createJson = await createRes.json();
      expect("tag" in createJson).toBe(true);
      const createdTag1 = createJson.tag!;
      createRes = await createTag(token, projectId, newTag2);
      expect(createRes.status).toBe(201);
      createJson = await createRes.json();
      expect("tag" in createJson).toBe(true);
      const createdTag2 = createJson.tag!;

      // add tag to observation
      let patchRes = await patchObservation(token, projectId, obs[0]!.id, {
        tags: {
          connect: [{ id: createdTag1.id }],
        },
      });
      expect(patchRes.status).toBe(200);

      // verify tag is present on observation
      let allObsResponse = await getObservations(token, projectId);
      let allObsJson = await allObsResponse.json();
      expect("observations" in allObsJson);
      expect(Array.isArray(allObsJson.observations)).toBe(true);
      let relevantObs: FullObservation | undefined = (
        allObsJson.observations as FullObservation[]
      ).find((o) => o.id === obs[0]!.id);
      expect(relevantObs).toBeTruthy();
      expect("tags" in relevantObs!).toBe(true);
      let foundTags = relevantObs!.tags.map((o) => o.name);
      expect(foundTags.includes("hello"));

      // add tag to locked observation (expected to succeed)
      patchRes = await patchObservation(token, projectId, obs[0]!.id, {
        tags: {
          connect: [{ id: createdTag2.id }],
        },
      });
      expect(patchRes.status).toBe(200);

      // remove multiple tags from observation
      patchRes = await patchObservation(token, projectId, obs[0]!.id, {
        tags: {
          disconnect: [{ id: createdTag1.id }, { id: createdTag2.id }],
        },
      });
      expect(patchRes.status).toBe(200);

      // verify observation tags are all removed
      allObsResponse = await getObservations(token, projectId);
      allObsJson = await allObsResponse.json();
      expect("observations" in allObsJson);
      expect(Array.isArray(allObsJson.observations)).toBe(true);
      relevantObs = (allObsJson.observations as FullObservation[]).find(
        (o) => o.id === obs[0]!.id,
      );
      expect(relevantObs).toBeTruthy();
      expect("tags" in relevantObs!).toBe(true);
      expect(Array.isArray(relevantObs!.tags)).toBe(true);
      expect(relevantObs!.tags.length).toBe(0);
    });
  });

  test("user can delete own tag when used in observations", async () => {
    await withTempProject(async (user, project, obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf("number");

      // ensure no tags already exists
      const beforeTagsRes = await getTagsInProject(token, projectId);
      const beforeTagsJson = await beforeTagsRes.json();
      expect("tags" in beforeTagsJson).toBe(true);
      expect(Array.isArray(beforeTagsJson?.tags));
      expect(beforeTagsJson.tags.length).toBe(0);

      // create new tag
      const newTag = {
        name: "hello",
      };
      const createRes = await createTag(token, projectId, newTag);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      expect("tag" in createJson).toBe(true);
      const createdTag = createJson.tag!;

      // add tag to observation
      const patchRes = await patchObservation(token, projectId, obs[0]!.id, {
        tags: {
          connect: [{ id: createdTag.id }],
        },
      });
      expect(patchRes.status).toBe(200);

      // remove tag
      const deleteRes = await deleteTag(token, createdTag.id, projectId);
      expect(deleteRes.status).toBe(200);

      // ensure tag is removed from project
      const afterTagsRes = await getTagsInProject(token, projectId);
      const afterTagsJson = await afterTagsRes.json();
      expect(afterTagsJson.tags.length).toBe(0);
    });
  });

  test("cannot add or remove tag from non-owned observation", async () => {
    const otherEmail = freshEmail();
    await withTempProject(async (user, project, obs, tokenA) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf("number");

      // ensure no tags already exists
      const beforeTagsRes = await getTagsInProject(tokenA, projectId);
      const beforeTagsJson = await beforeTagsRes.json();
      expect("tags" in beforeTagsJson).toBe(true);
      expect(Array.isArray(beforeTagsJson?.tags));
      expect(beforeTagsJson.tags.length).toBe(0);

      // create new tag
      const newTag = {
        name: "hello",
      };
      const createRes = await createTag(tokenA, projectId, newTag);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      expect("tag" in createJson).toBe(true);
      const createdTag = createJson.tag!;

      // add tag to observation
      await patchObservation(tokenA, projectId, obs[0]!.id, {
        tags: {
          connect: [{ id: createdTag.id }],
        },
      });

      // verify it is set on observation
      const allObsResponse = await getObservations(tokenA, projectId);
      const allObsJson = await allObsResponse.json();
      expect("observations" in allObsJson);
      expect(Array.isArray(allObsJson.observations)).toBe(true);
      const relevantObs: FullObservation | undefined = (
        allObsJson.observations as FullObservation[]
      ).find((o) => o.id === obs[0]!.id);
      expect(relevantObs).toBeTruthy();
      expect("tags" in relevantObs!).toBe(true);
      const foundTags = relevantObs!.tags.map((o) => o.name);
      expect(foundTags.includes("hello"));

      await withTempUser(async (_userB, tokenB) => {
        // invite new user to project
        const res = await inviteToProject(tokenA, projectId, {
          email: _userB.email,
        });
        expect(res.status).toBe(202);

        // ensure user has access to project
        const meRes = await getMe(tokenB);
        expect(meRes.status).toBe(200);
        const me = await meRes.json();
        expect(me.projectAccess?.length).toBe(1);
        expect(me.projectAccess[0].projectId).toBe(projectId);

        // try remove patch on observation owned by other user
        let patchRes = await patchObservation(tokenB, projectId, obs[0]!.id, {
          tags: {
            connect: [{ id: createdTag.id }],
          },
        });
        expect(patchRes.status).toBe(403);

        // try remove patch on observation owned by other user
        patchRes = await patchObservation(tokenB, projectId, obs[0]!.id, {
          tags: {
            disconnect: [{ id: createdTag.id }],
          },
        });
        expect(patchRes.status).toBe(403);
      }, otherEmail);
    });
  });
});
