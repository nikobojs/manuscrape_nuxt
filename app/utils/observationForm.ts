import {
  deserializeChoices,
  inputTypes,
} from "#shared/utils/observationFields";
import type { FormError } from "#ui/types";

function extractField(
  field: ProjectFieldResponse,
  inputArgs:
    | CMSMultipleChoiceProps
    | CMSInputProps
    | CMSTextAreaProps
    | CMSCheckboxProps
    | CMSImageProps
    | CMSImagesProps,
): CMSInput {
  const newField: CMSInput = {
    field: {
      id: field.id,
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

export function buildForm(fields: ProjectFieldResponse[]): {
  inputs: CMSInput[];
  imageInputs: CMSInput[];
} {
  const inputs: CMSInput[] = [];
  const imageInputs: CMSInput[] = [];

  const sortedFields = sortFieldsByIndex(fields);
  for (const field of sortedFields) {
    const useSimpleInput = Object.keys(inputTypes).includes(field.type);
    const typ = field.type;

    // if field is a basic type without need for initial state
    if (useSimpleInput) {
      const inputArgs: CMSInputProps = {
        placeholder: "Enter " + field.label,
        name: field.label,
        type: inputTypes["STRING"],
      };

      if (typ == "FLOAT") {
        inputArgs.type = inputTypes["FLOAT"];
        inputArgs.step = 0.1;
      } else if (typ == "INT") {
        inputArgs.type = inputTypes["INT"];
      } else if (typ == "DATETIME") {
        inputArgs.type = inputTypes["DATETIME"];
      } else if (typ == "DATE") {
        inputArgs.type = inputTypes["DATE"];
      } else if (typ != "STRING") {
        throw new Error(
          `Field with type '${field.type}' is not support :( Try again in an hour`,
        );
      }

      const newField = extractField(field, inputArgs);
      inputs.push(newField);
      // else if field is a special kind
    } else {
      if (typ == "BOOLEAN") {
        inputs.push(
          extractField(field, {
            label: field.label,
            name: field.label,
            type: "checkbox",
            checked: false,
          } as CMSCheckboxProps),
        );
      } else if (typ == "TEXTAREA") {
        inputs.push(
          extractField(field, {
            name: field.label,
          } as CMSTextAreaProps),
        );
        // multiple choice includes a few different file types
      } else if (isMultipleChoice(typ)) {
        if (!field.choices?.length) {
          throw new Error("Multiple choice type has no values to pick from");
        }

        inputs.push(
          extractField(field, {
            name: field.label,
          } as CMSMultipleChoiceProps),
        );
      } else if (["IMAGE_SINGLE", "IMAGE_MULTIPLE"].includes(typ)) {
        imageInputs.push(
          extractField(field, {
            label: field.label,
          } as CMSImageProps | CMSImagesProps),
        );
      } else {
        throw new Error(`Field with type '${field.type}' is not supported :(`);
      }
    } // end of if (useSimpleInput) if statement
  } // end of field loop

  return {
    inputs,
    imageInputs,
  };
}

export function getEmptyObservationData(project: FullProject) {
  const _defaultEmptyArrays: Record<string, Array<any>> = {};
  const _defaultBooleans: Record<string, boolean> = {};
  for (const field of project.fields) {
    if (isMultipleChoice(field.type)) {
      _defaultEmptyArrays[field.label] = [];
    } else if (field.type === "BOOLEAN") {
      _defaultBooleans[field.label] = false;
    }
  }

  let result = {
    ..._defaultEmptyArrays,
    ..._defaultBooleans,
  };
  return result;
}

// find custom user-added choices for multiple choice fields.
// this enables adding custom choices to choices-array, which will make them render on page load
export function getCustomFieldChoices(
  field: { label: string; choices: string[] | undefined },
  state: Ref<any>,
): string[] {
  if (!field.label) throw new Error("Field does not have a label");
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

export function sortFieldsByIndex<T extends { index: number }>(fields: T[]) {
  return [...fields].sort((a, b) => (a.index > b.index ? 1 : -1));
}

// TODO: validation function doesn't seem completely functional
//       - manuel edge-case testing required
export function validateObservationForm(
  state: Record<string, any>,
  fields: SmallProjectField[],
): FormError[] {
  const errors = [] as FormError[];

  // scan for missing fields
  const missingFields = fields.filter((f) => {
    return (
      f?.required &&
      state &&
      !Object.keys(state).includes(f.label) &&
      f.type !== "BOOLEAN"
    );
  });

  if (missingFields.length > 0) {
    for (const field of missingFields) {
      errors.push({ path: field.label, message: "Field is required" });
    }
  }

  if (!state) return errors;

  // validate each state value
  for (const [key, value] of Object.entries(state)) {
    // validate field (field)
    const field = fields.find((field) => field.label == key);
    if (!field) {
      throw createError({
        statusCode: 500,
        statusMessage: `Field '${key}' does not exist :(`,
      });
    }

    // check if field is required or optional
    if (field.required && (value === null || value === undefined)) {
      errors.push({ path: key, message: "Required" });
    }

    // validate numbers
    const typ = field.type;
    if (typ == "FLOAT" || typ == "INT") {
      const valueFloat = parseFloat("" + value);
      if (isNaN(valueFloat)) {
        errors.push({ path: key, message: "Invalid number" });
      }
    }

    // validate strings
    if (typ == "STRING") {
      // TODO: explain why
      if (("" + value).length === 0) {
        errors.push({ path: key, message: "Text field is required" });
      }
    }

    // validate dates
    // NOTE: only acceps dates in ISO string
    // TODO: check if field is required or optional
    else if (typ == "DATE" || typ == "DATETIME") {
      const valueDate = new Date("" + value);
      if (isNaN(valueDate.getTime())) {
        errors.push({ path: key, message: "Date field is invalid" });
      }
    }
  }

  return errors;
}

export function observationIsDeletable(
  obs?: Partial<FullObservation>,
  user?: CurrentUser,
  project?: Partial<FullProject>,
): boolean {
  // TODO: validate types of used variables instead
  if (!obs || !user || !project) {
    // report missing arguments
    console.error("missing arguments in observationIsDeletable()");
    return false;
  }

  // report missing author id
  if (!obs.user?.id) {
    console.error("missing observation user id");
    return false;
  }

  // find user role
  const role = user.projectAccess.find(
    (a) => a.project.id === project.id,
  )?.role;
  if (typeof role !== "string") {
    // report invalid role
    console.error(`Project access role '${role}' is not valid`);
    return false;
  }

  // find out if user is author of observation
  const isAuthor = obs.user.id === user.id;
  const isProjectOwner = role === "OWNER";
  const isDraft = obs.isDraft;

  // ensure observation cannot be removed if it isn't a draft and user is not owner
  if (!isDraft && !isProjectOwner) {
    return false;
  }

  // ensure owner cannot delete other users' drafts
  if (isDraft && !isAuthor) {
    return false;
  }

  return true;
}

export function observationIsDelockable(
  obs?: Partial<FullObservation>,
  user?: CurrentUser,
  project?: Partial<FullProject>,
): boolean {
  // TODO: validate types of used variables instead
  if (!obs || !user || !project) {
    // report missing arguments
    console.error("missing arguments in observationIsDelockable()");
    return false;
  }

  // report missing author id
  if (!obs.user?.id) {
    console.error("missing observation user id");
    return false;
  }

  // find user role
  const role = user.projectAccess.find(
    (a) => a.project.id === project.id,
  )?.role;
  if (typeof role !== "string") {
    // report invalid role
    console.error(`Project access role '${role}' is not valid`);
    return false;
  }

  // find out if user is author of observation
  const isAuthor = obs.user.id === user.id;
  const isProjectOwner = role === "OWNER";
  let isDelockable = false;
  if (isAuthor && project.authorCanDelockObservations) {
    isDelockable = true;
  } else if (isProjectOwner && project.ownerCanDelockObservations) {
    isDelockable = true;
  }
  return isDelockable;
}
