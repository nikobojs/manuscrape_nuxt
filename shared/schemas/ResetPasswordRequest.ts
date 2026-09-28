import * as yup from "yup";

export const ResetPasswordRequestSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .typeError("Email is not valid"),
  })
  .required("Email is not defined");
