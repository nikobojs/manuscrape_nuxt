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
  await prisma.$transaction(
    sortedExisting.map(field =>
      prisma.projectField.update({
        where: { id: field.id },
        data: { index: field.index },
      })
    )
  )
}