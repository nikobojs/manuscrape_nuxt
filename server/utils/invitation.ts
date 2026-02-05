import { createHash } from "node:crypto";

// TODO: refactor
export function generateInvitationHash(
  email: string,
  salt: string,
  rounds = 5,
  algo = "md5",
  debug = false,
): string {
  let hash = salt + email;
  for (let i = 0; i < rounds; i++) {
    const hasher = createHash(algo);
    hasher.update(hash);
    hash = hasher.digest("hex");
  }

  if (debug) {
    console.info("generated invitation hash:", hash);
  }

  return hash;
}
