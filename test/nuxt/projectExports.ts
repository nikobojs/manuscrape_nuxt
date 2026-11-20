import { describe, test, expect } from "vitest";
import {
  withTempProject,
  withTempImageProject,
  exportProject,
  getExports,
  downloadExport,
  readZipEntries,
  createObservation,
  uploadImageToObservation,
  patchObservation,
  validTestImage0,
  validTestImage1,
} from "./helpers";

describe("Project exporting", () => {
  test("project owner cannot export an empty project", async () => {
    await withTempProject(
      async (_user, project, observations, token) => {
        expect(observations.length).toBe(0);
        const emptyExportRes = await exportProject(token, project.id, {
          type: "NVIVO",
          startDate: "2000-09-13T00:00:00.000Z",
          endDate: new Date().toISOString(),
        });
        expect(emptyExportRes.status).toBe(400);
      },
      undefined,
      undefined,
      undefined,
      undefined,
      false,
    );
  });

  test("project owner can export a project with observations", async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const exportRes = await exportProject(token, project.id, {
        type: "NVIVO",
        startDate: "2000-09-13T00:00:00.000Z",
        endDate: tomorrow.toISOString(),
        includeTags: true,
      });

      expect(_observations.length).toBeGreaterThan(0);
      // const json = await exportRes.json();
      // expect(JSON.stringify(json, null, 2)).toBe("hello");

      expect(exportRes.status).toBe(201);

      // get all exports
      const exportsRes = await getExports(token, project.id);
      expect(exportsRes.status).toBe(200);
      const exportsJson = await exportsRes.json();

      // ensure new export is generating
      expect(Array.isArray(exportsJson?.projectExports?.page)).toBe(true);
      expect(exportsJson?.projectExports?.total).toBe(1);
      expect(exportsJson?.projectExports?.page?.length).toBe(1);
      const newExport = exportsJson.projectExports.page[0];
      expect(newExport.observationsCount, JSON.stringify(newExport)).toBe(
        _observations.length,
      );
      expect(["GENERATING", "DONE"]).toContain(newExport.status);

      // ensure export finishes
      for (let i = 0; i < 10; i++) {
        const exportsRes = await getExports(token, project.id);
        const exportsJson = await exportsRes.json();
        const newExport = exportsJson.projectExports.page[0];
        if (newExport.status === "DONE") {
          expect(newExport.error).toBe(null);
          expect(newExport.size).toBeGreaterThan(0);
          break;
        } else if (i === 9) {
          expect(
            newExport.status,
            "After 10 delayed retries, export was not generated",
          ).toBe("DONE");
        }
        await new Promise((ok) => setTimeout(ok, 400));
      }
    });
  });

  test("project owner cannot export a project with invalid type", async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const exportRes = await exportProject(token, project.id, {
        type: "INVALID_TYPE",
        startDate: "2000-09-13T00:00:00.000Z",
        endDate: new Date().toISOString(),
      });

      expect(exportRes.status).toBe(400);
    });
  });

  test("media export gives every image a unique zip entry name", async () => {
    await withTempImageProject(async (_user, project, _observations, token) => {
      // create an observation to hold the images
      const obsRes = await createObservation(token, project.id);
      expect(obsRes.status).toBe(201);
      const obsId = (await obsRes.json())?.id;
      expect(typeof obsId).toBe("number");

      // find the IMAGE_MULTIPLE parameter
      const imgMultipleField = project.fields.find(
        (f) => f.type === "IMAGE_MULTIPLE",
      )!;
      expect(imgMultipleField).toBeTruthy();

      // upload three images to the same IMAGE_MULTIPLE parameter
      // image 0 and 2 are the same file, image 1 is a different one
      const uploadImages = [validTestImage0, validTestImage1, validTestImage0];
      for (let i = 0; i < uploadImages.length; i++) {
        const res = await uploadImageToObservation(
          token,
          project.id,
          obsId,
          imgMultipleField.id,
          new File([uploadImages[i]!], `test-${i}.png`, { type: "image/png" }),
        );
        expect(res.status, await res.text()).toBe(200);
      }

      // publish the observation, exports only include published observations
      const publishRes = await patchObservation(token, project.id, obsId, {
        isDraft: false,
      });
      expect(publishRes.status, await publishRes.text()).toBe(200);

      // start a media export
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const exportRes = await exportProject(token, project.id, {
        type: "MEDIA",
        startDate: "2000-09-13T00:00:00.000Z",
        endDate: tomorrow.toISOString(),
        includeTags: false,
      });
      expect(exportRes.status).toBe(201);

      // wait for the export to finish generating
      let exportId: number | undefined;
      for (let i = 0; i < 10; i++) {
        const exportsRes = await getExports(token, project.id);
        const exportsJson = await exportsRes.json();
        const newExport = exportsJson.projectExports.page[0];
        exportId = newExport.id;
        if (newExport.status === "DONE") break;
        if (i === 9) {
          expect(newExport.status, "export never finished").toBe("DONE");
        }
        await new Promise((ok) => setTimeout(ok, 400));
      }

      // download the zip and read its entries
      const downloadRes = await downloadExport(token, project.id, exportId!);
      expect(downloadRes.status).toBe(200);
      const zipBuffer = Buffer.from(await downloadRes.arrayBuffer());
      const entries = readZipEntries(zipBuffer);
      const names = entries.map((e) => e.name);

      // all three images must be present with unique names
      expect(names.length).toBe(3);
      expect(new Set(names).size).toBe(3);
      for (const name of names) {
        expect(name).toMatch(
          new RegExp(
            `^${obsId}\\.${imgMultipleField.id}(\\.\\d+)?\\.png$`,
          ),
        );
      }

      // entries are in upload order, so verify the actual image contents:
      // the server re-encodes uploads deterministically, so same source
      // file means identical bytes and different files must differ
      expect(entries[0]!.data.length).toBeGreaterThan(0);
      expect(entries[1]!.data.length).toBeGreaterThan(0);
      expect(entries[2]!.data.length).toBeGreaterThan(0);
      expect(entries[0]!.data.equals(entries[2]!.data)).toBe(true);
      expect(entries[0]!.data.equals(entries[1]!.data)).toBe(false);
    });
  });
});
