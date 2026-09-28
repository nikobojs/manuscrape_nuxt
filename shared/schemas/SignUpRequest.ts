import * as yup from "yup";

export const SignUpRequestSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .typeError("Email is not valid"),
    password: yup
      .string()
      .required("Password is required")
      .typeError("Password is not valid"),
    name: yup.string().optional().typeError("Full name is not valid"),
  })
  .required();
