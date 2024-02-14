import { FieldType, ProjectRole } from '@prisma/client'
import * as yup from 'yup';
import { safeResponseHandler } from '../../../utils/safeResponseHandler';
import { requireUser } from '../../../utils/authorize';

export const PatchProjectFieldSchema = yup.object({
  name: yup.string().optional(),
  canDelockObservations: yup.boolean().optional(),
  ownerCanPatchObservations: yup.boolean().optional(),
}).required();

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  const body = await readBody(event);
  const patch = await PatchProjectFieldSchema.validate(body)

  const patchedProject = await prisma.project.update({
    data: patch,
    where: { id: projectId },
  });

  setResponseStatus(event, 200);
  return patchedProject;
});