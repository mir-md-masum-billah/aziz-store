import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

// SVG ইত্যাদি বিপজ্জনক ধরন আটকাতে শুধু এই চারটি ছবির ধরন চলবে
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
export const okType = t => !!EXT[t];

export async function putImage(buf, type) {
  const key = `img/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[type]}`;
  await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: buf, ContentType: type, CacheControl: 'public, max-age=31536000, immutable' }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
