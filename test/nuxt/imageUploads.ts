import { describe, test, expect } from "vitest";
import {
  withTempImageProject,
  createObservation,
  uploadImageToObservation,
  getObservationImage,
  validTestImage0,
  invalidImages,
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
  // test("image cannot be uploaded on a locked observation", async () => {});
  // test("image cannot be uploaded on other people's observations, unless project owner", async () => {});
  // test("multiple images can be uploaded to an IMAGE_MULTIPLE parameter", async () => {});
  // test("multiple images cannot be uploaded to an IMAGE_SINGLE parameter", async () => {});
  // test("images can be deleted, but not on a locked observation", async () => {});
  // test("image can be replaced, but not on a locked observation", async () => {});
});
