import { describe, test, expect } from "vitest";
import { withTempUser, updateUserProfile } from "./helpers";

describe("Users updating their profiles", () => {
  test("user can update their own profile", async () => {
    await withTempUser(async (user, token) => {
      const res = await updateUserProfile(token, {
        name: "A completely valid name",
        email: "a-valid-email@example.localhost",
      });
      expect(res.status).toBe(204);
    });
  });
  test("update endpoint require the user to send a valid email", async () => {
    await withTempUser(async (user, token) => {
      const invalidProfiles = [
        { email: null, name: null },
        { email: "a-valid-name", name: "a-valid-email@example.localhost" },
        { email: "asd", name: "a-valid-name" },
      ];

      for (const { email, name } of invalidProfiles) {
        const res = await updateUserProfile(token, { name, email });
        const json = await res.json();
        if (res.status !== 400) {
          expect(json).toBe(false);
        }
        expect(res.status).toBe(400);
      }
    });
  });
});
