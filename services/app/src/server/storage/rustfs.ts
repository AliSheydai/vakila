import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetBucketCorsCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env'

export function toStorageError(error: unknown): Error {
  if (error instanceof Error) {
    const msg = error.message
    const code = (error as NodeJS.ErrnoException).code
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('connect')
    ) {
      return new Error(
        'سرویس ذخیره‌سازی (RustFS) در دسترس نیست. با docker compose یا ./run.sh dev آن را اجرا کنید.'
      )
    }
    return error
  }
  return new Error('خطا در ارتباط با ذخیره‌سازی فایل.')
}

let client: S3Client | null = null
let bucketReady = false

function corsOrigins(): string[] {
  const fromEnv = process.env.RUSTFS_CORS_ALLOWED_ORIGINS?.trim()
  if (fromEnv) {
    return fromEnv.split(',').map((value) => value.trim()).filter(Boolean)
  }
  return [
    env.APP_URL,
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
}

async function ensureBucketCors(s3: S3Client): Promise<void> {
  try {
    await s3.send(new GetBucketCorsCommand({ Bucket: env.RUSTFS_BUCKET }))
    return
  } catch {
    // Configure bucket CORS for browser presigned uploads.
  }

  const origins = [...new Set(corsOrigins())]
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: env.RUSTFS_BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: origins,
              AllowedMethods: ['GET', 'PUT', 'HEAD', 'POST', 'DELETE'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag', 'x-amz-request-id'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    )
  } catch {
    // Some RustFS builds may not support PutBucketCors — server-level CORS still applies.
  }
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.RUSTFS_REGION,
      endpoint: env.RUSTFS_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.RUSTFS_ACCESS_KEY,
        secretAccessKey: env.RUSTFS_SECRET_KEY,
      },
    })
  }
  return client
}

export async function ensureBucket(): Promise<void> {
  if (bucketReady) return
  const s3 = getClient()
  try {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: env.RUSTFS_BUCKET }))
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: env.RUSTFS_BUCKET }))
    }
    await ensureBucketCors(s3)
    bucketReady = true
  } catch (error) {
    throw toStorageError(error)
  }
}

export function buildStorageKey(parts: {
  ownerId: string
  scope: 'cases' | 'clients'
  parentId: string
  attachmentId: string
  fileName: string
}): string {
  return `${parts.ownerId}/${parts.scope}/${parts.parentId}/${parts.attachmentId}/${parts.fileName}`
}

export async function getPresignedUploadUrl(
  storageKey: string,
  mimeType: string,
  expiresIn = 900
): Promise<string> {
  try {
    await ensureBucket()
    const command = new PutObjectCommand({
      Bucket: env.RUSTFS_BUCKET,
      Key: storageKey,
      ContentType: mimeType,
    })
    return await getSignedUrl(getClient(), command, { expiresIn })
  } catch (error) {
    throw toStorageError(error)
  }
}

export async function getPresignedDownloadUrl(
  storageKey: string,
  fileName: string,
  mimeType: string,
  expiresIn = 300
): Promise<string> {
  await ensureBucket()
  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  const command = new GetObjectCommand({
    Bucket: env.RUSTFS_BUCKET,
    Key: storageKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    ResponseContentType: mimeType,
  })
  return getSignedUrl(getClient(), command, { expiresIn })
}

export async function objectExists(storageKey: string): Promise<boolean> {
  try {
    await getClient().send(
      new HeadObjectCommand({
        Bucket: env.RUSTFS_BUCKET,
        Key: storageKey,
      })
    )
    return true
  } catch {
    return false
  }
}

export async function deleteObject(storageKey: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: env.RUSTFS_BUCKET,
      Key: storageKey,
    })
  )
}
