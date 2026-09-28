import * as yup from "yup";

export const PatchCollaboratorSchema = yup
  .object({
    nameInProject: yup.string(),
    role: yup.string(),
  })
  .required();
