import { ProjectRole } from '@prisma/client'
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../utils/authorize';

export default safeResponseHandler(async (event) => {
  // ensure user is logged in and is owner on project
  requireUser(event);
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
    // TODO: report error
    throw createError({
      statusCode: 400,
      statusMessage: 'An identical dynamic field already exists',
    });
  }

  // ensure submitted fieldIds are NOT identical
  if (field.field0Id === field.field1Id) {
    // TODO: report error
    throw createError({
      statusCode: 400,
      statusMessage: 'Dynamic field cannot operate on two identical static fields',
    });
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
    // TODO: report error
    throw createError({
      statusCode: 400,
      statusMessage: 'One or both provided static fields could not be found',
    });
  }

  // get dynamic field match from config
  const targetFieldTypes = fields.map(f => f.type);
  const allowedPairs = DynamicFieldsConfig[field.operator].pairs;
  const allowedMatch = allowedPairs.find(([a, b]) =>
    a === targetFieldTypes[0] && b === targetFieldTypes[1] ||
    a === targetFieldTypes[0] && b === targetFieldTypes[1]
  );

  // ensure there is a matching dynamic field config
  if (!allowedMatch) {
    // TODO: report error
    const fieldNames = fields.map(f => `'${f.label}'`);
    throw createError({
      statusCode: 400,
      statusMessage: `The fields ${fieldNames.join(' and ')} does not support the provided operation`,
    });
  }

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