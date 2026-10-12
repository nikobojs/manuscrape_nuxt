import { createChallenge, CappedMap } from "altcha-lib";
import { verify } from "altcha-lib/frameworks/shared";
import { deriveKey } from "altcha-lib/algorithms/sha";

// how long a captcha challenge stays valid after it is issued
const challengeTtlMs = 10 * 60 * 1000;
// sha-256 iterations per solution attempt. the browser solver awaits one
// webcrypto digest per iteration, so each attempt costs roughly
// cost x ~12us; with the default 8-bit keyPrefix (~256 attempts) this lands
// at well under a second on a normal cpu. the actual security comes from
// the hmac signature, single-use store and expiry - not cpu difficulty.
const challengeCost = 250;

// remembers used challenges to prevent replaying a captcha payload
const usedChallenges = new CappedMap({ maxSize: 100_000 });

export async function createCaptchaChallenge() {
  const config = useRuntimeConfig();
  return await createChallenge({
    algorithm: "SHA-256",
    cost: challengeCost,
    expiresAt: new Date(Date.now() + challengeTtlMs),
    deriveKey,
    hmacSignatureSecret: config.captchaHmacSecret,
  });
}

export async function verifyCaptcha(payload: unknown) {
  const config = useRuntimeConfig();
  return await verify(
    payload,
    deriveKey,
    config.captchaHmacSecret,
    undefined,
    usedChallenges,
  );
}
