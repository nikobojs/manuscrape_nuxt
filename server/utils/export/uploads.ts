import type { H3Event } from 'h3';
import archiver from 'archiver'
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { generateFilename } from './helpers';
import { ExportType, Prisma } from '@prisma/client';
import { canUseS3 } from '../fileUpload';



export const generateProjectUploadsExport: ExportFn = async (
  event: H3Event,
  projectId: number,
  observationFilter: Prisma.ObservationWhereInput,
) => {
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

  
  // fetch related observations
  const observations: { id: number }[] = await prisma.observation.findMany({
    where: observationFilter,
    select: { id: true },
  });


  // array of observation ids
  const observationIds = observations.map(o => o.id);

  // get observation images for download by observationIds
  const fileUploads = await prisma.fileUpload.findMany({
    where: { observationId: { in: observationIds }},
    select: {
      id: true,
      filePath: true,
      isS3: true,
      mimetype: true,
      originalName: true,
      observationId: true,
    }
  });


  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  archive.on("error", function (err) {
    throw err;
  });
  archive.on("warning", function (warn) {
    console.warn(warn);
  });

  // pipe to s3
  const newS3Path = generateFilename(projectId, ExportType.UPLOADS);
  const { upload, passThrough } = archiverUploadPipe(newS3Path, canUseS3());
  archive.pipe(passThrough);

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
    if (!upload?.filePath) continue;
    // add filedownload as promise to downloads[]
    const download = getUpload(upload.filePath, canUseS3()).then((readable) => {
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

      archive.append(readable, { name: upload.observationId + count + fileEnding });
    });

    // add ongoing download promise to an array (so we can wait for all to finish)
    downloads.push(download);
  }

  // await all parallel downloads and finalize archive
  await Promise.all(downloads);
  await archive.finalize();
  await upload.done();

  const size = archive.pointer();

  return {
    filePath: newS3Path,
    isS3: canUseS3(),
    mimetype: 'application/zip',
    observationsCount: observationIds.length,
    size,
  };
}
