import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { authorize, delayedError, delayedResponse, passwordStrongEnough } from '../utils/authorize';
import { safeResponseHandler } from '../utils/safeResponseHandler';
import * as yup from 'yup';

const config = useRuntimeConfig();

const prisma = new PrismaClient();

export const SignUpRequestSchema = yup.object({
  email: yup.string().required('Email is required').typeError('Email is not valid'),
  password: yup.string().required('Password is required').typeError('Password is not valid'),
}).required();

export default safeResponseHandler(async (event) => {
  // read body and initiate parsed body
  const body = await readBody(event);
  let parsed: SignUpBody | undefined;

  // validate with yup and save to variable 'parsed'
  try {
    parsed = await SignUpRequestSchema.validate(body);
  } catch(e: any) {
    const msg = e?.message || 'Missing required body parameters';
    return await delayedError(event, 400, msg, true);
  }

  // ensure user isn't already created
  const existingUser = await prisma.user.findFirst({
    where: { email: parsed.email },
    select: { id: true }
  });
  if (existingUser) {
    return await delayedError(event, 409, 'User already exists');
  }

  // validate password
  const { valid, reason } = passwordStrongEnough(parsed.password);
  if (!valid) {
    return await delayedError(event, 400, reason);
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

  // return delayed response
  setResponseStatus(event, 201);
  const res = await delayedResponse(event, { id: user.id, token });
  return res;
});
