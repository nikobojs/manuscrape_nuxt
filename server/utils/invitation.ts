import { createHash } from 'node:crypto';
const config = useRuntimeConfig();

export function generateInvitationHash(
  email: string,
  salt = config.app.invitationSalt || 'salt',
  rounds = 5,
  algo = 'md5'
): string {
  let hash = salt + email;
  for(let i = 0; i < rounds; i++) {
    const hasher = createHash(algo);
    hasher.update(hash);
    hash = hasher.digest('hex');
  }

  console.log('generated invitation hash:', hash)

  return hash;
}
