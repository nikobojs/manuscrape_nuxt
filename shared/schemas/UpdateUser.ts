import * as yup from "yup";

export const UpdateUserSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .typeError("Email is not valid")
      .nullable(),
    name: yup
      .string()
      .required("Full name is required")
      .typeError("Full name is not valid"),
  })
  .required();
