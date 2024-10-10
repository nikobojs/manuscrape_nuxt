import { deserializeChoices } from './observationFields';

function extractField(
  field: ProjectFieldResponse,
  inputArgs: CMSMultipleChoiceProps | CMSInputProps | CMSTextAreaProps | CMSCheckboxProps,
): CMSInput {
  const newField: CMSInput = {
    field: {
      type: field.type as FieldType,
      index: field.index,
      label: field.label,
      choices: field.choices ? deserializeChoices(field.choices) : undefined,
      required: field.required,
    },
    props: inputArgs,
  };
  return newField;
}

export function buildForm(fields: ProjectFieldResponse[]): { initialState: any, inputs: CMSInput[] } {
  const inputs: CMSInput[] = [];
  const initialState: any = {}

  for (const field of fields) {

    const useSimpleInput = Object.keys(inputTypes).includes(field.type);
    const typ = field.type;

    // if field is a basic type without need for initial state
    if (useSimpleInput) {
      const inputArgs: CMSInputProps = {
        placeholder: 'Enter ' + field.label,
        name: field.label,
        type: inputTypes[FieldType.STRING],
      };

      if (typ == FieldType.FLOAT) {
        inputArgs.type = inputTypes[FieldType.FLOAT];
        inputArgs.step = 0.1;
      } else if (typ == FieldType.INT) {
        inputArgs.type = inputTypes[FieldType.INT];
      } else if (typ == FieldType.DATETIME) {
        inputArgs.type = inputTypes[FieldType.DATETIME];
      } else if (typ == FieldType.DATE) {
        inputArgs.type = inputTypes[FieldType.DATE];
      } else if (typ != FieldType.STRING) {
        throw new Error(`Field with type '${field.type}' is not support :( Try again in an hour`);
      }

      const newField = extractField(field, inputArgs);
      inputs.push(newField);
    // else if field is a special kind
    } else {
      if (typ == FieldType.BOOLEAN) {
        inputs.push(extractField(field, {
          label: field.label,
          name: field.label,
          type: 'checkbox',
          checked: false,
        } as CMSCheckboxProps));
        inputs.push(extractField(field, {
          label: field.label,
          name: field.label,
          type: 'checkbox',
          checked: false,
        } as CMSCheckboxProps));
      } else if(typ == FieldType.TEXTAREA) {
        inputs.push(extractField(field, {
          name: field.label,
        } as CMSTextAreaProps));
      // multiple choice includes a few different file types
      } else if (isMultipleChoice(typ)) {
        if (!field.choices?.length) {
          throw new Error('Multiple choice type has no values to pick from');
        }

        // add arrays for multiple choices types
        if (typ === 'MULTIPLE_CHOICE_ADD') {
          if (!initialState[field.label]) {
            initialState[field.label] = [];
          }
        } 

        inputs.push(extractField(field, {
          name: field.label,
        } as CMSMultipleChoiceProps));
      } else {
        throw new Error(`Field with type '${field.type}' is not supported :(`);
      }
    } // end of if (useSimpleInput) if statement
  } // end of field loop

  return {
    inputs,
    initialState,
  };
}

// find custom user-added choices for multiple choice fields.
// this enables adding custom choices to choices-array, which will make them render on page load
export function getCustomFieldChoices(
  field: { label: string, choices: string[] | undefined },
  state: Ref<any>
): string[] {
  if (!field.label) throw new Error('Field does not have a label');
  if (!Object.keys(state.value).includes(field.label)) return [];

  // if custom choices are picked, add them to field.choices
  if (!Array.isArray(field.choices) || field.choices.length == 0) {
    return [];
  } else {

    // TODO: fix ! when typescript fixed itself...
    const customChoices = state.value[field.label]
      .map((v: { label: string }) => v.label)
      .filter((v: string) => !field.choices!.includes(v));
    
    // const stateForField = state.value[field.label] - TODO: what is this?
    return customChoices;
  }
}
