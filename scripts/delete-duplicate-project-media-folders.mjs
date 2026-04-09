#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import { fileURLToPath } from "node:url";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const projectContentDir = path.join(projectRoot, "content", "projects");
const PROJECT_MEDIA_PREFIX = "uploads/projects/";
const GENERATED_VARIANT_PATTERN = /\.(thumb|card|feature|full)\.webp$/i;

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
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

function parseBucketAndRegionFromCdnUrl(url) {
  if (!url) return {};

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    const regionalVirtualHostMatch = host.match(/^(.+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i);
    if (regionalVirtualHostMatch) {
      return {
        bucket: regionalVirtualHostMatch[1],
        region: regionalVirtualHostMatch[2],
      };
    }

    const globalVirtualHostMatch = host.match(/^(.+)\.s3\.amazonaws\.com$/i);
    if (globalVirtualHostMatch) {
      return {
        bucket: globalVirtualHostMatch[1],
      };
    }
  } catch {
    return {};
  }

  return {};
}

function getProjectFolderFromUrl(value) {
  if (typeof value !== "string" || !value.trim()) return undefined;

  try {
    const parsed = new URL(value);
    const match = parsed.pathname.match(/^\/uploads\/projects\/([^/]+)\//i);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function extractProjectMediaUrls(frontmatter) {
  const urls = [];

  if (typeof frontmatter.primaryPicture === "string") {
    urls.push(frontmatter.primaryPicture);
  }

  if (Array.isArray(frontmatter.media)) {
    for (const item of frontmatter.media) {
      if (item && typeof item === "object" && typeof item.file === "string") {
        urls.push(item.file);
      }
    }
  }

  return urls;
}

async function collectReferencedFolders() {
  const entries = await fs.readdir(projectContentDir, { withFileTypes: true });
  const referencedFolders = new Set();

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const absPath = path.join(projectContentDir, entry.name);
    const raw = await fs.readFile(absPath, "utf8");
    const parsed = matter(raw);

    for (const url of extractProjectMediaUrls(parsed.data)) {
      const folder = getProjectFolderFromUrl(url);
      if (folder) referencedFolders.add(folder);
    }
  }

  return referencedFolders;
}

async function listAllProjectPrefixes(s3, bucket) {
  const prefixes = [];
  let continuationToken;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: PROJECT_MEDIA_PREFIX,
        Delimiter: "/",
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.CommonPrefixes || []) {
      if (!item.Prefix) continue;
      prefixes.push(item.Prefix);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return prefixes.sort();
}

async function listAllObjects(s3, bucket, prefix) {
  const items = [];
  let continuationToken;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents || []) {
      if (!item.Key) continue;
      items.push({
        key: item.Key,
        etag: typeof item.ETag === "string" ? item.ETag : "",
        size: Number(item.Size ?? 0),
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items;
}

function buildSignature(prefix, objects) {
  return objects
    .map((item) => `${item.key.slice(prefix.length)}|${item.etag}|${item.size}`)
    .sort()
    .join("\n");
}

function buildOriginalsSignature(prefix, objects) {
  return objects
    .filter((item) => !GENERATED_VARIANT_PATTERN.test(item.key))
    .map((item) => `${item.key.slice(prefix.length)}|${item.etag}|${item.size}`)
    .sort()
    .join("\n");
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function folderNameFromPrefix(prefix) {
  return prefix.replace(/^uploads\/projects\//, "").replace(/\/$/, "");
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env.local"));
  await loadEnvFile(path.join(projectRoot, ".env"));

  const apply = hasFlag("apply");
  const ignoreGeneratedVariants = hasFlag("ignore-generated-variants");
  const derived = parseBucketAndRegionFromCdnUrl(process.env.S3_CDN_URL);
  const bucket = process.env.S3_BUCKET || derived.bucket;
  const region = process.env.S3_REGION || process.env.AWS_REGION || derived.region;
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing S3 credentials. Expected S3_BUCKET, S3_REGION, S3_ACCESS_KEY, and S3_SECRET_KEY (or AWS equivalents).",
    );
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const referencedFolders = await collectReferencedFolders();
  const prefixes = await listAllProjectPrefixes(s3, bucket);

  const prefixMeta = [];
  for (const prefix of prefixes) {
    const folder = folderNameFromPrefix(prefix);
    const objects = await listAllObjects(s3, bucket, prefix);
    const signature = buildSignature(prefix, objects);
    const originalsSignature = buildOriginalsSignature(prefix, objects);

    prefixMeta.push({
      prefix,
      folder,
      objects,
      signature,
      originalsSignature,
      referenced: referencedFolders.has(folder),
    });
  }

  const groups = new Map();
  for (const item of prefixMeta) {
    const groupKey = ignoreGeneratedVariants ? item.originalsSignature : item.signature;
    const entries = groups.get(groupKey) || [];
    entries.push(item);
    groups.set(groupKey, entries);
  }

  const deletions = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const referenced = group.filter((item) => item.referenced);
    const unreferenced = group.filter((item) => !item.referenced);

    if (referenced.length === 0 || unreferenced.length === 0) continue;

    for (const item of unreferenced) {
      const differsOnlyByGeneratedVariants =
        ignoreGeneratedVariants &&
        referenced.some((entry) => entry.signature !== item.signature && entry.originalsSignature === item.originalsSignature);

      deletions.push({
        duplicatePrefix: item.prefix,
        keepPrefixes: referenced.map((entry) => entry.prefix),
        objectCount: item.objects.length,
        differsOnlyByGeneratedVariants,
      });
    }
  }

  deletions.sort((left, right) => left.duplicatePrefix.localeCompare(right.duplicatePrefix));

  console.log(`Referenced project folders: ${referencedFolders.size}`);
  console.log(`Project prefixes in S3: ${prefixes.length}`);
  console.log(`Safe duplicate aliases found: ${deletions.length}`);
  console.log(`Comparison mode: ${ignoreGeneratedVariants ? "original assets only" : "exact object match"}`);

  for (const item of deletions) {
    const suffix = item.differsOnlyByGeneratedVariants ? " [generated variants differ]" : "";
    console.log(`${item.duplicatePrefix} -> keep ${item.keepPrefixes.join(", ")} (${item.objectCount} objects)${suffix}`);
  }

  if (!apply) {
    console.log("Mode: dry-run");
    console.log(
      `Re-run with --apply${ignoreGeneratedVariants ? " --ignore-generated-variants" : ""} to delete only unreferenced project prefixes that duplicate a referenced folder${ignoreGeneratedVariants ? " by original assets" : ""}.`,
    );
    return;
  }

  let deletedObjects = 0;

  for (const item of deletions) {
    const objects = prefixMeta.find((entry) => entry.prefix === item.duplicatePrefix)?.objects || [];
    for (const chunk of chunkArray(objects, 1000)) {
      if (!chunk.length) continue;

      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: chunk.map((object) => ({ Key: object.key })),
            Quiet: true,
          },
        }),
      );
    }

    deletedObjects += objects.length;
  }

  console.log("Mode: apply");
  console.log(`Duplicate prefixes deleted: ${deletions.length}`);
  console.log(`Objects deleted: ${deletedObjects}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
