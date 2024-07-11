import { safeResponseHandler } from "../utils/safeResponseHandler";
import { compare } from 'bcrypt';
import * as yup from 'yup';

const config = useRuntimeConfig();

export const DeleteUserSchema = yup.object({
  password: yup.string().required('Password is required').typeError('Password is not valid'),
}).required();

export default safeResponseHandler(async (event) => {
  const { id } = await requireUser(event);

  // parse body
  const body = await readBody(event);
  let parsed;
  try {
    parsed = await DeleteUserSchema.validate(body);
  } catch(e: any) {
    const msg = e?.message || 'Missing required body parameters';
    return await delayedError(event, 400, msg, true);
  }

  // fetch user from db with email from request body
  const user = await prisma.user.findFirst({
    where: { id },
    select: { password: true },
  });

  // handle if user does not exist
  if (!user) {
    return await delayedError(event, 403, 'User does not exist');
  }

  // validate password
  const passwordOk = await compare(parsed.password, user.password);
  if (!passwordOk) {
    return await delayedError(event, 403, 'Wrong password');
  }

  // delete projects where user is the only one with access
  await prisma.project.deleteMany({
    where: {
      authorId: id,
      contributors: {
        every: {
          userId: id,
        },
      },
    },
  });

  // delete user
  await prisma.user.delete({ where: { id }});
  
  // logout, user is deleted, right?
  event.context.user = undefined;
  resetAuthCookie(event);

  // return 204 No content
  setResponseStatus(event, 204);
  return {}
})
