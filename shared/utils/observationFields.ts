export const FieldTypeValues: Array<FieldType> = [
  "AUTOCOMPLETE",
  "AUTOCOMPLETE_ADD",
  "BOOLEAN",
  "CHOICE",
  "DATE",
  "DATETIME",
  "FLOAT",
  "INT",
  "MULTIPLE_CHOICE_ADD",
  "STRING",
  "TEXTAREA",
  "IMAGE_SINGLE",
  "IMAGE_MULTIPLE",
];

export type SimpleInputTypes = "DATETIME" | "DATE" | "FLOAT" | "INT" | "STRING";
export const inputTypes: Record<SimpleInputTypes, string> = Object.freeze({
  DATETIME: "datetime-local",
  DATE: "date",
  FLOAT: "number",
  INT: "number",
  STRING: "text",
});

export const ObservationFieldTypes: Record<string, FieldType> = {
  Checkbox: "BOOLEAN",
  "Date and time": "DATETIME",
  Date: "DATE",
  "Decimal number": "FLOAT",
  "Dropdown or text": "AUTOCOMPLETE_ADD",
  "Multiple choice or free text": "MULTIPLE_CHOICE_ADD",
  Dropdown: "AUTOCOMPLETE",
  "Radio buttons": "CHOICE",
  "Text (multi line)": "TEXTAREA",
  "Text (single line)": "STRING",
  "Single image": "IMAGE_SINGLE",
  "Multiple images": "IMAGE_MULTIPLE",
  "Whole number": "INT",
};

export function getFieldLabel(fieldType: string): string {
  const label = Object.entries(ObservationFieldTypes).find(
    ([_, key]) => key === fieldType,
  );

  if (!label) {
    throw new Error("Observation field label does not exist");
  }

  return label[0];
}

export function isMultipleChoice(field: string): boolean {
  return [
    "CHOICE",
    "AUTOCOMPLETE",
    "AUTOCOMPLETE_ADD",
    "MULTIPLE_CHOICE_ADD",
  ].includes(field);
}

// helpers that convert choices (as string[] into concattedString)
export const choicesSeperator = "_%%%%%%_";
export const cleanChoiceStr = (s: string | undefined) =>
  s ? s.replaceAll(choicesSeperator, "") : undefined;
export const serializeChoices = (c: string[] | null): string | undefined =>
  c ? c.map(cleanChoiceStr).join(choicesSeperator) : undefined;
export const deserializeChoices = (
  r: string | null | undefined,
): string[] | undefined => (r ? r.split(choicesSeperator) : undefined);
