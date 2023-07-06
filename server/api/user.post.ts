import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
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


  const result = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
    }
  })

  console.log('CREASTED USER, GOT RESULT:');
  console.table(result)

  return {
    id: result.id,
    msg: 'user created!'
  }
})
