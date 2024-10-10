const indexSorter = (
  a: { index: number },
  b: {index : number },
) => a.index === b.index ? 0 : a.index > b.index ? 1 : -1;

// TODO: write unit tests
export function hasValidIndexes(
  sortedFields: {
      index: number;
  }[]
): boolean {
    // check if indexes match loop index
    // NOTE: this checks if indexes are already correct
    let isValid = true;
    for (let i = 0; i < sortedFields.length; i++) {
      if (i !== sortedFields[i].index) {
        isValid = false;
        break;
      }
    };

    return isValid;
}

// TODO: write unit tests somehow
export async function enforceCorrectIndexes(
  fields: {
      index: number;
      id: number;
  }[]
) {
  const sortedExisting = fields.sort(indexSorter);

  // return early if sorting is not needed
  const indexesOk = hasValidIndexes(sortedExisting);
  if (indexesOk) {
    return;
  }

  // calculate correct indexes
  for (let i = 0; i < sortedExisting.length; i++) {
    sortedExisting[i].index = i;
  }

  // update indexes for existing fields
  await db.$transaction(
    sortedExisting.map(field =>
      db.projectField.update({
        where: { id: field.id },
        data: { index: field.index },
      })
    )
  )
}


export async function moveProjectField(
  up: boolean,
  fieldId: number,
  projectFields: { index: number, id: number }[],
) {
  // ensure field exists in projectFields
  const field = projectFields.find((f) => f.id === fieldId);
  if (!field) {
    throw createError({
      statusMessage: 'Field id does not exist in project',
      statusCode: 500,
    });
  }


  // ensure it cannot move below zero
  if (up && field.index <= 0) {
    throw createError({
      statusMessage: 'Cannot move parameter up, as it is already in the top',
      statusCode: 400,
    });
  } else if (!up && field.index >= projectFields.length - 1) {
    throw createError({
      statusMessage: 'Cannot move parameter down, as it is already in the top',
      statusCode: 400,
    });
  }

  // find swap field
  const fieldIndex = field.index;
  const swapIndex = up ? fieldIndex - 1 : fieldIndex + 1;
  const swapField = projectFields.find(f => f.index === swapIndex);
  if (!swapField) {
    throw createError({
      statusMessage: 'Unable to find project field to swap with',
      statusCode: 500,
    });
  }

  // swap indexes
  await db.$transaction([
    db.projectField.update({ where: { id: fieldId }, data: { index: -1 }}),
    db.projectField.update({ where: { id: swapField.id }, data: { index: fieldIndex }}),
    db.projectField.update({ where: { id: fieldId }, data: { index: swapIndex }}),
  ]);
}


// copy dynamic fields helper
// TODO: improve typing and test coverage
export function getNewFieldId (
  oldId: number,
  sourceProject: {fields: {id: number, label: string}[]},
  createdProject: {fields: {id: number, label: string}[]},
) {
  const oldField = sourceProject.fields?.find((f) => f.id === oldId);
  if (!oldField) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to copy dynamic field'
    });
  }
  const newField = createdProject.fields?.find(f => f.label === oldField.label);
  if (!newField) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to find newly created fields'
    });
  }

  return newField
}
