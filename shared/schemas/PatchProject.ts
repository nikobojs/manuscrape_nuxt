import * as yup from "yup";

export const PatchProjectSchema = yup
  .object({
    name: yup.string().optional(),
    description: yup.string().optional(),
    canDelockObservations: yup.boolean().optional(),
    ownerCanPatchObservations: yup.boolean().optional(),
    contributorsCanReadAllObservations: yup.boolean().optional(),
  })
  .required();
