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
  const user = await db.user.findFirst({
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

  await db.projectAccess.deleteMany({
    where: {
      userId: id,
    },
  });

  await db.observation.updateMany({
    where: {
      userId: id,
    },
    data: {
      userId: null,
    }
  });
  
  await db.projectExport.updateMany({
    where: {
      userId: id,
    },
    data: {
      userId: null,
    }
  });


  
  // retrieve affected projects to be deleted
  // NOTE: fetches projects where user is the only one with access
  const deleteProjects = (await db.project.findMany({
    where: {
      authorId: id,
      contributors: {
        every: {
          userId: id,
        },
      },
    },
    select: { id: true },
  })).map(p => p.id);
  
  await db.observation.deleteMany({
    where: {
      projectId: { in: deleteProjects },
    },
  });
  
  await db.projectExport.deleteMany({
    where: {
      projectId: { in: deleteProjects },
    },
  });

  await db.projectAccess.deleteMany({
    where: {
      projectId: { in: deleteProjects },
    },
  });

  await db.projectField.deleteMany({
    where: {
      projectId: { in: deleteProjects },
    },
  });

  await db.projectInvitation.deleteMany({
    where: {
      projectId: { in: deleteProjects },
    },
  });

  await db.dynamicProjectField.deleteMany({
    where: {
      projectId: { in: deleteProjects },
    },
  });

  await db.project.deleteMany({
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
  await db.user.delete({ where: { id }});
  
  // logout, user is deleted, right?
  event.context.user = undefined;
  resetAuthCookie(event);

  // return 204 No content
  setResponseStatus(event, 204);
  return {}
})
