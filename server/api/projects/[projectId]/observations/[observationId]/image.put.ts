
import { captureException } from '@sentry/node';
import formidable from 'formidable';

const allowedMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
const config = useRuntimeConfig();

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params;
  const observationId = parseIntParam(params?.observationId);
  const observation = await db.observation.findUnique({
    select: {
      id: true,
      image: {
        select: {
          id: true,
        }
      },
      isDraft: true,
    },
    where: {
      id: observationId,
    }
  });

  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Observation was not found',
    })
  }

  // ensure observation cannot be updated if its not a draft any more
  if (!observation.isDraft) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not allowed to patch locked observations',
    });
  }

  const existingImageId = observation.image?.id;

  // define our fileupload helper config
  const form = formidable({
    allowEmptyFiles: false,
    maxFiles: 1,
    multiples: false,
    keepExtensions: true,
  });

  // parse files
  const [_fields, files] = await form.parse(event.req)
  
  // validate file was sent and save into variable 'file'
  if (!Object.keys(files).includes('file')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No image was sent'
    })
  } else if (files['file']?.length !== 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only one image is allowed'
    })
  }
  const file = files['file'][0];

  // validate mimetypes
  if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only JPEGS and PNGS are supported'
    })
  }

  // validate originalFilename
  if (!file.originalFilename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image has no file name'
    });
  }

  if (file.size > config.public.maxImageSize) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Image file size is too big'
    });
  }

  // set observation.uploadInProgress to true
  await db.observation.update({
    where: { id: observation.id },
    data: { uploadInProgress: true, updatedAt: new Date() }
  });

  // extract fileextension (safe)
  const fileNameParts = file.newFilename.split('.');
  const extension = fileNameParts.length > 1 ? '.' + file.newFilename.split('.').reverse()[0] : '';

  // generate random string for a unique s3 name
  const randomAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const randomStr = new Array(42).fill('0').map(
    _ => randomAlphabet[Math.floor(Math.random() * randomAlphabet.length)]
  ).join('');

  // upload file
  const newS3Path = `observations/${observationId}/${randomStr}${extension}`;
  await uploadFile(newS3Path, file.filepath, canUseS3());

  // remove existing image from database and s3
  if (existingImageId) {
    // delete existing ImageUpload row
    const deletedImage = await db.imageUpload.delete({
      select: {
        filePath: true,
        isS3: true,
      },
      where: {
        id: existingImageId,
      }
    })

    // remove existing images on this observation in s3
    try {
      await deleteFiles(deletedImage.filePath, deletedImage.isS3)
    } catch(e: any) {
      // if unable to delete file, handle errors silently
      captureException(e);
    }
  }

  // create new ImageUpload row
  const _newImageUpload = await db.imageUpload.create({
    data: {
      mimetype: file.mimetype,
      originalName: file.originalFilename,
      filePath: `${newS3Path}`,
      isS3: canUseS3(),
      observationId: observation.id,
    }
  })

  // adjust progress and updated at
  await db.observation.update({
    where: { id: observationId },
    data: {
      uploadInProgress: false,
      updatedAt: new Date(),
    }
  })

  return { success: true };
});