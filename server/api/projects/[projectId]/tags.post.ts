import { ProjectRole } from '@prisma-postgres/client';
import * as yup from 'yup';

export default safeResponseHandler(async (event) => {
  // Auth & access control
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  const projectId = parseIntParam(event.context.params?.projectId);
  const userId = event.context.user.id;

  const NewTagSchema = yup.object({
    name: yup.string().trim().min(1).max(100).required(),
  });

  const body = await readBody(event);
  const newTag = await NewTagSchema.validate(body);

  const existing = await db.tag.findFirst({
    where: {
      projectId,
      name: newTag.name,
    },
  });

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: `A tag named '${newTag.name}' already exists in this project.`,
    });
  }

  const created = await db.tag.create({
    data: {
      name: newTag.name,
      projectId,
      createdById: userId,
      archived: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  setResponseStatus(event, 201);
  return { tag: created };
});
