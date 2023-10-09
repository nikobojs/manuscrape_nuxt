export enum FieldType {
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  AUTOCOMPLETE_ADD = 'AUTOCOMPLETE_ADD',
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
  'Dropdown': 'AUTOCOMPLETE',
  'Radio buttons': 'CHOICE',
  'Text (multi line)': 'TEXTAREA',
  'Text (single line)': 'STRING',
  'Whole number': 'INT',
}

export function isMultipleChoice(field: string): boolean {
  return ['CHOICE', 'AUTOCOMPLETE', 'AUTOCOMPLETE_ADD'].includes(field)
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
