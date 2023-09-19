import Prisma from '@prisma/client'
const { PrismaClient, FieldType } = Prisma
import * as yup from 'yup';
import { safeResponseHandler } from '../../utils/safeResponseHandler';
import { requireUser } from '../../utils/authorize';

const prisma = new PrismaClient();
const fieldTypeValues = Object.values(FieldType);

export const NewProjectSchema = yup.object({
  name: yup.string().required(),
  fields: yup.array(
    yup.object({
      label: yup.string().required(),
      type: yup.mixed<typeof fieldTypeValues[number]>().required().oneOf(
        Object.values(FieldType)
      ).required(),
      required: yup.boolean().required(),
    })
  ).required()
}).required();


// TODO: prettify code
export default safeResponseHandler(async (event) => {
  const user = requireUser(event);

  const body = await readBody(event);
  const newProject = await NewProjectSchema.validate(body)

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
  }))

  await prisma.projectField.createMany({ data: newProjectFields });

  setResponseStatus(event, 201);
  return createdProject;
});