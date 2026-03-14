#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { CopyObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const TEXT_FILE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
]);

const SKIP_DIR_NAMES = new Set([".git", ".next", "node_modules", ".vercel", ".tina", "dist", "build"]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
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

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const s3Bucket = process.env.S3_BUCKET;
  const s3Region = process.env.S3_REGION;
  const s3AccessKey = process.env.S3_ACCESS_KEY;
  const s3SecretKey = process.env.S3_SECRET_KEY;

  if (!s3Bucket || !s3Region || !s3AccessKey || !s3SecretKey) {
    throw new Error("Missing S3 credentials in .env: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  const s3Host = `${s3Bucket}.s3.${s3Region}.amazonaws.com`;
  const oldBase = `https://${s3Host}/uploads/site-assets/figma/`;
  const newBase = `https://${s3Host}/library/`;
  const oldUrlRegex = new RegExp(`${escapeRegex(oldBase)}[A-Za-z0-9/_\\-.]+`, "g");

  const s3 = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
    },
  });

  const textFiles = await collectTextFiles(projectRoot);
  const fileToOldUrls = new Map();
  const oldUrls = new Set();

  for (const filePath of textFiles) {
    const raw = await fs.readFile(filePath, "utf8");
    const matches = raw.match(oldUrlRegex);
    if (!matches || matches.length === 0) continue;
    const deduped = [...new Set(matches)];
    fileToOldUrls.set(filePath, deduped);
    for (const url of deduped) oldUrls.add(url);
  }

  if (oldUrls.size === 0) {
    console.log("No S3 URLs found under uploads/site-assets/figma.");
    return;
  }

  let copied = 0;
  let skipped = 0;
  let missingSource = 0;
  const migratedUrlMap = new Map();

  for (const oldUrl of [...oldUrls].sort()) {
    const tail = oldUrl.slice(oldBase.length);
    const oldKey = `uploads/site-assets/figma/${tail}`;
    const newKey = `library/${tail}`;

    const sourceExists = await objectExists(s3, s3Bucket, oldKey);
    if (!sourceExists) {
      missingSource += 1;
      console.warn(`WARN source missing: ${oldKey}`);
      continue;
    }

    const destExists = await objectExists(s3, s3Bucket, newKey);
    if (destExists) {
      skipped += 1;
      migratedUrlMap.set(oldUrl, `${newBase}${tail}`);
      continue;
    }

    await s3.send(
      new CopyObjectCommand({
        Bucket: s3Bucket,
        CopySource: `/${s3Bucket}/${oldKey}`,
        Key: newKey,
        MetadataDirective: "COPY",
      })
    );
    copied += 1;
    migratedUrlMap.set(oldUrl, `${newBase}${tail}`);
  }

  let updatedFiles = 0;

  for (const [filePath, urls] of fileToOldUrls.entries()) {
    let raw = await fs.readFile(filePath, "utf8");
    let changed = false;
    for (const oldUrl of urls) {
      const newUrl = migratedUrlMap.get(oldUrl);
      if (!newUrl) continue;
      if (!raw.includes(oldUrl)) continue;
      raw = raw.split(oldUrl).join(newUrl);
      changed = true;
    }
    if (!changed) continue;
    await fs.writeFile(filePath, raw, "utf8");
    updatedFiles += 1;
  }

  console.log(`Found old URLs: ${oldUrls.size}`);
  console.log(`Copied objects: ${copied}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Missing source objects: ${missingSource}`);
  console.log(`Updated files: ${updatedFiles}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
