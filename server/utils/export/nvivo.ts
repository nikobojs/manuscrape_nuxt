import excel from 'exceljs';
import { calculateDynamicFieldValue } from '../dynamicFields';
import { captureException } from '@sentry/node';
import type { H3Event } from 'h3';
import { ExportType, Prisma } from '@prisma/client';
import { canUseS3 } from '../fileUpload';

function generateObservationRow(
  obs: FullObservationPayload,
  fields: AllFieldColumns[],
  dynamicFields: AllDynamicFieldColumns[],
  access: { nameInProject: string, userId: number }[],
) {
  // get list of field labels (which are also data-keys)
  const fieldLabels = fields.map(f => f.label);

  // initialize empty field value array in the same length as number of fields
  const fieldValues = new Array(fields.length + dynamicFields.length);

  // for each data entry
  const entries = Object.entries(obs.data as any)
  for(let i = 0; i < entries.length; i++) {
    const [key, rawVal] = entries[i];

    // get column index with that label
    const columnIndex = fieldLabels.indexOf(key);

    // if label doesn't exist, it must be from some older fields that wasn't deleted correctly
    if (columnIndex === -1) {
      captureException(`Label '${key}' does not exist`);
      return;
    }

    // initialize default cell value
    let val = rawVal;

    // replace carriage returns to support line feeds in windows excel
    if (typeof val === 'string') {
      val = val.replaceAll('\n', '\r\n');
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

  // get name / initials / alias for author of observation
  const { nameInProject } = access.find((a) => a.userId === obs.user?.id)
    || { nameInProject: '<deleted user>' };

  // define values in this observation row
  const row = [
    obs.id, 
    obs.createdAt,
    obs.updatedAt,
    nameInProject,
    ...fieldValues
  ];

  // return the row
  return row;
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
  }, {
    id: 4,
    header: 'Submitted by',
    width: 18,
  }];

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
  return Math.max(length, 16);
}

export const generateNvivoExport: ExportFn = async (
  event: H3Event,
  projectId: number,
  observationFilter: Prisma.ObservationWhereInput,
) => {
  // get project by projectId
  const project: ExportedProject | null = await prisma.project.findUnique({
    where: {
      id: projectId,
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

  // fetch related observations
  const observations: FullObservationPayload[] = await prisma.observation.findMany({
    where: observationFilter,
    select: observationColumns,
  });

  // initialize a few shortcut variables
  const fields: AllFieldColumns[] = project.fields;
  const dynamicFields: AllDynamicFieldColumns[] = project.dynamicFields;

  // ensure export is meaningful
  if (observations.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'There are no published observations on this project'
    });
  }

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
    const row = generateObservationRow(obs, fields, dynamicFields, project.contributors);
    return row;
  });

  // add the observation rows to the sheet
  sheet.addRows(observationRows)

  // write a buffer to ram
  const buffer = await wb.xlsx.writeBuffer();

  // upload excel file to s3
  const newPath = generateFilename(projectId, ExportType.NVIVO);
  await uploadFile(newPath, Buffer.from(buffer), canUseS3());

  // const mimetype = 'application/vnd.ms-excel';
  const mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return {
    filePath: newPath,
    isS3: canUseS3(),
    mimetype,
    observationsCount: observations.length,
    size: buffer.byteLength,
  }
}