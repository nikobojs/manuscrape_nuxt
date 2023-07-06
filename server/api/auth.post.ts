import { PrismaClient } from '@prisma/client';

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


  prisma.user.findFirst({
    where: {
      email: email,
    },
    select: {
      email: true,
      password: true,
    },
  })

  console.log(`recieved login request for email '${email}'`)
  event.context.user = {id: 1, email: 'boje@karl.dk'}
  return {msg: 'Hello auth'}
})
