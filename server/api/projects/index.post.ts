import { FieldType } from '@prisma/client'
import * as yup from 'yup';
import { safeResponseHandler } from '../../utils/safeResponseHandler';
import { requireUser } from '../../utils/authorize';

const fieldTypeValues = Object.values(FieldType);

export const NewProjectFieldSchema = yup.object({
  label: yup.string().required(),
  type: yup.mixed<typeof fieldTypeValues[number]>().required().oneOf(
    Object.values(FieldType)
  ).required(),
  required: yup.boolean().required(),
  choices: yup.array().of(yup.string().required()).optional(),
}).required();

export const NewProjectSchema = yup.object({
  name: yup.string().required(),
  fields: yup.array().of(NewProjectFieldSchema).required(),
}).required()


// TODO: prettify code
export default safeResponseHandler(async (event) => {
  const user = requireUser(event);

  const body = await readBody(event);
  const newProject = await NewProjectSchema.validate(body)

  const fieldLabels = newProject.fields.map((f => f.label));
  if (fieldLabels.length !== new Set(fieldLabels).size) {
    throw createError({
      statusMessage: 'Two fields cannot have an identical label',
      statusCode: 400,
    });
  }

  const createdProject = await prisma.project.create({
    data: {
      name: newProject.name,
      authorId: user.id,
    }
  });

  await prisma.projectAccess.create({
    data: {
      userId: user.id,
      projectId: createdProject.id,
    }
  });

  const newProjectFields = newProject.fields.map((f) => ({
    label: f.label,
    type: f.type,
    required: f.required,
    projectId: createdProject.id,
    choices: f.choices || [],
  }));

  await prisma.projectField.createMany({ data: newProjectFields });

  setResponseStatus(event, 201);
  return createdProject;
});