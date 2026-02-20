import type { H3Event } from "h3";
import archiver from "archiver";
import { generateFilename } from "./helpers";
import { canUseS3 } from "../fileUpload";
import { SQL } from "drizzle-orm";

export const generateProjectUploadsExport = async (
  event: H3Event,
  projectId: number,
  observationFilter: SQL<unknown>,
) => {
  const [project] = await getSmallProjects([projectId]);

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project does not exist",
    });
  }

  // get observation images for download by observationIds
  const obs = await getObservations({ id: true }, observationFilter);
  const obsIds = obs.map((o) => o.id);

  // ensure there is something to export
  if (obsIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "There are no files to export",
    });
  }

  // get observation images for download by observationIds
  const obsFiles = await getFileUploadsByObservationIds(obsIds, {
    id: true,
    filePath: true,
    isS3: true,
    mimetype: true,
    originalName: true,
    observationId: true,
  });

  // ensure export is meaningful
  if (obsFiles.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "There are no files uploaded to any observations",
    });
  }

  const archive = archiver("zip", {
    zlib: {
      level: 1,
      memLevel: 9,
      windowBits: 11,
    },
    highWaterMark: 2147483648, // max 2gb
  });

  archive.on("error", function (err) {
    console.error(err);
    // TODO: report error
  });
  archive.on("warning", function (warn) {
    console.warn(warn);
  });

  // pipe to s3
  const newS3Path = generateFilename(projectId, "UPLOADS");
  const { upload, passThrough } = archiverUploadPipe(newS3Path, canUseS3());
  archive.pipe(passThrough);

  const obsFileCounts: Record<number, number> = {};

  const downloads: Promise<any>[] = [];
  for (const upload of obsFiles) {
    if (!upload?.filePath) continue;

    // add filedownload as promise to downloads[]
    const download = getUpload(upload.filePath, upload.isS3).then(
      ({ readable, s3 }) => {
        // get fileExtension
        let filenameDotSplit = upload.originalName.split(".").reverse();
        let fileEnding = "";
        if (filenameDotSplit.length > 1) fileEnding = "." + filenameDotSplit[0];

        // add new file counter for observation if necessary
        if (!(upload.observationId in obsFileCounts)) {
          obsFileCounts[upload.observationId] = 0;
        } else {
          obsFileCounts[upload.observationId]!++;
        }
        // add upload counter (there might be more for each observation)
        const count = `.${obsFileCounts[upload.observationId]}`;

        // clean up open sockets just in case
        readable.on("end", () => {
          if (s3) s3.destroy();
        });
        readable.on("close", () => {
          if (s3) s3.destroy();
        });

        archive.append(readable, {
          name: upload.observationId + count + fileEnding,
        });
      },
    );

    // add ongoing download promise to an array (so we can wait for all to finish)
    downloads.push(download);
  }

  // await all parallel downloads and finalize archive
  await Promise.allSettled(downloads);
  await archive.finalize();
  upload.done();

  const size = archive.pointer();

  return {
    filePath: newS3Path,
    isS3: canUseS3(),
    mimetype: "application/zip",
    observationsCount: obsIds.length,
    size,
  };
};
