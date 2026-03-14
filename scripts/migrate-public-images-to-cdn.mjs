#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TEXT_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
]);

const SKIP_DIR_NAMES = new Set(['.git', '.next', 'node_modules', '.vercel', '.tina', 'dist', 'build']);
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|webp|gif|avif)$/i;
const LOCAL_IMAGE_REF_REGEX = /\/(?:figma|media|library)\/[A-Za-z0-9/_\-.]+\.(?:png|jpe?g|webp|gif|avif)/g;

function parseArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

async function loadEnvFile(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
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

function contentTypeFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.avif') return 'image/avif';
  return 'application/octet-stream';
}

function buildPublicUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, '')}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === 'NotFound') return false;
    return false;
  }
}

async function uploadFile({ s3, bucket, localFilePath, objectKey }) {
  const fileBuffer = await fs.readFile(localFilePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentTypeFromFile(localFilePath),
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
}

async function collectTextFiles(dirPath, out = []) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      await collectTextFiles(abs, out);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!TEXT_FILE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    out.push(abs);
  }
  return out;
}

async function main() {
  await loadEnvFile(path.join(projectRoot, '.env'));

  const s3Bucket = process.env.S3_BUCKET;
  const s3Region = process.env.S3_REGION;
  const s3AccessKey = process.env.S3_ACCESS_KEY;
  const s3SecretKey = process.env.S3_SECRET_KEY;
  const cdnBase = process.env.S3_CDN_URL || '';
  const uploadPrefix = parseArg('upload-prefix', '').replace(/^\/+|\/+$/g, '');

  if (!s3Bucket || !s3Region || !s3AccessKey || !s3SecretKey) {
    throw new Error('Missing S3 credentials in .env: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY');
  }

  const s3 = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
    },
  });

  const textFiles = await collectTextFiles(projectRoot);

  const localRefs = new Set();
  const fileToRefs = new Map();

  for (const filePath of textFiles) {
    const raw = await fs.readFile(filePath, 'utf8');
    const matches = raw.match(LOCAL_IMAGE_REF_REGEX);
    if (!matches || matches.length === 0) continue;

    const deduped = [...new Set(matches)].filter((value) => IMAGE_EXTENSION_REGEX.test(value));
    if (deduped.length === 0) continue;

    fileToRefs.set(filePath, deduped);
    for (const ref of deduped) localRefs.add(ref);
  }

  if (localRefs.size === 0) {
    console.log('No local raster /figma, /media, or /library image references were found.');
    return;
  }

  const refToCdnUrl = new Map();
  let uploadedCount = 0;
  let skippedCount = 0;

  for (const ref of [...localRefs].sort()) {
    const localPublicPath = path.join(projectRoot, 'public', ref);

    let stat;
    try {
      stat = await fs.stat(localPublicPath);
    } catch {
      console.warn(`WARN missing file in public for ref ${ref}`);
      continue;
    }

    if (!stat.isFile()) {
      console.warn(`WARN non-file path for ref ${ref}`);
      continue;
    }

    const normalizedRef = ref.replace(/^\/+/, '');
    const objectKey = (uploadPrefix ? `${uploadPrefix}/${normalizedRef}` : normalizedRef).replace(/\\/g, '/');
    const exists = await objectExists(s3, s3Bucket, objectKey);

    if (exists) {
      skippedCount += 1;
    } else {
      await uploadFile({
        s3,
        bucket: s3Bucket,
        localFilePath: localPublicPath,
        objectKey,
      });
      uploadedCount += 1;
    }

    const cdnUrl = buildPublicUrl(cdnBase, s3Bucket, s3Region, objectKey);
    refToCdnUrl.set(ref, cdnUrl);
  }

  let updatedFiles = 0;

  for (const [filePath, refs] of fileToRefs.entries()) {
    let raw = await fs.readFile(filePath, 'utf8');
    let changed = false;

    for (const ref of refs) {
      const cdnUrl = refToCdnUrl.get(ref);
      if (!cdnUrl) continue;
      if (!raw.includes(ref)) continue;
      raw = raw.split(ref).join(cdnUrl);
      changed = true;
    }

    if (!changed) continue;
    await fs.writeFile(filePath, raw, 'utf8');
    updatedFiles += 1;
  }

  console.log(`References found: ${localRefs.size}`);
  console.log(`Uploaded: ${uploadedCount}`);
  console.log(`Skipped (already existed): ${skippedCount}`);
  console.log(`Updated files: ${updatedFiles}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
