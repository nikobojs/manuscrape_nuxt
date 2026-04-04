import { captureException } from "@sentry/node";
import yup from "yup";
import { dynamicProjectFields, projectFields } from "../drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";

type DynamicFieldSelect = Partial<
  Record<keyof typeof dynamicProjectFields.$inferSelect, boolean>
>;
type DynamicFieldInsert = Omit<
  typeof dynamicProjectFields.$inferSelect,
  "id" | "createdAt"
>;

export const fieldOperators: FieldOperator[] = ["DIFF", "SUM"];

export const NewDynamicFieldSchema = yup
  .object({
    field0Id: yup.number().required(),
    field1Id: yup.number().required(),
    label: yup.string().required(),
    operator: yup
      .mixed<(typeof fieldOperators)[number]>()
      .required()
      .oneOf(fieldOperators)
      .required(),
  })
  .required();

export const DynamicFieldsConfig: DynamicFieldsConfig = {
  DIFF: {
    pairs: [
      ["DATE", "DATE"],
      ["DATETIME", "DATETIME"],
      ["DATETIME", "DATE"],
      ["INT", "INT"],
      ["FLOAT", "FLOAT"],
      ["FLOAT", "INT"],
    ],
  },
  SUM: {
    pairs: [
      ["INT", "INT"],
      ["FLOAT", "FLOAT"],
      ["FLOAT", "INT"],
    ],
  },
};

export function requireAllowedMatch(
  field0: { label: string; type: FieldType | string },
  field1: { label: string; type: FieldType | string },
  operator: FieldOperator,
) {
  const allowedPairs = DynamicFieldsConfig[operator].pairs;
  const targetFieldTypes = [field0.type, field1.type];
  const allowedMatch = allowedPairs.find(
    ([a, b]) =>
      (a === targetFieldTypes[0] && b === targetFieldTypes[1]) ||
      (a === targetFieldTypes[1] && b === targetFieldTypes[0]),
  );

  if (!allowedMatch) {
    const err = createError({
      statusCode: 400,
      statusMessage: `The field types '${field0.type}' and '${field1.type}' does not support the provided operation`,
    });
    captureException(err);
    throw err;
  }

  return allowedMatch;
}

export function calculateDynamicFieldValue(
  dynamicField: FullDynamicProjectField,
  fields: SmallProjectField[],
  obs: FullObservation,
) {
  // get dynamic field match from config
  const field0 = fields.find((f) => f.id === dynamicField.field0Id);
  const field1 = fields.find((f) => f.id === dynamicField.field1Id);

  if (!field0 || !field1) {
    const errMsg =
      "Project fields referenced from dynamic field does not exist";
    captureException(errMsg);
    throw createError({
      statusMessage: errMsg,
      statusCode: 500,
    });
  }

  requireAllowedMatch(field0, field1, dynamicField.operator);

  // TODO: improve maintainability and readability
  let val0 = (obs.data as any)?.[field0.label];
  let val1 = (obs.data as any)?.[field1.label];
  const rawVals = [val0, val1];
  const types: FieldType[] = [field0.type, field1.type];
  const vals: number[] = [];
  let convertResultToDate = false;
  let result;

  if (dynamicField.operator === "DIFF") {
    for (let i = 0; i < 2; i++) {
      if (["DATE", "DATETIME"].some((t) => t === types[i])) {
        vals[i] = new Date(rawVals[i]).getTime();
        convertResultToDate = true;
      } else if (["FLOAT"].some((t) => t === types[i])) {
        vals[i] = parseFloat(rawVals[i]);
      } else if (["INT"].some((t) => t === types[i])) {
        vals[i] = parseInt(rawVals[i]);
      } else {
        const errMsg =
          "Dynamic field error: Provided fieldtypes is not supported";
        captureException(errMsg);
        throw createError({
          statusMessage: errMsg,
          statusCode: 501,
        });
      }
    }

    result = vals[0]! - vals[1]!;
  } else if (dynamicField.operator === "SUM") {
    for (let i = 0; i < 2; i++) {
      if (["FLOAT"].some((t) => t === types[i])) {
        vals[i] = parseFloat(rawVals[i]);
      } else if (["INT"].some((t) => t === types[i])) {
        vals[i] = parseInt(rawVals[i]);
      } else {
        throw createError({
          statusMessage:
            "Dynamic field error: Provided fieldtypes is not supported",
          statusCode: 501,
        });
      }
    }

    result = vals[0]! + vals[1]!;
  } else {
    throw createError({
      statusMessage: "Dynamic field error: The operation is not supported yet",
      statusCode: 501,
    });
  }

  if (convertResultToDate) {
    // presume result is a Date.getTime() delta (in milliseconds)
    // we'd like the response in days
    const secs = result / 1000;
    const mins = secs / 60;
    const hours = mins / 60;
    const days = Math.abs(Math.round(hours / 24));
    if (isNaN(days)) return "";
    return `${days} days`;
  } else {
    return result;
  }
}

export async function getDynamicFieldsByProjectIds<
  T extends Partial<Record<keyof DynamicFieldSelect, boolean>>,
>(projectIds: number[], select: T) {
  const res = await db.query.dynamicProjectFields.findMany({
    where: inArray(dynamicProjectFields.projectId, projectIds),
    columns: select,
  });
  return res;
}

export function createDynamicFields(
  projectId: number,
  fields: DynamicFieldInsert[],
) {
  const newDynamicFields = fields.map((f) => ({
    label: f.label!,
    operator: f.operator,
    field0Id: f.field0Id,
    field1Id: f.field1Id,
    projectId: projectId,
  }));

  return db.insert(dynamicProjectFields).values(newDynamicFields).returning({
    id: dynamicProjectFields.id,
  });
}

export async function getProjectFieldsInDynamicField(
  field: { field0Id: number; field1Id: number },
  projectId: number,
) {
  const fields = await db.query.projectFields.findMany({
    where: and(
      inArray(projectFields.id, [field.field0Id, field.field1Id]),
      eq(projectFields.projectId, projectId),
    ),
    columns: {
      id: true,
      choices: true,
      createdAt: true,
      index: true,
      label: true,
      projectId: true,
      required: true,
      type: true,
    },
  });
  return fields;
}

export function findDuplicateDynamicField(field: {
  field0Id: number;
  field1Id: number;
  operator: "DIFF" | "SUM";
}) {
  return db.query.dynamicProjectFields.findFirst({
    where: and(
      eq(dynamicProjectFields.field0Id, field.field0Id),
      eq(dynamicProjectFields.field1Id, field.field1Id),
      eq(dynamicProjectFields.operator, field.operator),
    ),
    columns: {
      id: true,
    },
  });
}
