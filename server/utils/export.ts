import excel from 'exceljs';
import { exportProjectQuery } from './prisma';
import type { H3Event } from 'h3';
import archiver from 'archiver'
import { calculateDynamicFieldValue } from './dynamicFields';
import { captureException } from '@sentry/node';


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

  // return row + three rows
  const row = [
    obs.id, 
    obs.createdAt,
    obs.updatedAt,
    ...fieldValues
  ];

  return row;
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
  const filename = `${cleanName(project.name)}-mastersheet-${dateString()}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer({ filename });

  // set http header that fixes control over the download filename
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // TODO: set the ms xlsx mimetype header

  // return excel file
  return buffer;
}


export async function generateProjectUploadsExport (event: H3Event, projectId: number) {
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
  const fileUploads = await prisma.fileUpload.findMany({
    where: { observationId: { in: observationIds }},
    select: {
      id: true,
      s3Path: true,
      mimetype: true,
      originalName: true,
      observationId: true,
    }
  });

  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  const obsFileCounts: Record<number, number> = {};
  
  for (const upload of fileUploads) {
    if (upload?.s3Path) {
      const res = await getS3Upload(upload.s3Path);
      if (res.$metadata.httpStatusCode === 200 && res.Body) {
        const byteArr = await res.Body.transformToByteArray();
        const buffer = Buffer.from(byteArr);

        let filenameDotSplit = upload.originalName.split('.').reverse();
        let fileEnding = '';
        if (filenameDotSplit.length > 1) fileEnding = '.' + filenameDotSplit[0];

        if (!(upload.observationId in obsFileCounts)) {
          obsFileCounts[upload.observationId] = 0;
        } else {
          obsFileCounts[upload.observationId]++;
        }

        const count = `.${obsFileCounts[upload.observationId]}`;

        archive.append(buffer, { name: upload.observationId + count + fileEnding });
      }
    }
  }

  archive.finalize();

  // set http header that fixes control over the download filename
  const filename = `${cleanName(project.name)}-uploads-${dateString()}.zip`;
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // set zip mime type
  setHeader(event, 'Content-Type','application/octet-stream');

  // return { observationImages, s3Paths }
  return archive;
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
  const filename = `${cleanName(project.name)}-images-${dateString()}.zip`;
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // set zip mime type
  setHeader(event, 'Content-Type','application/octet-stream');

  // return { observationImages, s3Paths }
  return archive;
}


function cleanName(unsafe: string): string {
  let result = unsafe.replace(/[^a-zA-Z0-9-_æøåÆØÅ\ ]/g, '')
  result = result.replaceAll(' ', '_');
  return result;
}

function dateString(date = new Date()): string {
  const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return formattedDate;
}