import type { H3Event } from 'h3';
import archiver from 'archiver'
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { generateFilename } from './helpers';
import { ExportType, Prisma } from '@prisma/client';

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

  // pipe to s3
  const newS3Path = generateFilename(projectId, ExportType.MEDIA);
  const { upload, passThrough } = archiverUploadPipe(newS3Path);
  archive.pipe(passThrough);

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
  await upload.done();

  const size = archive.pointer();

  return {
    s3Path: newS3Path,
    mimetype: 'application/zip',
    observationsCount: observationImages.length,
    size,
  };
}
