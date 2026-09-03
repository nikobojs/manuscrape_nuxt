import { captureException } from "@sentry/node";
import * as yup from "yup";
import {
  getProjectFieldsByProjectIds,
  updateProjectFieldIndexes,
} from "~~/server/utils/projectFields";

const ReorderProjectFieldsSchema = yup
  .object({
    fieldIndexes: yup
      .array(
        yup.object({
          id: yup.number().required(),
          index: yup.number().required(),
        })
      )
      .required(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, ["OWNER"]);

  const projectId = parseIntParam(event.context.params?.projectId);

  const body = await readBody(event);
  const { fieldIndexes } = await ReorderProjectFieldsSchema.validate(body);

  const fields = await getProjectFieldsByProjectIds([projectId], {
    id: true,
    index: true,
  });

  // Create a map of fieldId to new index for quick lookup
  const indexMap = new Map(fieldIndexes.map(f => [f.id, f.index]));
  
  // Update all fields in the project with their new indexes
  const fieldsToUpdate = fields.map(field => ({
    id: field.id,
    index: indexMap.get(field.id) ?? field.index,
  }));

  await updateProjectFieldIndexes(fieldsToUpdate);

  setResponseStatus(event, 204);
});
