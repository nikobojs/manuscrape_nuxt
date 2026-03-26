import type { H3Event } from "h3";
import archiver from "archiver";
import { generateFilename } from "./helpers";
import { canUseS3 } from "../fileUpload";
import { getObservations } from "../observations";
import { SQL } from "drizzle-orm";

const archiverOptions: archiver.ArchiverOptions = {
  zlib: {
    level: 1,
    memLevel: 9,
    windowBits: 11,
  },
  highWaterMark: 2147483648, // max 2gb
};

export const generateProjectMediaExport = async (
  _event: H3Event,
  projectId: number,
  observationFilter: SQL<unknown>,
) => {
  // get project by projectId
  const [project] = await getSmallProjects([projectId])!;

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
  const obsImgs = await getImageUploadsByObservationIds(obsIds, {
    projectFieldId: true,
    observationId: true,
    filePath: true,
    isS3: true,
    originalName: true,
  });

  // ensure export is meaningful
  if (obsImgs.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "There are currenctly no images to download",
    });
  }

  // initialize archiver (zlib) and empty downloads-array
  const downloadPromises: Promise<any>[] = [];
  const archive = archiver("zip", archiverOptions);

  // pipe to file uploads destination
  const newFilePath = generateFilename(projectId, "MEDIA");
  const isTargetS3: boolean = canUseS3();
  const { upload, passThrough } = archiverUploadPipe(newFilePath, isTargetS3);
  archive.pipe(passThrough);

  // loop through all observation image and download each one of them
  for (let i = 0; i < obsImgs.length; i++) {
    const image = obsImgs[i]!;
    const id = image.observationId;
    if (!image?.filePath) continue;

    // create single file download promise
    const download = getUpload(image.filePath, image.isS3).then(
      ({ readable, s3 }) => {
        // get fileExtension
        let filenameDotSplit = image.originalName.split(".").reverse();
        let fileEnding = "";
        if (filenameDotSplit.length > 1) fileEnding = "." + filenameDotSplit[0];

        // clean up open sockets just in case
        readable.on("end", () => {
          if (s3) s3.destroy();
        });
        readable.on("close", () => {
          if (s3) s3.destroy();
        });

        // initialize download stream from s3 directly into zip file
        let name = id + "." + image.projectFieldId + fileEnding;
        archive.append(readable, { name });
      },
    );

    // add ongoing download promise to an array (so we can wait for all to finish)
    downloadPromises.push(download);
  }

  // wait for all downloads to finish
  await Promise.allSettled(downloadPromises);

  // start finalizing
  await archive.finalize();
  upload.done();

  const size = archive.pointer();

  return {
    filePath: newFilePath,
    isS3: isTargetS3,
    mimetype: "application/zip",
    observationsCount: obsImgs.length,
    size,
  };
};
