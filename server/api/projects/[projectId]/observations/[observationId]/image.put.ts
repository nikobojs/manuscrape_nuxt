
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import { deleteS3Files } from '../../../../../utils/s3';
import { requireUser } from '../../../../../utils/authorize';
import { parseIntParam } from '../../../../../utils/request';

const prisma = new PrismaClient();
const allowedMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
const config = useRuntimeConfig();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  const params = event.context.params;
  const observationId = parseIntParam(params?.observationId);
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      imageId: true,
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

  const existingImageId = observation.imageId;

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
  } else if (files['file'].length !== 1) {
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
  await prisma.observation.update({
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

  // upload to s3
  const newS3Path = `observations/${observationId}/${randomStr}${extension}`;
  const res = await uploadS3File(newS3Path, file.filepath);
  if (res.$metadata.httpStatusCode !== 200) {
    throw createError({
      statusCode: res.$metadata.httpStatusCode,
      statusMessage: 'Unable to delete existing image'
    });
  }

  // create new ImageUpload row
  const newImageUpload = await prisma.imageUpload.create({
    data: {
      mimetype: file.mimetype,
      originalName: file.originalFilename,
      s3Path: `${newS3Path}`,
    }
  })

  // make observation point to new image
  await prisma.observation.update({
    where: { id: observationId },
    data: {
      uploadInProgress: false,
      imageId: newImageUpload.id,
      updatedAt: new Date(),
    }
  })

  // remove existing image from database and s3
  if (existingImageId) {
    // delete existing ImageUpload row
    const deletedImage = await prisma.imageUpload.delete({
      select: {
        s3Path: true,
      },
      where: {
        id: existingImageId,
      }
    })

    // remove existing images on this observation in s3
    try {
      const deleteRes = await deleteS3Files(deletedImage.s3Path)
      if (deleteRes.$metadata.httpStatusCode !== 204) {
        throw createError({
          statusCode: deleteRes.$metadata.httpStatusCode,
          statusMessage: 'Unable to delete existing image'
        });
      }
    } catch(e: any) {
      // if unable to delete file, handle errors silently
      // TODO: report error!
      console.warn('Ignoring Minio delete file error:', e);
    }
  }

  return { success: true };

})