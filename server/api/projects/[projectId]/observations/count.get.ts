import { ensureProjectAccess } from "~/server/utils/projectAccess";
import * as yup from 'yup';

export const GetObservationsCountSchema = yup.object({
  start_date: yup.string().required(),
  end_date: yup.string().required(),
}).required();

export default safeResponseHandler(async (event) => {
  // require login
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  const projectId = parseIntParam(event.context.params?.projectId);
  await ensureProjectAccess(event.context.user.id, projectId)

  const queryParams = getQuery(event)
  const { start_date, end_date } = await GetObservationsCountSchema.validate(queryParams)

  const start = new Date(start_date); 
  const end = new Date(end_date);

  const count = await prisma.observation.count({
    where: {
      AND: [
        { projectId: { equals: projectId }},
        { createdAt: { gte: start } }, 
        { createdAt: { lte: end } }   
      ]
    }
  });
  
  return count 
})