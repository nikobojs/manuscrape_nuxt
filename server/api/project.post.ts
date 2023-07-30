import { PrismaClient, FieldType } from '@prisma/client';
import * as yup from 'yup';

const prisma = new PrismaClient();

const newProjectSchema = yup.object({
  name: yup.string().required(),
  fields: yup.array(
    yup.object({
      label: yup.string().required(),
      type: yup.mixed<FieldType>().oneOf(
        Object.values(FieldType)
      ).required()
    })
  ).required()
}).required()

export default defineEventHandler(async (event) => {
  if (!event.context.auth?.id) {
    throw createError({
      statusMessage: 'Invalid auth token value',
      statusCode: 401,
    });
  }

  const body = await readBody(event);
  const newProject = await newProjectSchema.validate(body)

  const createdProject = await prisma.project.create({
    data: {
      name: newProject.name,
      authorId: event.context.auth?.id,
      createdAt: new Date(),
    }
  });

  const newProjectFields = newProject.fields.map((f) => ({
    label: f.label,
    type: f.type,
    projectId: createdProject.id,
  }))

  await prisma.projectField.createMany({ data: newProjectFields });

  setResponseStatus(event, 201);
  return { project: { createdProject } };
});