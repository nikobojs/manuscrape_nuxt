import { describe, test, expect } from "vitest";
import { withTempProject, exportProject, getExports } from "./helpers";

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
});
