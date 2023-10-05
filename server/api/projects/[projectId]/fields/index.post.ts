
import { FieldType } from '@prisma/client'
import * as yup from 'yup';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../utils/authorize';
import { NewProjectFieldSchema } from '../../index.post';


// TODO: prettify code
export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // read body and validate new field
  const body = await readBody(event);
  const newProject = await NewProjectFieldSchema.validate(body)

  // create new field
  await prisma.projectField.create({
    data: {
      ...newProject,
      projectId,
    }
  })

  setResponseStatus(event, 201);
  return { success: true };
});