import { NewProjectFieldSchema } from "../../projects.post";
import {
  getProjectFieldsByProjectIds,
  updateProjectFieldIndexes,
} from "~~/server/utils/projectFields";

// TODO: prettify code
export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // read body and validate new field
  const body = await readBody(event);
  const newField = await NewProjectFieldSchema.validate(body);

  // grab existing project fields to validate conflicts with new one
  const existing = await getProjectFieldsByProjectIds([projectId], {
    id: true,
    index: true,
    label: true,
  });

  // check for label duplicates
  const labelDuplicate = existing.find((f) => f.label === newField.label);
  if (labelDuplicate) {
    throw createError({
      statusCode: 400,
      statusMessage: "Two fields cannot have the same label",
    });
  }

  // ensure indexes are in order like [0, 1, 2, 3, 4, ...]
  await updateProjectFieldIndexes(existing);

  // create new field
  await createProjectFields(projectId, [
    {
      index: existing.length, // next index is same as length because 0-index
      label: newField.label,
      type: newField.type,
      required: newField.required,
      choices: newField.choices,
    },
  ]);

  setResponseStatus(event, 201);
  return { success: true };
});
