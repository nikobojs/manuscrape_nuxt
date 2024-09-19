import type { H3Event } from 'h3';
import archiver from 'archiver'
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { generateFilename } from './helpers';
import { ExportType, Prisma } from '@prisma/client';
import { canUseS3 } from '../fileUpload';

const archiverOptions: archiver.ArchiverOptions = {
  zlib: {
    level: 1,
    memLevel: 9,
    windowBits: 11
  },
  highWaterMark: 2147483648, // max 2gb
}


export const generateProjectMediaExport: ExportFn = async (
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

  // get observation images for download by observationIds
  const observationImages = await prisma.observation.findMany({
    where: observationFilter,
    select: {
      id: true,
      image: {
        select: {
          isS3: true,
          filePath: true,
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

  // pipe to file uploads destination
  const newFilePath = generateFilename(projectId, ExportType.MEDIA);
  const isTargetS3 = canUseS3();
  const { upload, passThrough } = archiverUploadPipe(newFilePath, isTargetS3);
  archive.pipe(passThrough);

  // loop through all observation image and download each one of them
  for (let i = 0; i < observationImages.length; i++) {
    const id = observationImages[i].id;
    const image = observationImages[i].image;
    if (!image?.filePath) continue;

    // create single file download promise
    const download = getUpload(image.filePath, image.isS3).then((readable) => {
      // get fileExtension
      let filenameDotSplit = image.originalName.split('.').reverse();
      let fileEnding = '';
      if (filenameDotSplit.length > 1) fileEnding = '.' + filenameDotSplit[0];

      // initialize download stream from s3 directly into zip file
      archive.append(readable, { name: id + fileEnding });
    });

    // add ongoing download promise to an array (so we can wait for all to finish)
    downloads.push(download);
  }

  // wait for all downloads to finish
  await Promise.all(downloads);

  // start finalizing
  archive.finalize();
  await upload.done();

  const size = archive.pointer();

  return {
    filePath: newFilePath,
    isS3: isTargetS3,
    mimetype: 'application/zip',
    observationsCount: observationImages.length,
    size,
  };
}
