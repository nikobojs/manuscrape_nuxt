import * as yup from "yup";

export const ReorderProjectFieldsSchema = yup
  .object({
    fieldIndexes: yup
      .array(
        yup.object({
          id: yup.number().required(),
          index: yup.number().required(),
        })
      )
      .required(),
  })
  .required();
