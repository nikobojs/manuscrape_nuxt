import * as yup from "yup";
import { FieldTypeValues } from "#shared/utils/observationFields";
import { createProjectAccess } from "../utils/projectAccess";
import { createProject } from "../utils/project";
import {
  createProjectFields,
  updateProjectFieldIndexes,
} from "../utils/projectFields";

export const NewProjectFieldSchema = yup
  .object({
    label: yup.string().required(),
    type: yup.mixed<FieldType>().required().oneOf(FieldTypeValues).required(),
    required: yup.boolean().required(),
    choices: yup.array().of(yup.string().required()).optional(),
    index: yup.number().required(),
  })
  .required();

export const NewProjectSchema = yup
  .object({
    name: yup.string().required(),
    fields: yup.array().of(NewProjectFieldSchema).required(),
  })
  .required();

// TODO: prettify code
export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readBody(event);
  const newProject = await NewProjectSchema.validate(body);

  const fieldLabels = newProject.fields.map((f) => f.label);

  if (newProject.fields.length === 0) {
    throw createError({
      statusMessage: "Cannot create a project without fields",
      statusCode: 400,
    });
  }

  if (fieldLabels.length !== new Set(fieldLabels).size) {
    throw createError({
      statusMessage: "Two fields cannot have an identical label",
      statusCode: 400,
    });
  }

  const fieldIndexes = newProject.fields.map((f) => f.index);
  const uniqueFieldIndexes = new Set([...fieldIndexes]);
  if (fieldIndexes.length !== uniqueFieldIndexes.size) {
    throw createError({
      statusMessage: `Two fields cannot have an identical index: ${fieldIndexes.join(",")}`,
      statusCode: 400,
    });
  }
  const createdProject = await createProject({
    name: newProject.name,
    authorId: user.id,
  });
  await createProjectAccess(user.id, createdProject.id, user.email, "OWNER");

  // get the updated fields to ensure indexes are ok
  const updatedFields = await createProjectFields(
    createdProject.id,
    newProject.fields,
  );

  // verify and update indexes if needed
  await updateProjectFieldIndexes(updatedFields);

  setResponseStatus(event, 201);
  return createdProject;
});
