import { ProjectRole } from '@prisma/client'
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../utils/authorize';
import { requireAllowedMatch } from '~/server/utils/dynamicFields';
import { captureException } from '@sentry/node';

export default safeResponseHandler(async (event) => {
  // ensure user is logged in and is owner on project
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER])

  // get parameters and body
  const body = await readBody(event);
  const field = await NewDynamicFieldSchema.validate(body)

  const projectId = parseIntParam(event.context.params?.projectId);

  // ensure same setup (fields and operation) is not present in project
  // NOTE: the reason it is project specific, is because projecFieldsIds are not shared
  const existing = await prisma.dynamicProjectField.findFirst({
    where: {
      field0Id: field.field0Id,
      field1Id: field.field1Id,
      operator: field.operator,
    }
  });
  if (existing) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'An identical dynamic field already exists',
    });
    captureException(err);
    throw err;
  }

  // ensure submitted fieldIds are NOT identical
  if (field.field0Id === field.field1Id) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'Dynamic field cannot operate on two identical static fields',
    });
    captureException(err);
    throw err;
  }

  // get field types
  const fields: {
    id: number,
    label: string;
    type: string;
  }[] = await prisma.projectField.findMany({
    select: {
      id: true,
      label: true,
      type: true,
    },
    where: {
      AND: [
        {
          id: {
            in: [field.field0Id, field.field1Id]
          },
        },
        {
          projectId: projectId,
        }
      ]
    }
  });

  // ensure both fields exists and is in project
  if (fields.length !== 2) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'One or both provided static fields could not be found',
    });
    captureException(err);
    throw err;
  }

  // ensure dynamic field operation is allowed on these fields
  requireAllowedMatch(fields[0], fields[1], field.operator)

  // create dynamic field
  const createdField = await prisma.dynamicProjectField.create({
    data: {
      field0Id: field.field0Id,
      field1Id: field.field1Id,
      label: field.label,
      operator: field.operator,
      projectId: projectId,
    }
  });

  // return 201 Created
  setResponseStatus(event, 201);
  return createdField;
});