import { count, eq, inArray } from "drizzle-orm";
import { projectFields } from "../drizzle/schema";

const indexSorter = (a: { index: number }, b: { index: number }) =>
  a.index === b.index ? 0 : a.index > b.index ? 1 : -1;

type ProjectFieldSelect = Partial<
  Record<keyof typeof projectFields.$inferSelect, boolean>
>;
type ProjectFieldPatch = Partial<
  Omit<typeof projectFields.$inferInsert, "id" | "projectId" | "createdAt">
>;

// TODO: write unit tests
export function hasValidIndexes(
  sortedFields: {
    index: number;
  }[],
): boolean {
  // check if indexes match loop index
  // NOTE: this checks if indexes are already correct
  let isValid = true;
  for (let i = 0; i < sortedFields.length; i++) {
    if (i !== sortedFields[i]!.index) {
      isValid = false;
      break;
    }
  }

  return isValid;
}

export function createProjectFields(
  projectId: number,
  fields: {
    choices?: string[] | undefined;
    label: string;
    type: FieldType;
    required: boolean | undefined;
    index: number;
  }[],
) {
  const newProjectFields = fields.map((f) => ({
    label: f.label!,
    type: f.type!,
    required: f.required,
    projectId: projectId,
    choices: serializeChoices(f.choices || null),
    index: f.index,
  }));

  return db.insert(projectFields).values(newProjectFields).returning({
    id: projectFields.id,
    index: projectFields.index,
  });
}

// TODO: write unit tests somehow
export async function enforceCorrectIndexes(
  fields: {
    index: number;
    id: number;
  }[],
) {
  const sortedExisting = fields.sort(indexSorter);

  // return early if sorting is not needed
  const indexesOk = hasValidIndexes(sortedExisting);
  if (indexesOk) {
    return;
  }

  // calculate correct indexes
  for (let i = 0; i < sortedExisting.length; i++) {
    sortedExisting[i]!.index = i;
  }

  // update indexes for existing fields
  await db.transaction(async (tx) => {
    for (const field of sortedExisting) {
      await tx
        .update(projectFields)
        .set({ index: field.index })
        .where(eq(projectFields.id, field.id));
    }
  });
}

export async function moveProjectField(
  up: boolean,
  fieldId: number,
  _projectFields: { index: number; id: number }[],
) {
  // ensure field exists in projectFields
  const field = _projectFields.find((f) => f.id === fieldId);
  if (!field) {
    throw createError({
      statusMessage: "Field id does not exist in project",
      statusCode: 500,
    });
  }

  // ensure it cannot move below zero
  if (up && field.index <= 0) {
    throw createError({
      statusMessage: "Cannot move parameter up, as it is already in the top",
      statusCode: 400,
    });
  } else if (!up && field.index >= _projectFields.length - 1) {
    throw createError({
      statusMessage: "Cannot move parameter down, as it is already in the top",
      statusCode: 400,
    });
  }

  // find swap field
  const fieldIndex = field.index;
  const swapIndex = up ? fieldIndex - 1 : fieldIndex + 1;
  const swapField = _projectFields.find((f) => f.index === swapIndex);
  if (!swapField) {
    throw createError({
      statusMessage: "Unable to find project field to swap with",
      statusCode: 500,
    });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(projectFields)
      .set({ index: -1 })
      .where(eq(projectFields.id, fieldId));
    await tx
      .update(projectFields)
      .set({ index: fieldIndex })
      .where(eq(projectFields.id, swapField.id));
    await tx
      .update(projectFields)
      .set({ index: swapIndex })
      .where(eq(projectFields.id, fieldId));
  });
}

// copy dynamic fields helper
// TODO: improve typing and test coverage
export function getNewFieldId(
  oldId: number,
  sourceFields: { id: number; label: string }[],
  createdFields: { id: number; label: string }[],
) {
  const oldField = sourceFields?.find((f) => f.id === oldId);
  if (!oldField) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to copy dynamic field",
    });
  }
  const newField = createdFields?.find((f) => f.label === oldField.label);
  if (!newField) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to find newly created fields",
    });
  }

  return newField;
}

export async function requireProjectFieldById<
  T extends Partial<Record<keyof ProjectFieldSelect, boolean>>,
>(projectFieldId: number, select: T) {
  const res = await getProjectFieldById(projectFieldId, select);
  if (!res)
    throw createError({
      status: 404,
      message: "Project field id does not exist",
    });
  return res;
}

export function getProjectFieldById<
  T extends Partial<Record<keyof ProjectFieldSelect, boolean>>,
>(projectFieldId: number, select: T) {
  return db.query.projectFields.findFirst({
    where: eq(projectFields.id, projectFieldId),
    columns: select,
  });
}

export async function getProjectFieldsByProjectIds<
  T extends Partial<Record<keyof ProjectFieldSelect, boolean>>,
>(projectIds: number[], select: T) {
  const res = await db.query.projectFields.findMany({
    where: inArray(projectFields.projectId, projectIds),
    columns: select,
  });
  return res;
}

export async function getProjectFieldCountByProjectId(
  projectId: number,
): Promise<number> {
  const res = await db
    .select({ count: count(projectFields.id) })
    .from(projectFields)
    .where(eq(projectFields.projectId, projectId));
  return res?.[0]?.count || 0;
}

export function deleteProjectField(fieldId: number) {
  return db.delete(projectFields).where(eq(projectFields.id, fieldId));
}

export function updateProjectField(fieldId: number, patch: ProjectFieldPatch) {
  return db
    .update(projectFields)
    .set(patch)
    .where(eq(projectFields.id, fieldId));
}
