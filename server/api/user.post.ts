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

  // ensure user isn't already created
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

  // validate password
  const { valid, reason } = passwordStrongEnough(parsed.password);
  if (!valid) {
    throw createError({
      statusCode: 400,
      statusMessage: reason,
    })
  }

  // salt and hash password
  const saltRounds = config.app.saltRounds ?? 10;
  const hashedPassword = await hash(parsed.password, saltRounds);

  // create user
  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      password: hashedPassword,
    }
  })

  // authorize user
  const { token } = await authorize(event, user)

  return {
    id: user.id,
    token,
  }
})


function passwordStrongEnough(pw: string) : { valid: boolean, reason: string } {
  if (!pw) return {
    valid: false,
    reason: 'No password was provided'
  };

  // min length
  if (pw.length < 6) return {
    valid: false,
    reason: 'Password must contain at least 6 characters'
  };

  // everything except ordinary letters
  if (!/[^a-zA-Z]/.test(pw)) {
    return {
      valid: false,
      reason: 'Password must contain at least one number or symbol',
    }
  }

  return { valid: true, reason: '' };
}