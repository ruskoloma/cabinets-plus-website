#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import variantPresets from "../lib/image-variant-presets.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const MAX_ORIGINAL_WIDTH = 2400;
const ORIGINAL_QUALITY = 82;
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|heic|heif|tif|tiff)$/i;

function parseArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function loadEnvFile(filePath) {
  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function safeBaseFilename(name, index) {
  const originalBase = path.basename(name, path.extname(name));
  const normalizedBase = normalizeSlug(originalBase) || `photo-${String(index + 1).padStart(2, "0")}`;
  return `${String(index + 1).padStart(2, "0")}-${normalizedBase}`;
}

function buildCdnUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, "")}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function listImageFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listImageFiles(fullPath)));
      continue;
    }
    if (IMAGE_EXTENSION_PATTERN.test(entry.name)) files.push(fullPath);
  }
  return files.sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }),
  );
}

async function readCsvCredentials(csvPath) {
  if (!csvPath) return null;
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const [accessKeyId, secretAccessKey] = lines[1].replace(/^﻿/, "").split(",");
  if (!accessKeyId?.trim() || !secretAccessKey?.trim()) return null;
  return { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() };
}

async function uploadBuffer({ s3, bucket, key, body, contentType }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.isBuffer(body) ? body : Buffer.from(body),
      ContentType: contentType,
      CacheControl: DEFAULT_CACHE_CONTROL,
    }),
  );
}

async function optimizeAndUpload({ s3, bucket, cdnBase, region, uploadPrefix, sourcePath, index }) {
  const sourceBuffer = await fs.readFile(sourcePath);
  const baseFilename = safeBaseFilename(sourcePath, index);
  const originalKey = `${uploadPrefix}/${baseFilename}.jpg`;

  const originalBuffer = await sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_ORIGINAL_WIDTH, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: ORIGINAL_QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  await uploadBuffer({ s3, bucket, key: originalKey, body: originalBuffer, contentType: "image/jpeg" });

  for (const [, preset] of Object.entries(variantPresets)) {
    const variantKey = `${uploadPrefix}/${baseFilename}.${preset.suffix}.webp`;
    const variantBuffer = await sharp(originalBuffer, { failOn: "none" })
      .resize({ width: preset.width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: preset.quality })
      .toBuffer();
    await uploadBuffer({ s3, bucket, key: variantKey, body: variantBuffer, contentType: "image/webp" });
  }

  return {
    sourceName: path.basename(sourcePath),
    fileUrl: buildCdnUrl(cdnBase, bucket, region, originalKey),
    baseFilename,
  };
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const sourceDir = parseArg("source-dir");
  const uploadPrefix = parseArg("upload-prefix");
  const csvPath = parseArg("access-keys-csv");

  if (!sourceDir || !uploadPrefix) {
    throw new Error("Usage: --source-dir=<path> --upload-prefix=<s3-prefix> [--access-keys-csv=<path>]");
  }

  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const cdnBase = process.env.S3_CDN_URL;
  const csvCreds = await readCsvCredentials(csvPath);
  const accessKeyId = csvCreds?.accessKeyId || process.env.S3_ACCESS_KEY;
  const secretAccessKey = csvCreds?.secretAccessKey || process.env.S3_SECRET_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 config. Need S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY (or --access-keys-csv).");
  }

  const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

  const imagePaths = await listImageFiles(path.resolve(sourceDir));
  if (!imagePaths.length) throw new Error(`No images found in ${sourceDir}`);

  console.log(`Uploading ${imagePaths.length} images to s3://${bucket}/${uploadPrefix}/`);

  const results = [];
  for (const [index, imagePath] of imagePaths.entries()) {
    const result = await optimizeAndUpload({
      s3, bucket, cdnBase, region, uploadPrefix, sourcePath: imagePath, index,
    });
    results.push(result);
    console.log(`  ${index + 1}/${imagePaths.length}: ${result.sourceName} -> ${result.baseFilename}.jpg`);
  }

  console.log(JSON.stringify({ count: results.length, uploadPrefix, urls: results.map((r) => r.fileUrl) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
