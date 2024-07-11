import { safeResponseHandler } from '../../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../../utils/authorize';
import { ProjectRole } from '@prisma/client';
import { captureException } from '@sentry/node';
import * as yup from 'yup';

export const MoveProjectFieldSchema = yup.object({
  up: yup.boolean().required(),
}).required();

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const fieldId = parseIntParam(event.context.params?.fieldId);

  // find project and field based on params
  const field = await prisma.projectField.findFirst({
    where: { projectId, id: fieldId },
    select: {
      id: true,
      choices: true,
      label: true,
      type: true,
    }
  });

  // ensure project and field exists
  if (!field) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'Field is not in project or project does not exist'
    });
    captureException(err);
    throw err;
  }

  // read and validate body using yup schema
  const body = await readBody(event);
  const patch = await MoveProjectFieldSchema.validate(body);

  // find all fields in project
  const fields = await prisma.projectField.findMany({
    where: { projectId },
    select: {
      id: true,
      index: true,
    }
  });

  // move project field up or down depending on json body
  await moveProjectField(patch.up, field.id, fields);

  // ensure indexes are valid, and if not, then correct them
  await enforceCorrectIndexes(fields);

  // return 204
  setResponseStatus(event, 204);
});