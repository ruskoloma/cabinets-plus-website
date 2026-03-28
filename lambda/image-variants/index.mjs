import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({});

const PRESETS = [
  { suffix: "thumb", width: 480, quality: 72 },
  { suffix: "card", width: 960, quality: 74 },
  { suffix: "feature", width: 1600, quality: 78 },
  { suffix: "full", width: 2400, quality: 82 },
];

const RASTER_PATTERN = /\.(avif|heic|heif|jpe?g|png|webp)$/i;
const VARIANT_PATTERN = /\.(thumb|card|feature|full)\.webp$/i;
const CACHE_CONTROL = process.env.CACHE_CONTROL || "public, max-age=31536000, immutable";
const SOURCE_PREFIX = process.env.SOURCE_PREFIX || "";

function decodeS3Key(key) {
  return decodeURIComponent(key.replace(/\+/g, " "));
}

function buildVariantKey(sourceKey, suffix) {
  return sourceKey.replace(/\.[^.\/]+$/i, `.${suffix}.webp`);
}

async function toBuffer(body) {
  return Buffer.from(await body.transformToByteArray());
}

export const handler = async (event) => {
  const results = [];

  for (const record of event.Records || []) {
    const bucket = record?.s3?.bucket?.name;
    const key = decodeS3Key(record?.s3?.object?.key || "");

    if (!bucket || !key) {
      results.push({ key, status: "skipped-invalid-record" });
      continue;
    }

    if (SOURCE_PREFIX && !key.startsWith(SOURCE_PREFIX)) {
      results.push({ key, status: "skipped-prefix" });
      continue;
    }

    if (!RASTER_PATTERN.test(key)) {
      results.push({ key, status: "skipped-non-raster" });
      continue;
    }

    if (VARIANT_PATTERN.test(key)) {
      results.push({ key, status: "skipped-generated-variant" });
      continue;
    }

    try {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      const sourceBuffer = await toBuffer(response.Body);
      const image = sharp(sourceBuffer, { failOn: "none" }).rotate();
      const metadata = await image.metadata();

      if ((metadata.pages ?? 1) > 1) {
        results.push({ key, status: "skipped-animated" });
        continue;
      }

      for (const preset of PRESETS) {
        const outputBuffer = await image
          .clone()
          .resize({
            width: preset.width,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({
            quality: preset.quality,
            effort: 5,
            smartSubsample: true,
          })
          .toBuffer();

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: buildVariantKey(key, preset.suffix),
            Body: outputBuffer,
            ContentType: "image/webp",
            CacheControl: CACHE_CONTROL,
          }),
        );
      }

      results.push({ key, status: "ok" });
    } catch (error) {
      console.error("Failed to process key", key, error);
      results.push({
        key,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { results };
};
