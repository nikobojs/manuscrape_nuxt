import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { authorize } from '../utils/authorize';
import { safeResponseHandler } from '../utils/safeResponseHandler';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
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
      createdAt: true,
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

  const { token } = await authorize(event, user)
  return { token }
})
