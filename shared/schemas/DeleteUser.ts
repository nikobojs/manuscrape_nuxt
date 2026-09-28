import * as yup from "yup";

export const DeleteUserSchema = yup
  .object({
    password: yup.string().typeError("Password is not valid"),
  })
  .required();
