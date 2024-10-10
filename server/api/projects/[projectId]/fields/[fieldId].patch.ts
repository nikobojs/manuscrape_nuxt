import { ProjectRole } from '@prisma-postgres/client';
import { captureException } from '@sentry/node';
import * as yup from 'yup';
import { isMultipleChoice, serializeChoices } from '~/utils/observationFields';

export const PatchProjectFieldSchema = yup.object({
  label: yup.string(),
  required: yup.boolean(),
  // choices: yup.array().of(yup.string().required()).optional(),
  choices: yup.array(yup.string().required()),
  index: yup.number(),
}).required();


export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const fieldId = parseIntParam(event.context.params?.fieldId);

  // find project and field based on params
  const field = await db.projectField.findFirst({
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
  const patch = await PatchProjectFieldSchema.validate(body);

  // ensure we don't update `choices` on a non-multiple-choice type
  if (patch.choices && !isMultipleChoice(field.type)) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'Unable to patch choices on a field that is not a multiple choice type',
    });
    captureException(err);
    throw err;
  }

  // filter in patch by value if null or undefined
  const cleanedPatch = Object.entries(patch).reduce((result, entry) => {
    const [key, val] = entry;
    if (key === 'choices') {
      if (val === undefined || (Array.isArray(val) && val.length && typeof val[0] === 'string')) {
        (result as Record<string, any>)['choices'] = serializeChoices(val);
      }
    } else if (![null, undefined].includes(val as any)) {
      (result as Record<string, any>)[key] = val;
    }
    return result;
  }, {} as Partial<Omit<NewProjectField, "choices">>); // TODO: fix type hack

  // ensure the patch actually contains something
  if (Object.keys(cleanedPatch).length === 0) {
    const err = createError({
      statusCode: 400,
      statusMessage: 'Patch object did not include any recognized field parameters',
    });
    captureException(err);
    throw err;
  }

  // execute the update statement
  await db.projectField.update({
    data: cleanedPatch,
    where: {
      id: field.id,
    }
  });

  // fetch updated fields
  const fields = await db.projectField.findMany({
    where: { projectId },
    select: { id: true, index: true, },
  });

  // ensure indexes are valid, and if not, then correct them
  await enforceCorrectIndexes(fields);

  // return 204
  setResponseStatus(event, 204);
});
