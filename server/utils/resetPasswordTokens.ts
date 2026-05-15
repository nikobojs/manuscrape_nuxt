import { and, desc, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
import { resetPasswordToken } from "../drizzle/schema";
import { createHash } from "node:crypto";
import { captureException } from "@sentry/node";

type ResetPasswordTokenInsert = Awaited<typeof resetPasswordToken.$inferInsert>;
const TOKEN_EXPIRY_MINUTES = 10;
const MAX_TOKENS_PER_DAY = 5;
const MIN_TOKEN_INTERVAL_MINUTES = 1;

export type ResetPasswordTokenSelect = Partial<
  Record<keyof typeof resetPasswordToken.$inferSelect, boolean>
>;

export function hashResetPasswordToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createResetPasswordToken(
  userId: number,
  ipAddress: string,
  userAgent: string,
  tokenCleartext: string,
): Promise<{ id: number }> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES);

  // only save token hash, clear text token is not stored serverside, only in the email
  const tokenHash = hashResetPasswordToken(tokenCleartext);
  const newToken: ResetPasswordTokenInsert = {
    expiresAt: expiresAt.toISOString(),
    ipAddress: ipAddress,
    tokenHash: tokenHash,
    userId: userId,
    userAgent: userAgent,
  };

  return db.transaction(async (tx) => {
    // revoke all other tokens
    await tx
      .update(resetPasswordToken)
      .set({
        revokedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(resetPasswordToken.userId, userId),
          isNull(resetPasswordToken.revokedAt),
          isNull(resetPasswordToken.usedAt),
        ),
      );

    // insert new token
    return tx
      .insert(resetPasswordToken)
      .values(newToken)
      .returning({
        id: resetPasswordToken.id,
      })
      .then((res) => res[0]!);
  });
}

// return 20 newest used/revoked reset password tokens
function getResetPasswordTokensByUserId<
  T extends Partial<Record<keyof ResetPasswordTokenSelect, boolean>>,
>(userId: number, select: T, limit = 20) {
  return db.query.resetPasswordToken.findMany({
    columns: select,
    where: and(eq(resetPasswordToken.userId, userId)),
    orderBy: desc(resetPasswordToken.createdAt),
    limit: limit,
  });
}

export function getResetPasswordTokenByTokenHash<
  T extends Partial<Record<keyof ResetPasswordTokenSelect, boolean>>,
>(tokenHash: string, select: T) {
  return db.query.resetPasswordToken.findFirst({
    columns: select,
    where: and(eq(resetPasswordToken.tokenHash, tokenHash)),
  });
}

export async function userCanRequestPasswordResetToken(
  userId: number,
): Promise<{ ok: boolean; msg?: string }> {
  const tokens = await getResetPasswordTokensByUserId(userId, {
    id: true,
    createdAt: true,
  });

  // if user has no tokens, it is ok to create new ones
  if (tokens.length === 0) return { ok: true };

  // make sure user cannot create tokens with too short intervals
  const newestTokenAge = Date.now() - new Date(tokens[0]!.createdAt).getTime();
  const minTokenAge = 1000 * 60 * MIN_TOKEN_INTERVAL_MINUTES;

  // abort if the newest token is newer than now (just to be sure)
  if (newestTokenAge > Date.now()) {
    const msg = `Something is wrong with the timezones on the server. We are looking into this`;
    captureException(msg, { data: { userId } });
    return {
      ok: false,
      msg: msg,
    };
  }

  // ensure the user waits the minimum delay between generation of tokens
  const newestTokenTooNew = newestTokenAge < minTokenAge;
  if (newestTokenTooNew) {
    const waitSeconds = Math.floor((minTokenAge - newestTokenAge) / 1000);
    const msg = `You must wait ${waitSeconds} seconds before you can reset your password again`;
    captureException(msg, { data: { userId } });
    return {
      ok: false,
      msg: msg,
    };
  }

  // make sure user cannot create tokens so many within one day
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const tokensToday = tokens
    .map((t) => new Date(t.createdAt).setHours(0, 0, 0, 0))
    .filter((n) => n === todayMs).length;

  if (tokensToday > MAX_TOKENS_PER_DAY) {
    const errMsg =
      "You cannot do this anymore today. Please contact the maintainers if you have problems.";
    captureException(errMsg, { data: { userId } });
    return {
      ok: false,
      msg: errMsg,
    };
  }

  return { ok: true };
}

export function generateResetPasswordToken(): string {
  return crypto.randomUUID();
}

// set token usedAt to now and revokes all other reset password tokens for this user
export function useResetPasswordToken(
  userId: number,
  tokenId: number,
): Promise<void> {
  return db.transaction(async (tx) => {
    await tx
      .update(resetPasswordToken)
      .set({ revokedAt: new Date().toISOString() })
      .where(
        and(
          eq(resetPasswordToken.userId, userId),
          ne(resetPasswordToken.id, tokenId),
        ),
      );
    await tx
      .update(resetPasswordToken)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(resetPasswordToken.id, tokenId));
  });
}
