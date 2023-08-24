
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import { deleteS3Files } from '../../../../../utils/s3';
import { requireUser } from '../../../../../utils/authorize';
import { parseIntParam } from '../../../../../utils/request';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  const params = event.context.params;
  const observationId = parseIntParam(params?.observationId);

  // define our fileupload helper config
  const form = formidable({
    allowEmptyFiles: false,
    maxFiles: 2,
    multiples: false,
    keepExtensions: true,
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

  if (!file.mimetype || !['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype.toLowerCase())) {
    return createError({
      statusCode: 400,
      statusMessage: 'Only JPEGS and PNGS are supported'
    })
  }

  console.log('GOT FILE:', file)
  // remove existing images on this draft in s3
  const deleteRes = await deleteS3Files(
    `observations/${observationId}/image`
  )
  console.log('deleteRes result:', deleteRes);

  // upload to s3
  const res = await uploadS3File(
    `observations/${observationId}/image`,
    file.filepath
  );

  console.log('upload image response (TODO: parse it and return url for quick fetch)')
  console.log(res)

  // 1NIKOOOOOOOOOO CONTINUE FROM HERE

  // create new ImageUpload row
  // await prisma.imageUpload.create({
  //   data: {
  //     mimetype,
  //     originalName,
  //     s3Path,
  //   }
  // })


  // // delete existing ImageUpload row
  // await prisma.imageUpload.delete({
  //   where: {
  //     id: draftId,
  //   }
  // })

  // add image metadata to draft image row

  return { success: true };

})