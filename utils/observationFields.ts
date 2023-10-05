export enum FieldType {
  DATE = 'DATE',
  STRING = 'STRING',
  INT = 'INT',
  FLOAT = 'FLOAT',
  DATETIME = 'DATETIME',
  BOOLEAN = 'BOOLEAN',
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  CHOICE = 'CHOICE',
  TEXTAREA = 'TEXTAREA',
};

export const inputTypes: Record<string, string> = Object.freeze({
  [FieldType.DATE]: 'date',
  [FieldType.STRING]: 'text',
  [FieldType.INT]: 'number',
  [FieldType.FLOAT]: 'number',
  [FieldType.DATETIME]: 'datetime-local',
});

export const ObservationFieldTypes: Record<string, string> = {
  'Text (single line)': 'STRING',
  'Text (multi line)': 'TEXTAREA',
  'Whole number': 'INT',
  'Decimal number': 'FLOAT',
  'Date': 'DATE',
  'Date and time': 'DATETIME',
  'Checkbox': 'BOOLEAN',
  'Radio buttons': 'CHOICE',
  'Dropdown': 'AUTOCOMPLETE',
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
