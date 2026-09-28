import * as yup from "yup";
import type { FieldType } from "../types";
import { FieldTypeValues } from "../utils/observationFields";

export const NewProjectFieldSchema = yup
  .object({
    label: yup.string().required(),
    type: yup.mixed<FieldType>().required().oneOf(FieldTypeValues).required(),
    required: yup.boolean().required(),
    choices: yup.array().of(yup.string().required()).optional(),
    index: yup.number().required(),
  })
  .required();

export const NewProjectSchema = yup
  .object({
    name: yup.string().required(),
    fields: yup.array().of(NewProjectFieldSchema).required(),
  })
  .required();
