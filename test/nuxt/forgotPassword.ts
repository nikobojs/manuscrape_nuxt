import { describe, test, expect } from "vitest";
import { login, resetPassword } from "./helpers";
import { withTempUser, requestResetPasswordEmail } from "./helpers";

describe("Forgot password", () => {
  test("User can request a forgot password email", async () => {
    await withTempUser(async (user, token) => {
      const res = await requestResetPasswordEmail(user.email);
      expect(res.status).toBe(200);
    });
  });

  test("User cannot request multiple forgot password email within 50ms", async () => {
    await withTempUser(async (user, token) => {
      const res = await requestResetPasswordEmail(user.email);
      expect(res.status).toBe(200);
      const res1 = await requestResetPasswordEmail(user.email);
      expect(res1.status).toBe(400);
    });
  });

  test("Expect 400 and response slower than 100ms if wrong email", async () => {
    const before = Date.now();
    const res = await requestResetPasswordEmail(
      "non-existing-email-123@example.com",
    );
    expect(res.status).toBe(400);
    const diff = Date.now() - before;
    expect(diff).toBeGreaterThan(100);
  });

  test("User can reset their password with the forgot password token", async () => {
    await withTempUser(async (user, token) => {
      // request password and expect clear text token to be returned (only happens in test environment)
      const requestRes = await requestResetPasswordEmail(user.email);
      expect(requestRes.status).toBe(200);
      const json = await requestRes.json();
      expect(json?.success).toBeTruthy();
      expect(json?.token).toBeTruthy();
      const clearTextToken = json.token as string;

      // reset the password
      const resetRes = await resetPassword(clearTextToken, "Abcd12345");
      expect(resetRes.status).toBe(200);

      // try login to verify password was changed
      const loginRes = await login({
        email: user.email,
        password: "Abcd12345",
      });
      expect(loginRes.status).toBe(200);
    });
  });
});
