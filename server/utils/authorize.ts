import jwt from 'jsonwebtoken';
import type { H3Event } from 'h3';
import { User } from '@prisma/client';

const config = useRuntimeConfig();

export async function authorize(
  event: H3Event,
  user: User
): Promise<{ token: string }> {
  const expires = new Date(new Date().setDate(new Date().getDate() + 365))
  event.context.user = user;
  const token = await jwt.sign({ id: user.id }, config.app.tokenSecret);

  setCookie(event, 'authcookie', token, {
    expires,
    httpOnly: true,
    domain: config.app.COOKIE_DOMAIN,
    sameSite: 'strict'
  });

  return { token };
}