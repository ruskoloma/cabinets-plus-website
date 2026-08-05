#!/usr/bin/env node
/**
 * Upload a staged /resources asset tree to S3 under `library/resources/`.
 *
 * The staging tree is produced by rasterizing the source PDFs once — spreads
 * and page images are served as WebP so the viewer works everywhere (iOS
 * Safari renders only the first page of a PDF inside an iframe), while the
 * untouched original stays alongside them as the download.
 *
 *   staging/
 *     magazines/<slug>/cover.webp
 *     magazines/<slug>/spread-001.webp …
 *     magazines/<slug>/<slug>.pdf
 *     documents/<slug>/cover.webp
 *     documents/<slug>/page-01.webp …
 *     documents/<slug>/<slug>.pdf|.jpg
 *
 * To regenerate the staging tree from a new magazine PDF, render every page at
 * ~2400px wide to WebP (`pdftoppm -r 150 -png in.pdf page && cwebp …`, or any
 * PDF rasterizer) and crop the right-hand half of sheet 1 as `cover.webp` —
 * these are printer's spreads, so the front cover is the right half.
 *
 * Usage:
 *   node scripts/upload-resource-assets.mjs --staging-dir=<path> [--prefix=library/resources] [--dry-run]
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_PREFIX = "library/resources";
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
// Originals are replaced in place when a brochure is revised, so they get a
// short shared cache instead of the immutable one used for hashed page images.
const DOCUMENT_CACHE_CONTROL = "public, max-age=3600";

const CONTENT_TYPES = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

function parseArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((entry) => entry.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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

function buildCdnUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, "")}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function listFiles(directory, base = directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "manifest.json") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, base)));
      continue;
    }
    if (!CONTENT_TYPES[path.extname(entry.name).toLowerCase()]) continue;
    files.push({ fullPath, relativePath: path.relative(base, fullPath) });
  }
  return files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath, undefined, { numeric: true, sensitivity: "base" }),
  );
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const stagingDir = parseArg("staging-dir");
  const prefix = (parseArg("prefix") || DEFAULT_PREFIX).replace(/^\/+|\/+$/g, "");
  const dryRun = hasFlag("dry-run");

  if (!stagingDir) {
    throw new Error("Usage: --staging-dir=<path> [--prefix=library/resources] [--dry-run]");
  }

  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const cdnBase = process.env.S3_CDN_URL;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!region || !bucket || (!dryRun && (!accessKeyId || !secretAccessKey))) {
    throw new Error("Missing S3 config. Need S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY in .env.");
  }

  const files = await listFiles(path.resolve(stagingDir));
  if (!files.length) throw new Error(`No uploadable files found in ${stagingDir}`);

  const totalBytes = (
    await Promise.all(files.map(async (file) => (await fs.stat(file.fullPath)).size))
  ).reduce((sum, size) => sum + size, 0);

  console.log(
    `${dryRun ? "[dry-run] " : ""}Uploading ${files.length} files (${(totalBytes / 1e6).toFixed(1)} MB) ` +
      `to s3://${bucket}/${prefix}/`,
  );

  const s3 = dryRun ? null : new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  const uploaded = [];

  for (const [index, file] of files.entries()) {
    const key = `${prefix}/${file.relativePath.split(path.sep).join("/")}`;
    const extension = path.extname(file.fullPath).toLowerCase();
    const contentType = CONTENT_TYPES[extension];
    const cacheControl = extension === ".webp" ? IMMUTABLE_CACHE_CONTROL : DOCUMENT_CACHE_CONTROL;

    if (!dryRun) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: await fs.readFile(file.fullPath),
          ContentType: contentType,
          CacheControl: cacheControl,
        }),
      );
    }

    uploaded.push(buildCdnUrl(cdnBase, bucket, region, key));
    if ((index + 1) % 20 === 0 || index === files.length - 1) {
      console.log(`  ${index + 1}/${files.length}`);
    }
  }

  console.log(`Done. Base URL: ${buildCdnUrl(cdnBase, bucket, region, prefix)}/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
