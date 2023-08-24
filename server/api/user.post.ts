import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { authorize } from '../utils/authorize';
import { safeResponseHandler } from '../utils/safeResponseHandler';
import * as yup from 'yup';

const config = useRuntimeConfig();

const prisma = new PrismaClient();

const SignUpRequestSchema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
}).required();

export default safeResponseHandler(async (event) => {
  const body = await readBody(event);
  let parsed: {email: string; password: string} | undefined;

  // validate with yup
  try {
    parsed = await SignUpRequestSchema.validate(body)
  } catch(e: any) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required body parameters'
    })
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: parsed.email },
    select: { id: true }
  });

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User already exists'
    })
  }

  const saltRounds = config.app.saltRounds ?? 10;
  const hashedPassword = await hash(parsed.password, saltRounds);


  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      password: hashedPassword,
    }
  })

  const { token } = await authorize(event, user)

  return {
    id: user.id,
    token,
  }
})
