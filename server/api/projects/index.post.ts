import { type Prisma, FieldType, ProjectRole } from '@prisma-postgres/client'
import * as yup from 'yup';
import { safeResponseHandler } from '../../utils/safeResponseHandler';
import { requireUser } from '../../utils/authorize';
import { serializeChoices } from '~/utils/observationFields';

const fieldTypeValues = Object.values(FieldType);

export const NewProjectFieldSchema = yup.object({
  label: yup.string().required(),
  type: yup.mixed<typeof fieldTypeValues[number]>().required().oneOf(
    Object.values(FieldType)
  ).required(),
  required: yup.boolean().required(),
  choices: yup.array().of(yup.string().required()).optional(),
  index: yup.number().required(),
}).required();

export const NewProjectSchema = yup.object({
  name: yup.string().required(),
  fields: yup.array().of(NewProjectFieldSchema).required(),
}).required()


// TODO: prettify code
export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);

  const body = await readBody(event);
  const newProject = await NewProjectSchema.validate(body)

  const fieldLabels = newProject.fields.map((f => f.label));

  if (newProject.fields.length === 0) {
    throw createError({
      statusMessage: 'Cannot create a project without fields',
      statusCode: 400,
    });
  }

  if (fieldLabels.length !== new Set(fieldLabels).size) {
    throw createError({
      statusMessage: 'Two fields cannot have an identical label',
      statusCode: 400,
    });
  }

  const fieldIndexes = newProject.fields.map((f => f.index));
  const uniqueFieldIndexes = new Set([...fieldIndexes]);
  if (fieldIndexes.length !== uniqueFieldIndexes.size) {
    throw createError({
      statusMessage: `Two fields cannot have an identical index: ${fieldIndexes.join(',')}`,
      statusCode: 400,
    });
  }

  const createdProject = await db.project.create({
    data: {
      name: newProject.name,
      authorId: user.id,
      authorCanDelockObservations: false,
      ownerCanDelockObservations: false,
    },
  });

  await db.projectAccess.create({
    data: {
      userId: user.id,
      projectId: createdProject.id,
      nameInProject: user.email,
      role: ProjectRole.OWNER,
    }
  });

  const newProjectFields = newProject.fields.map((f) => ({
    label: f.label!,
    type: f.type!,
    required: f.required,
    projectId: createdProject.id,
    choices: serializeChoices(f.choices || null),
    index: f.index,
  })) satisfies Prisma.ProjectFieldCreateManyInput[];

  await db.projectField.createMany({
    data: newProjectFields,
  });

  // get the updated fields to ensure indexes are ok
  const updatedFields = await db.projectField.findMany({
    where: { projectId: createdProject.id },
    select: { id: true, index: true }
  });

  // verify and update indexes if needed
  await enforceCorrectIndexes(updatedFields)

  setResponseStatus(event, 201);
  return createdProject;
});