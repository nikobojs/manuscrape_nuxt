import * as yup from "yup";

export const TokenSignInRequestSchema = yup
  .object({
    token: yup
      .string()
      .required("Token is required")
      .typeError("Token is not valid"),
  })
  .required();
