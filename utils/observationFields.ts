export enum FieldType {
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  AUTOCOMPLETE_ADD = 'AUTOCOMPLETE_ADD',
  MULTIPLE_CHOICE_ADD = 'MULTIPLE_CHOICE_ADD',
  BOOLEAN = 'BOOLEAN',
  CHOICE = 'CHOICE',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  FLOAT = 'FLOAT',
  INT = 'INT',
  STRING = 'STRING',
  TEXTAREA = 'TEXTAREA',
};

export const inputTypes: Record<string, string> = Object.freeze({
  [FieldType.DATETIME]: 'datetime-local',
  [FieldType.DATE]: 'date',
  [FieldType.FLOAT]: 'number',
  [FieldType.INT]: 'number',
  [FieldType.STRING]: 'text',
});

export const ObservationFieldTypes: Record<string, string> = {
  'Checkbox': 'BOOLEAN',
  'Date and time': 'DATETIME',
  'Date': 'DATE',
  'Decimal number': 'FLOAT',
  'Dropdown or text': 'AUTOCOMPLETE_ADD',
  'Multiple choice or free text': 'MULTIPLE_CHOICE_ADD',
  'Dropdown': 'AUTOCOMPLETE',
  'Radio buttons': 'CHOICE',
  'Text (multi line)': 'TEXTAREA',
  'Text (single line)': 'STRING',
  'Whole number': 'INT',
}

export function getFieldLabel(fieldType: string): string {
  const label = Object.entries(ObservationFieldTypes).find(
    ([_, key]) => key === fieldType
  );

  if (!label) {
    throw new Error('Observation field label does not exist')
  }

  return label[0];
}



export function isMultipleChoice(field: string): boolean {
  return ['CHOICE', 'AUTOCOMPLETE', 'AUTOCOMPLETE_ADD', 'MULTIPLE_CHOICE_ADD'].includes(field)
}

// helpers that convert choices (as string[] into concattedString)
export const choicesSeperator = '_%%%%%%_';
export const cleanChoiceStr = (s: string | undefined) => s ? s.replaceAll(choicesSeperator, '') : undefined;
export const serializeChoices = (c: string[] | null): string | undefined =>
  c ? c.map(cleanChoiceStr).join(choicesSeperator) : undefined;
export const deserializeChoices = (r: string | null | undefined): string[] | undefined =>
  r ? r.split(choicesSeperator) : undefined;
