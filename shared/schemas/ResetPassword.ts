import * as yup from "yup";

export const ResetPasswordSchema = yup
  .object({
    password: yup
      .string()
      .required("Password is required")
      .typeError("Password is not valid")
      .min(3),
    token: yup
      .string()
      .required("Token is required")
      .typeError("Token is not valid")
      .min(3),
  })
  .required("Email is not defined");
