import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { type File } from 'formidable'
import fs from 'fs'

const config = useRuntimeConfig()?.app || {};
console.log(config)

if (!config.s3AccessKey) throw new Error('s3AccessKey environment variable not set');
if (!config.s3SecretAccessKey) throw new Error('s3SecretAccessKey environment variable not set');
if (!config.s3Endpoint) throw new Error('s3Endpoint environment variable not set');
if (!config.s3BucketName) throw new Error('s3BucketName environment variable not set');

const bucketName = config.s3BucketName as string;


// a client can be shared by different commands
export const s3 = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId: config.s3AccessKey as string,
    secretAccessKey: config.s3SecretAccessKey as string,
  },
  endpoint: config.s3Endpoint as string,
  forcePathStyle: true,
});


// upload a file to configured s3
export function uploadFile(key: string, file: File) {
  return s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.toString(),
    })
  )
}