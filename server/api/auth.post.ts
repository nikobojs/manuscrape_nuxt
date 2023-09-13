import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';
import { safeResponseHandler } from '../utils/safeResponseHandler';
import { authorize, delayedError, delayedResponse } from '../utils/authorize';
import * as yup from 'yup';

const prisma = new PrismaClient();

const SignInRequestSchema = yup.object({
  email: yup.string().required('Email is required').typeError('Email is not valid'),
  password: yup.string().required('Password is required').typeError('Password is not valid'),
}).required();


export default safeResponseHandler(async (event) => {
  // read body and initiate parsed body
  const body = await readBody(event);
  let parsed: {email: string; password: string} | undefined;

  // validate with yup and save to variable 'parsed'
  try {
    parsed = await SignInRequestSchema.validate(body)
  } catch(e: any) {
    const msg = e?.message || 'Missing required body parameters';
    return await delayedError(event, 400, msg, true);
  }

  // fetch user from db with email from request body
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

  // handle if user does not exist
  if (!user) {
    return await delayedError(event, 403, 'User does not exist');
  }

  // handle if password mismatch
  const passwordOk = await compare(parsed.password, user.password);
  if (!passwordOk) {
    return await delayedError(event, 403, 'Wrong password');
  }

  // create cookies, tokens, etc
  const { token } = await authorize(event, user)

  // return delayed succes response
  const res = await delayedResponse(event, { token });
  return res;
});
