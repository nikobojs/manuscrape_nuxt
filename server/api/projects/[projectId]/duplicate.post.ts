
import * as yup from 'yup';
import { safeResponseHandler } from '../../../utils/safeResponseHandler';
import { requireUser } from '../../../utils/authorize';
import { ProjectRole } from '@prisma/client';
import { smallProjectQuery } from '~/server/utils/prisma';  // TODO: does auto import work?
import { getNewFieldId } from '~/server/utils/projectFields';

export const DuplicateProjectSchema = yup.object({
  name: yup.string().required(),
}).required()


export default safeResponseHandler(async (event) => {
  const user = requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER, ProjectRole.INVITED]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // get newName from body and trim it
  const body = await readBody(event);
  let { name: newName } = await DuplicateProjectSchema.validate(body)
  newName = newName.trim();

  // get source project we want to duplicate from
  const sourceProject = await prisma.project.findFirst({
    select: smallProjectQuery,
    where: {
      id: projectId
    }
  });

  // ensure source project exists
  if (!sourceProject) {
    throw createError({
      status: 404,
      statusText: 'Project could not be found'
    })
  }

  // ensure new project name differs from source project name
  // TODO: maybe enforce unique project names at some point
  if (sourceProject.name === newName) {
    throw createError({
      status: 400,
      statusText: 'The name of a project duplicate must differ from the source project'
    });
  }
  
  // create new fields lists (whitelists what to copy)
  const newFields = sourceProject.fields.map((f) => {
    return {
      choices: f.choices,
      index: f.index,
      createdAt: new Date(),
      label: f.label,
      type: f.type,
      required: f.required,
    }
  });
  
  // prepare project create query prisma statement
  const newProject = {
    fields: {
      create: newFields,
    },
    name: newName,
    createdAt: new Date(),
    authorId: user.id,
  };

  // execute projects table insert query
  const { id: createdProjectId } = await prisma.project.create({
    data: newProject,
    select: { id: true },
  });

  // fetch the project we just created
  const createdProject = await prisma.project.findFirst({
    where: { id: createdProjectId },
    select: smallProjectQuery,
  });

  // ensure prisma project query returned something
  if (!createdProject || typeof createdProject.id !== 'number') {
    throw createError({
      status: 500,
      statusText: 'Project was unreachable after creation'
    });
  }

  // add ownership of duplicated project
  await prisma.projectAccess.create({
    data: {
      projectId: createdProject.id,
      userId: user.id,
      role: ProjectRole.OWNER,
    }
  });

  // try copying dynamic fields if there are any
  if (sourceProject.dynamicFields.length > 0) {

    // prepare the new dynamic fields
    const newDynamicFields = sourceProject.dynamicFields.map((f) => {
      return {
        field0Id: getNewFieldId(f.field0Id, sourceProject, createdProject).id,
        field1Id: getNewFieldId(f.field1Id, sourceProject, createdProject).id,
        label: f.label,
        operator: f.operator,
        createdAt: new Date(),
        projectId: createdProject.id,
      };
    });

    await prisma.dynamicProjectField.createMany({
      data: newDynamicFields,
    });
  }

  // return 201 with created project in body
  setResponseStatus(event, 201);
  return createdProject;
});