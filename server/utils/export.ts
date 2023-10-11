import excel from 'exceljs';
import { exportProjectQuery } from './prisma';
import type { H3Event } from 'h3';
import { FieldOperator, FieldType } from '@prisma/client';
import { DynamicFieldsConfig } from '../api/projects/[projectId]/dynamic-fields/index.post';
import archiver from 'archiver'


function generateObservationRow(
  obs: FullObservationPayload,
  fields: AllFieldColumns[],
  dynamicFields: AllDynamicFieldColumns[],
) {
  // get list of field labels (which are also data-keys)
  const fieldLabels = fields.map(f => f.label);

  // initialize empty field value array in the same length as number of fields
  const fieldValues = new Array(fields.length + dynamicFields.length);

  // for each data entry
  const entries = Object.entries(obs.data as any)
  for(let i = 0; i < entries.length; i++) {
    const [key, val] = entries[i];

    // get column index with that label
    const columnIndex = fieldLabels.indexOf(key);

    // if label doesn't exist, it must be from some older fields that wasn't deleted correctly
    if (columnIndex === -1) {
      console.warn('Label does not exist');
      // TODO: report
      return;
    }

    // set column value on the found column index
    fieldValues[columnIndex] = val;
  }

  // calculate and add the dynamic values to the row 
  const dynamicFieldsIndexOffset = fieldValues.length - dynamicFields.length;
  for (let i = 0; i < dynamicFields.length; i++) {
    const val = calculateDynamicFieldValue(dynamicFields[i], fields, obs);
    const columnIndex = i + dynamicFieldsIndexOffset;
    fieldValues[columnIndex] = val;
  }

  // return row + three rows
  const row = [
    obs.id, 
    obs.createdAt,
    obs.updatedAt,
    ...fieldValues
  ];

  return row;
}


// TODO: move function to a better place
function calculateDynamicFieldValue(
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

    result = vals[1] - vals[0];
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
    const days = Math.round(hours / 24);
    return `${days} days`;
  } else {
    return result;
  }
}


// NOTE: this is a very random thing to do. Should be replaced
// Takes a string and returns it's approximate column width (in excel terms)
function calculateTextWidth(label: string): number {
  let thins = 0;
  let bigs = 0;
  const thinLetters = 'iljI1.,\'! '.split('');
  const wideLetters = 'mwMNOUVWXZÆØ'.split('');
  const labelSplit = label.split('');

  thinLetters.forEach(c => {
    thins += labelSplit.filter(_c => _c === c).length;
  });
  wideLetters.forEach(c => {
    bigs += labelSplit.filter(_c => _c === c).length;
  });

  const otherLetters = label.length - thins - bigs;
  const length = thins*0.6 + bigs*1.3 + otherLetters * 1 + 1;
  return length
}

function getWorksheetColumns(
  fields: AllFieldColumns[],
  dynamicFields: AllDynamicFieldColumns[],
): Partial<excel.Column>[] {
  const predefinedColumns = [{
    id: 0,
    header: 'Observation Id',
    width: 14,
  }, {
    id: 1,
    header: 'Created At',
    width: 14,
  }, {
    id: 2,
    header: 'Last update',
    width: 14,
  }]

  const dataColumns: Partial<excel.Column>[] = fields.map((field, index) => {
    return {
      header: field.label,
      width: calculateTextWidth(field.label),
      id: index + predefinedColumns.length,
    };
  });

  const dynamicColumns: Partial<excel.Column>[] = dynamicFields.map((field, index) => {
    return {
      header: field.label,
      width: calculateTextWidth(field.label),
      id: index + predefinedColumns.length + dataColumns.length,
    };
  });

  return [...predefinedColumns, ...dataColumns, ...dynamicColumns];
}


export async function generateNvivoExport(projectId: number, event: H3Event) {
  // get project by projectId
  const project: ExportedProject | null = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: exportProjectQuery,
  });

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project does not exist'
    });
  }

  // initialize a few shortcut variables
  const observations: FullObservationPayload[] = project.observations;
  const fields: AllFieldColumns[] = project.fields;
  const dynamicFields: AllDynamicFieldColumns[] = project.dynamicFields;

  // create workbook and set some metadata
  const wb = new excel.Workbook();
  wb.created = new Date();
  wb.modified = new Date();  

  // create our first (and only?) sheet
  const sheet = wb.addWorksheet('Observations');

  // set the columns (adds column widths and column header cells)
  sheet.columns = getWorksheetColumns(fields, dynamicFields);

  // create all our observation rows for this project
  const observationRows = observations.map((obs) => {
    const row = generateObservationRow(obs, fields, dynamicFields);
    return row;
  });

  // add the observation rows to the sheet
  sheet.addRows(observationRows)

  // write a buffer to ram
  const filename = 'nvivo_export.xlsx'
  const buffer = await wb.xlsx.writeBuffer({ filename });

  // set http header that fixes control over the download filename
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // TODO: set the ms xlsx mimetype header

  // return excel file
  return buffer;
}


export async function generateProjectMediaExport (event: H3Event, projectId: number) {
  // get project by projectId
  const project: ExportedProject | null = await prisma.project.findUnique({
    where: {
      id: projectId
    },
    select: exportProjectQuery,
  });

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project does not exist'
    });
  }

  // array of observation ids
  const observationIds = project.observations.map(o => o.id);

  // get observation images for download by observationIds
  const observationImages = await prisma.observation.findMany({
    where: { id: { in: observationIds }},
    select: {
      id: true,
      image: {
        select: {
          s3Path: true,
          originalName: true,
        }
      }
    }
  });

  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });
  for (const { id, image } of observationImages) {
    if (image?.s3Path) {
      const res = await getS3Upload(image.s3Path);
      if (res.$metadata.httpStatusCode === 200 && res.Body) {
        const byteArr = await res.Body.transformToByteArray();
        const buffer = Buffer.from(byteArr);

        let filenameDotSplit = image.originalName.split('.').reverse();
        let fileEnding = '';
        if (filenameDotSplit.length > 1) fileEnding = '.' + filenameDotSplit[0];
        archive.append(buffer, { name: id + fileEnding });
      }
    }
  }
  archive.finalize();

  // set http header that fixes control over the download filename
  const filename = 'export.zip';
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // set zip mime type
  setHeader(event, 'Content-Type','application/octet-stream');

  // return { observationImages, s3Paths }
  return archive;
}