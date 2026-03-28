#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import variantPresets from "../lib/image-variant-presets.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_CONCURRENCY = 4;
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const RASTER_EXTENSION_PATTERN = /\.(avif|jpe?g|png|webp)$/i;
const VARIANT_SUFFIX_PATTERN = new RegExp(
  `\\.(${Object.values(variantPresets)
    .map((preset) => preset.suffix)
    .join("|")})\\.webp$`,
  "i",
);

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function parsePositiveInt(value, fallback) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function loadEnvFile(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function normalizePrefixes(prefixArg) {
  if (!prefixArg) return [];

  return prefixArg
    .split(",")
    .map((item) => item.trim().replace(/^\/+/, ""))
    .filter(Boolean);
}

function shouldProcessKey(key) {
  return RASTER_EXTENSION_PATTERN.test(key) && !VARIANT_SUFFIX_PATTERN.test(key);
}

function buildVariantKey(sourceKey, suffix) {
  return sourceKey.replace(/\.[^.\/]+$/i, `.${suffix}.webp`);
}

async function listAllObjects(s3, bucket, prefix) {
  const items = [];
  let continuationToken;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        Prefix: prefix || undefined,
      }),
    );

    for (const item of response.Contents || []) {
      if (!item.Key) continue;
      items.push({
        key: item.Key,
        size: item.Size ?? 0,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items;
}

async function bodyToBuffer(body) {
  if (!body || typeof body.transformToByteArray !== "function") {
    throw new Error("S3 response body is missing transformToByteArray()");
  }

  return Buffer.from(await body.transformToByteArray());
}

async function runPool(items, concurrency, worker) {
  const poolSize = Math.max(1, Math.min(concurrency, items.length || 1));
  let index = 0;

  await Promise.all(
    Array.from({ length: poolSize }, async () => {
      while (index < items.length) {
        const currentIndex = index;
        index += 1;
        await worker(items[currentIndex], currentIndex);
      }
    }),
  );
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 credentials in .env: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  const concurrency = parsePositiveInt(parseArg("concurrency"), DEFAULT_CONCURRENCY);
  const limit = parsePositiveInt(parseArg("limit"), 0);
  const prefixes = normalizePrefixes(parseArg("prefix"));
  const overwrite = hasFlag("overwrite");
  const dryRun = hasFlag("dry-run");

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const scopedPrefixes = prefixes.length ? prefixes : [""];
  const discoveredObjects = [];
  const seenKeys = new Set();

  for (const prefix of scopedPrefixes) {
    const listed = await listAllObjects(s3, bucket, prefix);
    for (const item of listed) {
      if (seenKeys.has(item.key)) continue;
      seenKeys.add(item.key);
      discoveredObjects.push(item);
    }
  }

  const existingKeys = new Set(discoveredObjects.map((item) => item.key));
  const originalObjects = discoveredObjects.filter((item) => shouldProcessKey(item.key));
  const queuedObjects = limit > 0 ? originalObjects.slice(0, limit) : originalObjects;
  const variantEntries = Object.entries(variantPresets);

  console.log(`Bucket: ${bucket}`);
  console.log(`Scope: ${prefixes.length ? prefixes.join(", ") : "(entire bucket)"}`);
  console.log(`Original raster objects found: ${originalObjects.length}`);
  console.log(`Queued for processing: ${queuedObjects.length}`);
  console.log(`Variants per original: ${variantEntries.map(([name, preset]) => `${name}:${preset.width}px`).join(", ")}`);
  console.log(`Mode: ${dryRun ? "dry-run" : overwrite ? "overwrite existing variants" : "skip existing variants"}`);

  const summary = {
    created: 0,
    createdBytes: 0,
    skippedExisting: 0,
    skippedAnimated: 0,
    originalsProcessed: 0,
    originalsErrored: 0,
  };
  const errors = [];

  await runPool(queuedObjects, concurrency, async (item, index) => {
    const variantTargets = variantEntries.map(([presetName, preset]) => ({
      key: buildVariantKey(item.key, preset.suffix),
      presetName,
      preset,
    }));
    const missingTargets = overwrite ? variantTargets : variantTargets.filter((target) => !existingKeys.has(target.key));

    if (!missingTargets.length) {
      summary.skippedExisting += variantTargets.length;
      summary.originalsProcessed += 1;
      console.log(`[${index + 1}/${queuedObjects.length}] skip ${item.key} (all variants already exist)`);
      return;
    }

    try {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: item.key,
        }),
      );
      const sourceBuffer = await bodyToBuffer(response.Body);
      const sourceImage = sharp(sourceBuffer, { failOn: "none" }).rotate();
      const metadata = await sourceImage.metadata();

      if ((metadata.pages ?? 1) > 1) {
        summary.skippedAnimated += 1;
        summary.originalsProcessed += 1;
        console.warn(`[${index + 1}/${queuedObjects.length}] skip ${item.key} (animated image)`);
        return;
      }

      let createdForItem = 0;

      for (const target of variantTargets) {
        if (!overwrite && existingKeys.has(target.key)) {
          summary.skippedExisting += 1;
          continue;
        }

        const resizedBuffer = await sourceImage
          .clone()
          .resize({
            width: target.preset.width,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({
            effort: 5,
            quality: target.preset.quality,
            smartSubsample: true,
          })
          .toBuffer();

        if (!dryRun) {
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: target.key,
              Body: resizedBuffer,
              CacheControl: DEFAULT_CACHE_CONTROL,
              ContentType: "image/webp",
            }),
          );
        }

        existingKeys.add(target.key);
        summary.created += 1;
        summary.createdBytes += resizedBuffer.byteLength;
        createdForItem += 1;
      }

      summary.originalsProcessed += 1;
      console.log(
        `[${index + 1}/${queuedObjects.length}] ${dryRun ? "planned" : "created"} ${createdForItem} variants for ${item.key}`,
      );
    } catch (error) {
      summary.originalsErrored += 1;
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ key: item.key, message });
      console.error(`[${index + 1}/${queuedObjects.length}] error ${item.key}: ${message}`);
    }
  });

  console.log("");
  console.log("Summary");
  console.log(`Processed originals: ${summary.originalsProcessed}`);
  console.log(`Created variants: ${summary.created}`);
  console.log(`Skipped existing variants: ${summary.skippedExisting}`);
  console.log(`Skipped animated originals: ${summary.skippedAnimated}`);
  console.log(`Errored originals: ${summary.originalsErrored}`);
  console.log(`Uploaded variant bytes: ${formatBytes(summary.createdBytes)}`);

  if (errors.length) {
    console.log("");
    console.log("Errors");
    for (const entry of errors.slice(0, 20)) {
      console.log(`- ${entry.key}: ${entry.message}`);
    }
    if (errors.length > 20) {
      console.log(`- ...and ${errors.length - 20} more`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
