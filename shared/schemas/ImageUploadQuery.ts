import * as yup from "yup";

export const ImageUploadQuerySchema = yup
  .object({
    projectFieldId: yup.string().required(),
    imageUploadId: yup.string().optional(),
  })
  .required();
