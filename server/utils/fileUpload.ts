import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import { captureException } from "@sentry/node";
import fs from 'node:fs';
import path from 'node:path';
import { PassThrough } from "stream";

const config = useRuntimeConfig()?.app || {};

export const canUseS3 = (): boolean => {
  return !!(config.s3AccessKey &&
  config.s3SecretAccessKey &&
  config.s3Endpoint &&
  config.s3BucketName);
};

export const canUseFileSystem = (): boolean => {
  return !!(config.fileUploadPath);
};

// ensure file uploads works in some way
// TODO: test if they work (has write access on either system)
if (!canUseS3() && !canUseFileSystem()) {
  throw new Error('File-upload environment variables are missing.');
}

// optional clients that can be shared by different commands
const uploadsPath = canUseFileSystem() ? config.fileUploadPath : null;
const s3 = canUseS3() ? new S3Client({
  region: 'us-west-2', // TODO: use as env var to support aws s3
  credentials: {
    accessKeyId: config.s3AccessKey as string,
    secretAccessKey: config.s3SecretAccessKey as string,
  },
  endpoint: config.s3Endpoint as string,
  forcePathStyle: true,
}) : null;

console.info(`> using ${s3 ? 's3' : 'file system'} to store user uploaded data`);

// upload a file to configured s3
export async function uploadFile(
  key: string,
  file: string | Buffer,
  isS3: boolean
): Promise<void> {
  const contents = typeof file === 'string' ? fs.readFileSync(file) : file;

  if (s3 && isS3) {
    const res = await s3.send(new PutObjectCommand({
      Bucket: config.s3BucketName,
      Key: key,
      Body: contents,
    }));
    if (res.$metadata.httpStatusCode !== 200) {
      const err = createError({
        statusCode: res.$metadata.httpStatusCode,
        statusMessage: 'Unable to upload file'
      });
      captureException(err);
      throw err;
    }
  } else if (uploadsPath && !isS3) {
    // retrieve file and dir path
    const fullPath = path.join(uploadsPath, key);
    const dirPath = fullPath.split('/').slice(0, -1).join('/');

    // make dirs if they dont exist
    fs.mkdirSync(dirPath, { recursive: true });

    // write the file to disk
    return new Promise((resolve, reject) => {
      fs.writeFile(fullPath, contents, (err) => {
        err ? reject(err) : resolve()
      });
    });
  } else {
    console.error({isS3, s3, uploadsPath})
    throw new Error('Unable to upload file. Server is not configured correctly');
  }
}


// upload a file to configured s3
export async function deleteFiles(key: string, isS3: boolean): Promise<void> {
  if (s3 && isS3) {
    const deleteRes = await s3.send(new DeleteObjectCommand({
      Bucket: config.s3BucketName,
      Key: key,
    }));
    if (deleteRes.$metadata.httpStatusCode !== 204) {
      // TODO: add details on captured error
      const err = createError({
        statusCode: deleteRes.$metadata.httpStatusCode,
        statusMessage: 'Unable to delete existing file'
      });
      captureException(err, { data: { path: key, s3: true }});
      throw err;
    }
  } else if (uploadsPath && !isS3) {
    const fullPath = path.join(uploadsPath, key);

    // capture createError 404 if file not found
    // NOTE: happens silently so fn will still resolve!
    if (!fs.existsSync(fullPath)) {
      const error = new Error('File does not exist on server')
      captureException(error, { data: { path: fullPath, s3: false }});
      return;
    }

    // capture not found 404 silently
    // NOTE: Does not emit errors in case of 404
    const fileExists = checkFilePathExists(fullPath);

    // begin unlink
    return new Promise((resolve, reject) => {
      // NOTE: Does not emit errors in case of 404
      if (!fileExists) return resolve();
      fs.unlink(fullPath, (err) => {
        err ? reject(err) : resolve();
      });
    })
  } else {
    throw new Error('Unable to delete file. Server is not configured correctly');
  }
}

export async function getUpload(key: string, isS3: boolean): Promise<Readable> {
  if (s3 && isS3) {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: config.s3BucketName,
        Key: key,
      }),
    );

    // validate response
    if (res.$metadata.httpStatusCode !== 200 || !res.Body) {
      const err = createError({
        statusCode: res.$metadata.httpStatusCode,
        statusMessage: 'File could not be retrieved on server'
      });
      captureException(err, { data: { path: key, s3: true }});
      throw err;
    }

    // create and return stream
    const _stream = res.Body.transformToWebStream();
    return Readable.fromWeb(_stream as ReadableStream<any>)
  } else if (uploadsPath && !isS3) {
    // retrieve file and dir path
    const fullPath = path.join(uploadsPath, key);

    // throw createError 404 if file not found
    ensureFilePathExists(fullPath);

    // create read stream
    return fs.createReadStream(fullPath);
  } else {
    if (isS3 && !canUseS3()) {
      const err = 'This file is currently not available (no s3 connection)';
      throw createError({
        statusCode: 500,
        statusMessage: err,
      });
    } else if (!isS3 && !canUseFileSystem()) {
      const err = 'This file is currently not available (missing file upload config)';
      throw createError({
        statusCode: 500,
        statusMessage: err,
      });
    }

    throw new Error('Unable to download file. Server is not configured correctly');
  }
}

export function archiverUploadPipe(
  key: string,
  isS3: boolean
): {
  passThrough: NodeJS.WritableStream;
  upload: { done: () => void };
} {
  if (s3 && isS3) {
    // create and return the writable s3 stream
    const passThrough = new PassThrough();
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: config.s3BucketName,
        Key: key,
        Body: passThrough,
      },
    });
    return { upload, passThrough };
  } else if (uploadsPath && !isS3) {
    // retrieve file and dir path
    const fullPath = path.join(uploadsPath, key);
    const dirPath = fullPath.split('/').slice(0, -1).join('/');

    // make dirs if they dont exist
    fs.mkdirSync(dirPath, { recursive: true });

    // create and return the writable file stream
    const writable = fs.createWriteStream(fullPath);
    return {
      passThrough: writable,
      upload: {
        done: () => {
          writable.end();
        }
      }
    }
  } else {
    throw new Error('Unable to upload file. Server is not configured correctly');
  }
}

// throw createError 404 if filesystem file not found
function ensureFilePathExists(filePath: string) {
  if (!checkFilePathExists(filePath)) {
    const error = new Error('File does not exist on server')
    captureException(error, { data: { filePath, s3: false }});
    throw createError({
      statusCode: 404,
      statusMessage: error.message,
    });
  } else {
  }
}

function checkFilePathExists(filePath: string): boolean {
    return fs.existsSync(filePath) === true;
}