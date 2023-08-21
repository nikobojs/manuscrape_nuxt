
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  if (!event.context.auth?.id) {
      return createError({
          statusMessage: 'Invalid auth token value',
          statusCode: 401,
      });
  }

  const param = event.context.params
  const projectId = parseInt(param?.id || '');
  const draftId = parseInt(param?.draftId || '');

  if (isNaN(projectId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid project id',
    });
  }
  if (isNaN(draftId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid observation draft id',
    });
  }

  // define our fileupload helper config
  const form = formidable({
    allowEmptyFiles: false,
    maxFiles: 2,
    multiples: false,
  });

  const [_fields, files] = await form.parse(event.req)
  
  // validate file was sent and save into variable 'file'
  if (!Object.keys(files).includes('file') || files['file'].length !== 1) {
    return createError({
      statusCode: 400,
      statusMessage: 'Only one file is allowed'
    })
  }
  const file = files['file'][0];

  if (!file.mimetype || !['image/png', 'image/jpg'].includes(file.mimetype)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Only JPEGS and PNGS are supported'
    })
  }

  console.log('GOT FILE:', file)
  // TODO: upload to s3
  // TODO; remove existing images on this draft
  // TODO: add image metadata to draft image row
  const res = await uploadFile(file.newFilename, file);
  console.log({ res })

  return { success: true };

})
