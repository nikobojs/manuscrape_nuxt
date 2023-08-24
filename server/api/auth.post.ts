import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { authorize } from '../utils/authorize';
import { safeResponseHandler } from '../utils/safeResponseHandler';
import * as yup from 'yup';

const prisma = new PrismaClient();

const SignInRequestSchema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
}).required();


export default safeResponseHandler(async (event) => {
  const body = await readBody(event);
  let parsed: {email: string; password: string} | undefined;

  // validate with yup
  try {
    parsed = await SignInRequestSchema.validate(body)
  } catch(e: any) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required body parameters'
    })
  }


  const user = await prisma.user.findFirst({
    where: {
      email: parsed.email,
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

  const passwordOk = await compare(parsed.password, user.password);
  if (!passwordOk) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Wrong password'
    })
  }

  const { token } = await authorize(event, user)
  return { token }
})
