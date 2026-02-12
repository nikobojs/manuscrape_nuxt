import * as yup from "yup";
import type { NuxtError } from "nuxt/app";
import { getSmallProjects } from "~~/server/utils/project";
import { createDynamicFields } from "~~/server/utils/dynamicFields";

export const DuplicateProjectSchema = yup
  .object({
    name: yup.string().required(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [
    "OWNER",
    "INVITED",
  ]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // get newName from body and trim it
  const body = await readBody(event);
  let { name: newName } = await DuplicateProjectSchema.validate(body);
  newName = newName.trim();

  // get source project we want to duplicate from
  const [sourceProject] = await getSmallProjects([projectId]);

  // ensure source project exists
  if (!sourceProject) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project could not be found",
    } as Partial<NuxtError>);
  }

  // ensure new project name differs from source project name
  // TODO: maybe enforce unique project names at some point
  if (sourceProject.name === newName) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "The name of a project duplicate must differ from the source project",
    });
  }

  // create new fields lists (whitelists what to copy)
  const newFields = sourceProject.fields.map((f) => {
    return {
      choices: deserializeChoices(f.choices),
      index: f.index,
      createdAt: new Date(),
      label: f.label,
      type: f.type,
      required: f.required,
    };
  });

  // prepare new project
  const newProject = {
    name: newName,
    createdAt: new Date(),
    authorId: user.id,
  };

  // execute projects table insert query
  const { id: createdProjectId } = await createProject(newProject);

  // create project fields
  await createProjectFields(createdProjectId, newFields);

  // fetch the project we just created
  const [createdProject] = await getSmallProjects([createdProjectId]);

  // ensure prisma project query returned something
  if (!createdProject || typeof createdProject.id !== "number") {
    throw createError({
      statusCode: 500,
      statusMessage: "Project was unreachable after creation",
    });
  }

  // add ownership of duplicated project
  await createProjectAccess(user.id, createdProject.id, user.email, "OWNER");

  // try copying dynamic fields if there are any
  if (sourceProject.dynamicFields.length > 0) {
    // prepare the new dynamic fields
    const newDynamicFields = sourceProject.dynamicFields.map((f) => {
      return {
        field0Id: getNewFieldId(
          f.field0Id,
          sourceProject.fields as { id: number; label: string }[],
          createdProject.fields as { id: number; label: string }[],
        ).id,
        field1Id: getNewFieldId(
          f.field1Id,
          sourceProject.fields as { id: number; label: string }[],
          createdProject.fields as { id: number; label: string }[],
        ).id,
        label: f.label,
        operator: f.operator,
        createdAt: new Date(),
        projectId: createdProject.id,
      };
    });

    await createDynamicFields(projectId, newDynamicFields);
  }
  // fetch the project again in super updated version
  const [_createdProject] = await getSmallProjects([createdProjectId]);

  // return 201 with created project in body
  setResponseStatus(event, 201);
  return _createdProject;
});
