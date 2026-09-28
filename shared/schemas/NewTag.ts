import * as yup from "yup";

export const NewTagSchema = yup.object({
  name: yup.string().trim().min(1).max(100).required(),
});
