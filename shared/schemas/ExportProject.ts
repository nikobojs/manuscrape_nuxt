import * as yup from "yup";
import type { ExportType } from "../types";

export const ExportProjectSchema = yup
  .object({
    type: yup
      .mixed<ExportType>()
      .oneOf(["MEDIA", "NVIVO", "UPLOADS"])
      .required(),
    startDate: yup
      .string()
      .required()
      .test((s) => !isNaN(new Date(s).getDate())),
    endDate: yup
      .string()
      .required()
      .test((s) => !isNaN(new Date(s).getDate())),
    includeTags: yup.boolean().required(),
  })
  .required();
