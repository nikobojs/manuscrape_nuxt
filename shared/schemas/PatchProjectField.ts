import * as yup from "yup";

export const PatchProjectFieldSchema = yup
  .object({
    label: yup.string(),
    required: yup.boolean(),
    choices: yup.array(yup.string().required()),
    index: yup.number(),
  })
  .required();
