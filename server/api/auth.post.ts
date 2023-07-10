import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
const config = useRuntimeConfig();

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  // TODO: validate with yup?
  if (
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required body parameters'
    })
  }


  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 403,
      statusMessage: 'User does not exist'
    })
  }

  const passwordOk = await compare(password, user.password);
  if (!passwordOk) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Wrong password'
    })
  }
  const expires = new Date(new Date().setDate(new Date().getDate() + 365))

  event.context.user = user;
  const token = await jwt.sign({ id: user.id }, config.app.tokenSecret);

  setCookie(event, 'authcookie', token, {
    expires,
    httpOnly: true,
    domain: config.app.COOKIE_DOMAIN,
    sameSite: 'strict'
  });

  return { token }
})
