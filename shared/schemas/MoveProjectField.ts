import * as yup from "yup";

export const MoveProjectFieldSchema = yup
  .object({
    up: yup.boolean().required(),
  })
  .required();
