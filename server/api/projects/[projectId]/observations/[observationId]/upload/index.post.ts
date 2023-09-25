import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
// import { deleteS3Files } from '../../../../../../utils/s3';
import { requireUser } from '../../../../../../utils/authorize';
import { parseIntParam } from '../../../../../../utils/request';

const prisma = new PrismaClient();
const allowedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.ms-powerpoint',
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webm',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'video/x-flv',
  'video/mp4',
  'application/x-mpegURL',
  'video/MP2T',
  'video/3gpp',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm',
  'audio/basic',
  'auido/L24',
  'audio/mid',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-aiff',
  'audio/x-mpegurl',
  'audio/vnd.rn-realaudio',
  'audio/vnd.rn-realaudio',
  'audio/ogg',
  'audio/vorbis',
  'audio/vnd.wav',
  'audio/webm',
];

const config = useRuntimeConfig();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params;
  const observationId = parseIntParam(params?.observationId);
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
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
      statusMessage: 'No file was sent'
    })
  } else if (files['file']?.length !== 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only one file can be uploaded at a time'
    })
  }
  const file = files['file'][0];

  // validate mimetypes
  if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This file type is not allowed. If you think this is a mistake, please create an issue on Github.'
    })
  }

  // validate originalFilename
  if (!file.originalFilename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File has no file name'
    });
  }

  // ensure file is not too big
  if (file.size > config.public.maxFileSize) {
    throw createError({
      statusCode: 413,
      statusMessage: 'File size is too big'
    });
  }

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
  await prisma.fileUpload.create({
    data: {
      observationId: observationId,
      mimetype: file.mimetype,
      originalName: file.originalFilename,
      s3Path: `${newS3Path}`,
    }
  })

  return { success: true };
});