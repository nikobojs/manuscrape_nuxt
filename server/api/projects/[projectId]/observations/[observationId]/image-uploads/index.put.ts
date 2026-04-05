import { captureException } from "@sentry/node";
import formidable from "formidable";
import { setObservationUploadProgress } from "~~/server/utils/observations";
import * as yup from "yup";
import { requireProjectFieldById } from "~~/server/utils/projectFields";
import * as fs from "node:fs";
import { stripImageExif } from "~~/server/utils/imageUploads";

const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"];
const config = useRuntimeConfig();

const queryDto = yup
  .object({
    projectFieldId: yup.string().required(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params;
  const _query = getQuery(event);
  const query = await queryDto.validate(_query);
  const projectFieldId = parseIntParam(query.projectFieldId);
  const observationId = parseIntParam(params?.observationId);

  const observation = await getObservationById(observationId, {
    id: true,
    projectId: true,
    isDraft: true,
  });

  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }

  // ensure observation cannot be updated if its not a draft any more
  if (!observation.isDraft) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not allowed to patch locked observations",
    });
  }

  // ensure project field id is in the same project as the observation
  const projectField = await requireProjectFieldById(projectFieldId, {
    id: true,
    projectId: true,
    type: true,
  });
  if (projectField.projectId !== observation.projectId) {
    const errMsg =
      "The project field does not exist in the same project as the requested observation";
    captureException(errMsg);
    throw createError({
      status: 400,
      message: errMsg,
    });
  }

  // fetch existing image on this parameter
  const existingImage = await getImageUploadByObsAndField(
    observation.id,
    projectFieldId,
    {
      id: true,
      isS3: true,
      filePath: true,
    },
  );

  // define our fileupload helper config
  const form = formidable({
    allowEmptyFiles: false,
    maxFiles: 1,
    multiples: false,
    keepExtensions: true,
  });

  // parse files
  const [_, files] = await form.parse(event.node.req);

  // validate file was sent and save into variable 'file'
  if (!Object.keys(files).includes("file")) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image was sent",
    });
  } else if (files["file"]?.length !== 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only one image is allowed",
    });
  }
  const file = files["file"][0]!;

  // validate mimetypes
  if (
    !file.mimetype ||
    !allowedMimeTypes.includes(file.mimetype.toLowerCase())
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only JPEGS and PNGS are supported",
    });
  }

  // validate originalFilename
  if (!file.originalFilename) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image has no file name",
    });
  }

  if (file.size > config.public.maxImageSize) {
    throw createError({
      statusCode: 413,
      statusMessage: "Image file size is too big",
    });
  }

  await setObservationUploadProgress(observation.id, true);

  // extract fileextension (safe)
  const fileNameParts = file.newFilename.split(".");
  if (fileNameParts.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: "You cannot upload images without file extension",
    });
  }

  const extension = "." + file.newFilename.split(".").reverse()[0];

  // TODO: make into util fn
  // generate random string for a unique s3 name
  const randomAlphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
  const randomStr = new Array(42)
    .fill("0")
    .map(
      (_) => randomAlphabet[Math.floor(Math.random() * randomAlphabet.length)],
    )
    .join("");

  // read uploaded image into ram
  let buffer: Buffer<ArrayBufferLike> = await fs.promises.readFile(
    file.filepath,
  );

  // remove exif data + ensure it is actually a png or jpg (because parsing image)
  buffer = await stripImageExif(buffer);

  // upload file
  const newS3Path = `observations/${observationId}/${randomStr}${extension}`;
  await uploadFile(newS3Path, buffer, canUseS3());

  // remove existing image from database and s3 unless project field type is multiple images
  if (existingImage && projectField.type !== "IMAGE_MULTIPLE") {
    // delete existing ImageUpload row
    await deleteImageUpload(existingImage.id);
    try {
      // remove existing images on this observation in s3
      await deleteFiles(existingImage.filePath, existingImage.isS3);
    } catch (e: any) {
      // if unable to delete file, handle errors silently
      captureException(e);
    }
  }

  // create new ImageUpload row
  const { id: newImageUploadId } = await createImageUpload({
    mimetype: file.mimetype,
    originalName: file.originalFilename,
    filePath: `${newS3Path}`,
    isS3: canUseS3(),
    observationId: observation.id,
    projectFieldId: projectFieldId,
  });

  // adjust progress and updated at
  await setObservationUploadProgress(observation.id, false);

  return { success: true, imageUploadId: newImageUploadId };
});
