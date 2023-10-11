import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import fs from 'fs'

const config = useRuntimeConfig()?.app || {};

if (!config.s3AccessKey) throw new Error('s3AccessKey environment variable not set');
if (!config.s3SecretAccessKey) throw new Error('s3SecretAccessKey environment variable not set');
if (!config.s3Endpoint) throw new Error('s3Endpoint environment variable not set');
if (!config.s3BucketName) throw new Error('s3BucketName environment variable not set');

const bucketName = config.s3BucketName as string;


// a client can be shared by different commands
const s3 = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId: config.s3AccessKey as string,
    secretAccessKey: config.s3SecretAccessKey as string,
  },
  endpoint: config.s3Endpoint as string,
  forcePathStyle: true,
});


// upload a file to configured s3
export async function uploadS3File(key: string, filepath: string) {
  const contents = fs.readFileSync(filepath);

  return s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: contents,
    })
  )
}


// upload a file to configured s3
export async function deleteS3Files(key: string) {
  return s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  )
}

export async function getS3Upload(key: string) {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );

  return result;
}

export async function listAllObjects(prefix: string) {
  const result = await s3.send(
    new ListObjectsCommand({
      Bucket: bucketName,
    }),
  );

  return result;
}