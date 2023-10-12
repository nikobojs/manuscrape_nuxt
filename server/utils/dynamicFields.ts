import { FieldType, FieldOperator } from "@prisma/client";
import yup from 'yup';

export const fieldOperators = Object.values(FieldOperator);

export const NewDynamicFieldSchema = yup.object({
  field0Id: yup.number().required(),
  field1Id: yup.number().required(),
  label: yup.string().required(),
  operator: yup.mixed<typeof fieldOperators[number]>().required().oneOf(
    Object.values(FieldOperator)
  ).required(),
}).required();

export const DynamicFieldsConfig: DynamicFieldsConfig = {
  [FieldOperator.DIFF]: {
    pairs: [
      [FieldType.DATE, FieldType.DATE],
      [FieldType.DATETIME, FieldType.DATETIME],
      [FieldType.DATETIME, FieldType.DATE],
      [FieldType.INT, FieldType.INT],
      [FieldType.FLOAT, FieldType.FLOAT],
      [FieldType.FLOAT, FieldType.INT],
    ]
  },
  [FieldOperator.SUM]: {
    pairs: [
      [FieldType.INT, FieldType.INT],
      [FieldType.FLOAT, FieldType.FLOAT],
      [FieldType.FLOAT, FieldType.INT],
    ]
  }
}

export function calculateDynamicFieldValue(
  dynamicField: AllDynamicFieldColumns,
  fields: AllFieldColumns[],
  obs: FullObservationPayload,
) {
  // get dynamic field match from config
  const field0 = dynamicField.field0;
  const field1 = dynamicField.field1;
  const targetFieldTypes = [field0.type, field1.type];
  const allowedPairs = DynamicFieldsConfig[dynamicField.operator].pairs;
  const allowedMatch = allowedPairs.find((pair) => pair.every(t => targetFieldTypes.includes(t)));

  // ensure there is a matching dynamic field config
  if (!allowedMatch) {
    // TODO: report error
    const fieldNames = fields.map(f => `'${f.label}'`);
    throw createError({
      statusCode: 400,
      statusMessage: `The fields ${fieldNames.map(f => `'${f}'`).join(' and ')} does not support the provided operation`,
    });
  }

  // TODO: improve maintainability and readability
  let val0 = (obs.data as any)?.[field0.label];
  let val1 = (obs.data as any)?.[field1.label];
  const rawVals = [val0, val1];
  const types: (keyof typeof FieldType)[] = [field0.type, field1.type];
  const vals: number[] = [];
  let convertResultToDate = false;
  let result;

  if (dynamicField.operator === FieldOperator.DIFF) {
    for (let i = 0; i < 2; i++) {
      if ([FieldType.DATE, FieldType.DATETIME].some((t) => t === types[i])) {
        vals[i] = new Date(rawVals[i]).getTime();
        convertResultToDate = true;
      } else if ([FieldType.FLOAT].some((t) => t === types[i])) {
        vals[i] = parseFloat(rawVals[i]);
      } else if ([FieldType.INT].some((t) => t === types[i])) {
        vals[i] = parseInt(rawVals[i]);
      } else {
        throw createError({
          statusMessage: 'Dynamic field error: Provided fieldtypes is not supported',
          statusCode: 501,
        });
      }
    }

    result = vals[0] - vals[1];
  } else if (dynamicField.operator === FieldOperator.SUM) {
    for (let i = 0; i < 2; i++) {
      if ([FieldType.FLOAT].some((t) => t === types[i])) {
        vals[i] = parseFloat(rawVals[i]);
      } else if ([FieldType.INT].some((t) => t === types[i])) {
        vals[i] = parseInt(rawVals[i]);
      } else {
        throw createError({
          statusMessage: 'Dynamic field error: Provided fieldtypes is not supported',
          statusCode: 501,
        });
      }
    }

    result = vals[0] + vals[1];
  } else {
    throw createError({
      statusMessage: 'Dynamic field error: The operation is not supported yet',
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
    if (isNaN(days)) return '';
    return `${days} days`;
  } else {
    return result;
  }
}

