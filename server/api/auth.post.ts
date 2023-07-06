import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';

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

  event.context.user = user
  return {msg: `Hello ${user.email} !`}
})
