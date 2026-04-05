import { describe, test, expect } from "vitest";
import {
  withTempImageProject,
  createObservation,
  uploadImageToObservation,
  getObservationImage,
  validTestImage0,
  invalidImages,
  patchObservation,
  withTempUser,
  freshEmail,
  inviteToProject,
} from "./helpers";

describe("Image uploads", async () => {
  test("project with both image parameters can be created and looks right", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      expect(project.fields.length).toBe(2);
      expect(
        project.fields.map((f) => f.type).every((t) => t.includes("IMAGE")),
      ).toBe(true);
    });
  });

  test("image can be uploaded & fetched on an observation in draft mode", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_SINGLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_SINGLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // upload the image
      const imgUploadRes = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      const imgUploadJson = await imgUploadRes.json();
      expect(imgUploadJson?.success, imgUploadJson).toBe(true);
      expect(imgUploadRes.status).toBe(200);
      const newImageId = imgUploadJson?.imageUploadId as number;
      expect(typeof newImageId).toBe("number");

      // fetch image, make sure it can be downloaded
      const imgRes = await getObservationImage(
        token,
        project.id,
        obsId,
        newImageId,
        imgSingleField.id,
      );
      expect(imgRes.status).toBe(200);

      // check content type header
      expect(imgRes.headers.get("Content-Type")).toBe("image/png");

      // check res body
      const imgBlob = await imgRes.blob();
      expect(imgBlob.size).toBeGreaterThan(100);
      expect(imgBlob.type).toBe("image/png");
    });
  });

  test("invalid images cannot be uploaded", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_SINGLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_SINGLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // upload the image
      for (let i = 0; i < invalidImages.length; i++) {
        const invalidImg = invalidImages[i]!;
        const res = await uploadImageToObservation(
          token,
          project.id,
          obsId,
          imgSingleField.id,
          invalidImg,
        );
        const body = await res.json();
        expect(body?.success).toBeFalsy();
        expect(
          res.status,
          `Invalid image upload ${i + 1} did not return 400`,
        ).toBe(400);
      }
    });
  });

  test("image cannot be uploaded on a locked observation", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_SINGLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_SINGLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // upload the image
      const imgUploadRes0 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      expect(imgUploadRes0.status).toBe(200);

      // upload another image, it should replace the existing
      const imgUploadRes1 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      expect(imgUploadRes1.status).toBe(200);

      // set observation draft to false / publish observation
      const publishRes = await patchObservation(token, project.id, obsId, {
        isDraft: false,
      });
      expect(publishRes.status).toBe(200);

      // try upload another image, should not be allowed
      const imgUploadRes2 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      expect(imgUploadRes2.status).toBe(403);
    });
  });

  test("image cannot be uploaded on a collaborator's observation, unless project owner", async () => {
    const otherEmail = freshEmail();
    await withTempImageProject(async (_user, project, _observations, token) => {
      // expect some default settings for this test to work
      expect(project.authorCanDelockObservations).toBe(false);
      expect(project.ownerCanDelockObservations).toBe(false);

      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_SINGLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_SINGLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // add collaborator user, continue test in callback fn
      await withTempUser(async (_collaborator, collaboratorToken) => {
        const inviteRes = await inviteToProject(token, project.id, {
          email: otherEmail,
        });
        expect(inviteRes.status).toBe(202);

        // upload the image from the collaborator, expect error
        const imgUploadRes0 = await uploadImageToObservation(
          collaboratorToken,
          project.id,
          obsId,
          imgSingleField.id,
          new File([validTestImage0], "test.png", { type: "image/png" }),
        );
        expect(imgUploadRes0.status).toBe(403);

        // create observation as the collaborator
        const obsRes = await createObservation(collaboratorToken, project.id);
        expect(obsRes.status).toBe(201);
        const obsJson = await obsRes.json();
        const collabObsId = obsJson?.id;
        expect(typeof collabObsId).toBe("number");

        // upload image from the project owner to the collaborator observation, expect success
        const imgUploadRes1 = await uploadImageToObservation(
          token,
          project.id,
          collabObsId,
          imgSingleField.id,
          new File([validTestImage0], "test.png", { type: "image/png" }),
        );
        expect(imgUploadRes1.status).toBe(200);
      }, otherEmail);
    });
  });

  test("image cannot be uploaded on another user's observation", async () => {
    const otherEmail = freshEmail();
    await withTempImageProject(async (_user, project, _observations, token) => {
      // expect some default settings for this test to work
      expect(project.authorCanDelockObservations).toBe(false);
      expect(project.ownerCanDelockObservations).toBe(false);

      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_SINGLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_SINGLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // add collaborator user, continue test in callback fn
      withTempUser(async (_collaborator, collaboratorToken) => {
        // upload the image from the collaborator, expect error
        const imgUploadRes0 = await uploadImageToObservation(
          collaboratorToken,
          project.id,
          obsId,
          imgSingleField.id,
          new File([validTestImage0], "test.png", { type: "image/png" }),
        );
        expect(imgUploadRes0.status).toBe(403);
      }, otherEmail);
    });
  });

  test("multiple images can be uploaded to an IMAGE_MULTIPLE parameter", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_MULTIPLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_MULTIPLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // upload the image
      const imgUploadRes0 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      const json0 = await imgUploadRes0.json();
      const imgId0 = json0?.imageUploadId as number;
      expect(typeof imgId0).toBe("number");
      expect(imgUploadRes0.status).toBe(200);

      // upload another image, it should replace the existing
      const imgUploadRes1 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      const json1 = await imgUploadRes1.json();
      const imgId1 = json1?.imageUploadId as number;
      expect(typeof imgId0).toBe("number");
      expect(imgUploadRes1.status).toBe(200);

      // ensure both images are fetchable
      const imgRes0 = await getObservationImage(
        token,
        project.id,
        obsId,
        imgId0,
        imgSingleField.id,
      );
      expect(imgRes0.status).toBe(200);
      const imgRes1 = await getObservationImage(
        token,
        project.id,
        obsId,
        imgId1,
        imgSingleField.id,
      );
      expect(imgRes1.status).toBe(200);
    });
  });

  test("image can be replaced, but not on a locked observation", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      // create observation, get the id
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsJson = await obsRes.json();
      const obsId = obsJson?.id;
      expect(typeof obsId).toBe("number");

      // find the id of the IMAGE_SINGLE parameter
      const imgSingleField = project.fields.find(
        (f) => f.type === "IMAGE_SINGLE",
      )!;
      expect(typeof imgSingleField?.id).toBe("number");

      // upload the image
      const imgUploadRes0 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      expect(imgUploadRes0.status).toBe(200);

      // upload another image, it should replace the existing
      const imgUploadRes1 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      expect(imgUploadRes1.status).toBe(200);

      // set observation draft to false / publish observation
      const publishRes = await patchObservation(token, project.id, obsId, {
        isDraft: false,
      });
      expect(publishRes.status).toBe(200);

      // try upload another image, should not be allowed
      const imgUploadRes2 = await uploadImageToObservation(
        token,
        project.id,
        obsId,
        imgSingleField.id,
        new File([validTestImage0], "test.png", { type: "image/png" }),
      );
      expect(imgUploadRes2.status).toBe(403);
    });
  });
});
