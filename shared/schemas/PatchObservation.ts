import * as yup from "yup";

export const PatchObservationSchema = yup
  .object({
    isDraft: yup.bool().optional(),
    data: yup.object().optional(),
    tags: yup
      .object()
      .shape({
        connect: yup
          .array()
          .of(yup.object({ id: yup.number().required() }))
          .optional(),
        disconnect: yup
          .array()
          .of(yup.object({ id: yup.number().required() }))
          .optional(),
      })
      .optional(),
  })
  .required();
