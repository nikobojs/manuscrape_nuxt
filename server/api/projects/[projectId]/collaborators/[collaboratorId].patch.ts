
import { ProjectRole } from '@prisma-postgres/client';
import { safeResponseHandler } from '~/server/utils/safeResponseHandler';
import { parseIntParam } from '~/server/utils/request';
import { requireUser } from '~/server/utils/authorize';
import * as yup from 'yup';

const PatchCollaboratorBody = yup.object({
  nameInProject: yup.string(),
  role: yup.string(),
}).required();


export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);
  await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const collaboratorId = parseIntParam(event.context.params?.collaboratorId);
  const body = await readBody(event);

  const { nameInProject, role } = await PatchCollaboratorBody.validate(body);
  const patch: any = {};

  // validate role in body and set in patch
  if (role && !['OWNER', 'INVITED'].includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project role is not recognized!',
    });
  } else if (role) {
    patch.role = role;
  }

  // add nameInProject to draft if defined
  if (nameInProject) {
    patch.nameInProject = nameInProject;
  }

  // ensure something is going to be updated
  if (Object.keys(patch).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collaborator patch cannot be empty'
    })
  }

  // get collaborator access
  const collaboratorAccess = await db.projectAccess.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: collaboratorId,
      }
    },
    select: {
      role: true,
    }
  });

  // ensure collaborator marked for patching is actually connected to project
  if (!collaboratorAccess) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collaborator is not connected to project'
    });
  }
  // patch actual projectAccess row
  await db.projectAccess.update({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: collaboratorId,
      }
    },
    data: { ...patch },
  })

  return { success: true };
});