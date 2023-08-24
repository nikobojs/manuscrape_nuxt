import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { authorize } from '../utils/authorize';
import { safeResponseHandler } from '../utils/safeResponseHandler';

const config = useRuntimeConfig();

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  const { email, password } = await readBody(event);

  // TODO: validate with zod?
  if (
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required body parameters'
    })
  }

  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User already exists'
    })
  }

  const saltRounds = config.app.saltRounds ?? 10;
  const hashedPassword = await hash(password, saltRounds);


  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
    }
  })

  const { token } = await authorize(event, user)

  return {
    id: user.id,
    token,
  }
})