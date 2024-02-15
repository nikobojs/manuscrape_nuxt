import excel from 'exceljs';
import { exportProjectQuery } from './prisma';
import type { H3Event } from 'h3';
import archiver from 'archiver'
import { calculateDynamicFieldValue } from './dynamicFields';
import { captureException } from '@sentry/node';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

const archiverOptions: archiver.ArchiverOptions = {
  zlib: {
    level: 1,
    memLevel: 9,
    windowBits: 11
  },
  highWaterMark: 2147483648, // max 2gb
}


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
  }, {
    id: 4,
    header: 'Submitted by',
    width: 18,
  }
]

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
  const filename = `${cleanName(project.name)}-mastersheet-${dateString()}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer({ filename });

  // set http header that fixes control over the download filename
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // set the ms xlsx mimetype header
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

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

  // ensure export is meaningful
  if (fileUploads.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'There are no files uploaded to any observations'
    });
  }
  
  const downloads: Promise<any>[] = [];
  for (const upload of fileUploads) {
    if (!upload?.s3Path) continue;
    // add filedownload as promise to downloads[]
    const download = getS3Upload(upload.s3Path).then((res) => {
      if (res.$metadata.httpStatusCode !== 200 || !res.Body) {
        return;
      }

      // get fileExtension
      let filenameDotSplit = upload.originalName.split('.').reverse();
      let fileEnding = '';
      if (filenameDotSplit.length > 1) fileEnding = '.' + filenameDotSplit[0];

      // add new file counter for observation if necessary
      if (!(upload.observationId in obsFileCounts)) {
        obsFileCounts[upload.observationId] = 0;
      } else {
        obsFileCounts[upload.observationId]++;
      }

      // add upload counter (there might be more for each observation)
      const count = `.${obsFileCounts[upload.observationId]}`;

      // create and start stream;
      const _stream = res.Body.transformToWebStream();
      const stream = Readable.fromWeb(_stream as ReadableStream<any>)
      archive.append(stream, { name: upload.observationId + count + fileEnding })
    });

    // add ongoing download promise to an array (so we can wait for all to finish)
    downloads.push(download);
  }

  // await all parallel downloads and finalize archive
  await Promise.all(downloads);
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

  // ensure export is meaningful
  if (observationImages.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'There are currenctly no images to download'
    });
  }

  // initialize archiver (zlib) and empty downloads-array
  const downloads: Promise<any>[] = [];
  const archive = archiver('zip', archiverOptions);

  // loop through all observation image and download each one of them
  for (let i = 0; i < observationImages.length; i++) {
    const id = observationImages[i].id;
    const image = observationImages[i].image;
    if (!image?.s3Path) continue;

    // create single file download promise
    const download = getS3Upload(image.s3Path).then((res) => {
      // if result did not end well, reject and return
      if (res.$metadata.httpStatusCode !== 200 || !res.Body) {
        return Promise.reject('MinIO server returned ' + res.$metadata.httpStatusCode)
      }

      // get fileExtension
      let filenameDotSplit = image.originalName.split('.').reverse();
      let fileEnding = '';
      if (filenameDotSplit.length > 1) fileEnding = '.' + filenameDotSplit[0];

      // initialize download stream from s3 directly into zip file
      const _stream = res.Body.transformToWebStream();
      const stream = Readable.fromWeb(_stream as ReadableStream<any>)
      archive.append(stream, { name: id + fileEnding });
    });

    // add ongoing download promise to an array (so we can wait for all to finish)
    downloads.push(download);
  }

  // wait for all downloads to finish
  await Promise.all(downloads);

  // start finalizing
  archive.finalize();

  // set http header that fixes control over the download filename
  const filename = `${cleanName(project.name)}-images-${dateString()}.zip`;
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  // set zip mime type
  setHeader(event, 'Content-Type','application/octet-stream');
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