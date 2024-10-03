import { ProjectRole } from '@prisma-postgres/client';
import { hash } from 'bcrypt';
import { authorize, delayedError, delayedResponse, passwordStrongEnough, isValidEmail } from '../utils/authorize';
import { safeResponseHandler } from '../utils/safeResponseHandler';
import * as yup from 'yup';

const config = useRuntimeConfig();

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
  const existingUser = await db.user.findFirst({
    where: { email: parsed.email },
    select: { id: true }
  });
  if (existingUser) {
    return await delayedError(event, 409, 'User already exists');
  }

  // validate email
  if (!isValidEmail(parsed.email)) {
    return await delayedError(event, 400, 'Invalid email')
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
  const user = await db.user.create({
    data: {
      email: parsed.email,
      password: hashedPassword,
    }, select: {
      id: true,
      email: true,
      password: true,
      createdAt: true,
    }
  });

  // get all pending invitations
  const emailHash = generateInvitationHash(parsed.email);
  const invitations = await db.projectInvitation.findMany({
    select: {
      id: true,
      projectId: true,
    },
    where: {
      emailHash,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  // accept invitations if any
  if (invitations.length > 0) {
    await db.projectAccess.createMany({
      data: invitations.map((inv) => ({
        projectId: inv.projectId,
        userId: user.id,
        role: ProjectRole.INVITED,
        nameInProject: user.email,
      }))
    });
  }

  // delete accepted invitations
  if (invitations.length > 0) {
    const projectInvitationIds = invitations.map((i) => i.id);
    await db.projectInvitation.deleteMany({
      where: {
        id: { in: projectInvitationIds },
      },
    });
  }

  // authorize user
  const { token } = await authorize(event, user)

  // return delayed response
  setResponseStatus(event, 201);
  const res = await delayedResponse(event, { id: user.id, token });
  return res;
});
