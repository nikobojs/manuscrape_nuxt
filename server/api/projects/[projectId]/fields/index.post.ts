import { ProjectRole } from '@prisma/client'
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../utils/authorize';
import { NewProjectFieldSchema } from '../../index.post';

// TODO: prettify code
export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // read body and validate new field
  const body = await readBody(event);
  const newField = await NewProjectFieldSchema.validate(body)

  // ensure index is ok
  const existing = await prisma.projectField.findMany({
    where: { projectId },
    select: {
      id: true,
      index: true,
      label: true,
    }
  });

  // check for label duplicates
  const labelDuplicate = existing.find(f => f.label === newField.label);
  if (labelDuplicate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Two fields cannot have the same label',
    })
  }

  // ensure indexes are in order like [0, 1, 2, 3, 4, ...]
  await enforceCorrectIndexes(existing);

  // calculate the next index (correct one for the new field)
  newField.index = existing.length;

  // create new field
  await prisma.projectField.create({
    data: {
      ...newField,
      projectId,
    }
  });

  setResponseStatus(event, 201);
  return { success: true };
});
