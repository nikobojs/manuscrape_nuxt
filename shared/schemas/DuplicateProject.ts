import * as yup from "yup";

export const DuplicateProjectSchema = yup
  .object({
    name: yup.string().required(),
  })
  .required();
