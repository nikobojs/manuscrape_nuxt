import { captureException } from "@sentry/node";
import {
  createDynamicFields,
  findDuplicateDynamicField,
  getProjectFieldsInDynamicField,
} from "~~/server/utils/dynamicFields";

export default safeResponseHandler(async (event) => {
  // ensure user is logged in and is owner on project
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);

  // get parameters and body
  const body = await readBody(event);
  const field = await NewDynamicFieldSchema.validate(body);

  const projectId = parseIntParam(event.context.params?.projectId);

  // ensure same setup (fields and operation) is not present in project
  // NOTE: the reason it is project specific, is because projecFieldsIds are not shared
  const duplicate = await findDuplicateDynamicField(field);
  if (duplicate) {
    const err = createError({
      statusCode: 400,
      statusMessage: "An identical dynamic field already exists",
    });
    captureException(err);
    throw err;
  }

  // ensure submitted fieldIds are NOT identical
  if (field.field0Id === field.field1Id) {
    const err = createError({
      statusCode: 400,
      statusMessage:
        "Dynamic field cannot operate on two identical static fields",
    });
    captureException(err);
    throw err;
  }

  const fields = await getProjectFieldsInDynamicField(field, projectId);

  // ensure both fields exists and is in project
  if (fields.length !== 2) {
    const err = createError({
      statusCode: 400,
      statusMessage: "One or both provided static fields could not be found",
    });
    captureException(err);
    throw err;
  }

  // ensure dynamic field operation is allowed on these fields
  requireAllowedMatch(fields[0]!, fields[1]!, field.operator);

  // create dynamic field
  await createDynamicFields(projectId, [
    {
      field0Id: field.field0Id,
      field1Id: field.field1Id,
      label: field.label,
      operator: field.operator,
      projectId: projectId,
    },
  ]);

  // return 201 Created
  setResponseStatus(event, 201);
});
