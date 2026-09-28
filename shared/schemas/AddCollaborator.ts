import * as yup from "yup";

export const AddCollaboratorSchema = yup
  .object({
    email: yup.string().required(),
  })
  .required();
