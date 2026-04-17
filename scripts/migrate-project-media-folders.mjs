#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import { fileURLToPath } from "node:url";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const projectContentDir = path.join(projectRoot, "content", "projects");
const PROJECT_MEDIA_PREFIX = "uploads/projects/";
const DEFAULT_CONCURRENCY = 16;

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

function slugifyProjectTitle(value, fallback = "") {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (normalized) return normalized;

  return String(fallback || "")
    .trim()
    .replace(/\.md$/i, "")
    .toLowerCase();
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

function encodeCopySource(bucket, key) {
  return `/${bucket}/${key.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
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
        size: item.Size ?? 0,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items;
}

async function headObjectSafe(s3, bucket, key) {
  try {
    const response = await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return {
      exists: true,
      etag: typeof response.ETag === "string" ? response.ETag : "",
      size: Number(response.ContentLength || 0),
    };
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 403 || status === 404) {
      return { exists: false, etag: "", size: 0 };
    }
    throw error;
  }
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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

async function buildProjectPlans(projectFilter) {
  const entries = await fs.readdir(projectContentDir, { withFileTypes: true });
  const plans = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    if (projectFilter && !entry.name.includes(projectFilter)) continue;

    const absPath = path.join(projectContentDir, entry.name);
    const raw = await fs.readFile(absPath, "utf8");
    const parsed = matter(raw);
    const title = typeof parsed.data.title === "string" && parsed.data.title.trim()
      ? parsed.data.title.trim()
      : entry.name.replace(/\.md$/i, "");
    const targetFolder = slugifyProjectTitle(title, entry.name);
    const sourceFolders = [
      ...new Set(
        extractProjectMediaUrls(parsed.data)
          .map((value) => getProjectFolderFromUrl(value))
          .filter(Boolean),
      ),
    ];

    if (!sourceFolders.length) continue;

    const changedSourceFolders = sourceFolders.filter((folder) => folder !== targetFolder);
    if (!changedSourceFolders.length) continue;

    plans.push({
      absPath,
      relativePath: path.relative(projectRoot, absPath),
      fileName: entry.name,
      title,
      targetFolder,
      sourceFolders: changedSourceFolders,
      sourcePrefixes: changedSourceFolders.map((folder) => `${PROJECT_MEDIA_PREFIX}${folder}/`),
      targetPrefix: `${PROJECT_MEDIA_PREFIX}${targetFolder}/`,
    });
  }

  return plans.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function updateProjectFiles(plans, apply) {
  let changedFiles = 0;

  for (const plan of plans) {
    let raw = await fs.readFile(plan.absPath, "utf8");
    const previousRaw = raw;

    for (const sourceFolder of plan.sourceFolders) {
      raw = raw.split(`/uploads/projects/${sourceFolder}/`).join(`/uploads/projects/${plan.targetFolder}/`);
    }

    if (raw === previousRaw) continue;

    changedFiles += 1;

    if (apply) {
      await fs.writeFile(plan.absPath, raw, "utf8");
    }
  }

  return changedFiles;
}

function printPlanSummary(plans) {
  console.log(`Projects with renamed media folders: ${plans.length}`);
  for (const plan of plans) {
    console.log(`${plan.relativePath}: ${plan.sourceFolders.join(", ")} -> ${plan.targetFolder}`);
  }
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env.local"));
  await loadEnvFile(path.join(projectRoot, ".env"));

  const apply = hasFlag("apply");
  const skipConflicts = hasFlag("skip-conflicts");
  const projectFilter = parseArg("project");
  const concurrency = parsePositiveInt(parseArg("concurrency"), DEFAULT_CONCURRENCY);
  const plans = await buildProjectPlans(projectFilter);

  if (!plans.length) {
    console.log("No project media folders need renaming.");
    return;
  }

  printPlanSummary(plans);

  if (!apply) {
    console.log("Mode: dry-run");
    console.log("Re-run with --apply to copy objects in S3, update project markdown, and delete old prefixes.");
    return;
  }

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

  const sourceFolderTargets = new Map();
  for (const plan of plans) {
    for (const sourceFolder of plan.sourceFolders) {
      const existingTarget = sourceFolderTargets.get(sourceFolder);
      if (existingTarget && existingTarget !== plan.targetFolder) {
        throw new Error(
          `Source folder "${sourceFolder}" maps to multiple target folders: "${existingTarget}" and "${plan.targetFolder}".`,
        );
      }
      sourceFolderTargets.set(sourceFolder, plan.targetFolder);
    }
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const copyOperations = [];

  for (const plan of plans) {
    for (const sourcePrefix of plan.sourcePrefixes) {
      const objects = await listAllObjects(s3, bucket, sourcePrefix);
      if (!objects.length) {
        console.warn(`WARN source prefix empty: ${sourcePrefix}`);
        continue;
      }

      for (const object of objects) {
        const suffix = object.key.slice(sourcePrefix.length);
        const targetKey = `${plan.targetPrefix}${suffix}`;
        copyOperations.push({
          project: plan.relativePath,
          sourceKey: object.key,
          targetKey,
        });
      }
    }
  }

  if (!copyOperations.length) {
    throw new Error("Found matching project folders in content, but no S3 objects were discovered to migrate.");
  }

  const targetToSource = new Map();
  for (const operation of copyOperations) {
    const existingSource = targetToSource.get(operation.targetKey);
    if (existingSource && existingSource !== operation.sourceKey) {
      throw new Error(
        `Target collision detected: "${operation.targetKey}" would be created from both "${existingSource}" and "${operation.sourceKey}".`,
      );
    }
    targetToSource.set(operation.targetKey, operation.sourceKey);
  }

  const preparedOperations = [];
  const conflictedProjects = new Map();
  let missingSources = 0;
  console.log(`S3 operations queued: ${copyOperations.length}`);
  console.log(`Concurrency: ${concurrency}`);

  await runPool(copyOperations, concurrency, async (operation, index) => {
    if (operation.sourceKey === operation.targetKey) return;

    const sourceHead = await headObjectSafe(s3, bucket, operation.sourceKey);
    if (!sourceHead.exists) {
      missingSources += 1;
      console.warn(`WARN source missing during preflight: ${operation.sourceKey}`);
      return;
    }

    const targetHead = await headObjectSafe(s3, bucket, operation.targetKey);
    if (targetHead.exists && (targetHead.etag !== sourceHead.etag || targetHead.size !== sourceHead.size)) {
      const message = `Target key already exists with different contents: ${operation.targetKey}.`;
      if (skipConflicts) {
        conflictedProjects.set(operation.project, message);
        return;
      }

      throw new Error(`${message} Aborting to avoid overwriting unrelated media.`);
    }

    preparedOperations.push({
      ...operation,
      alreadyCopied: targetHead.exists,
    });

    if ((index + 1) % 250 === 0 || index === copyOperations.length - 1) {
      console.log(`Preflighted ${index + 1}/${copyOperations.length} objects`);
    }
  });

  const safePlans = plans.filter((plan) => !conflictedProjects.has(plan.relativePath));
  const safeProjectPaths = new Set(safePlans.map((plan) => plan.relativePath));
  const filteredOperations = preparedOperations.filter((operation) => safeProjectPaths.has(operation.project));

  let copied = 0;
  let alreadyCopied = 0;
  let deleted = 0;
  const safeToDeleteSourceKeys = [];

  await runPool(filteredOperations, concurrency, async (operation, index) => {
    if (operation.alreadyCopied) {
      alreadyCopied += 1;
      safeToDeleteSourceKeys.push(operation.sourceKey);
    } else {
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: encodeCopySource(bucket, operation.sourceKey),
          Key: operation.targetKey,
          MetadataDirective: "COPY",
        }),
      );

      copied += 1;
      safeToDeleteSourceKeys.push(operation.sourceKey);
    }

    if ((index + 1) % 250 === 0 || index === filteredOperations.length - 1) {
      console.log(`Prepared ${index + 1}/${filteredOperations.length} objects for delete`);
    }
  });

  const changedFiles = await updateProjectFiles(safePlans, true);

  for (const chunk of chunkArray([...new Set(safeToDeleteSourceKeys)], 1000)) {
    if (!chunk.length) continue;

    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );

    deleted += chunk.length;
  }

  console.log(`Mode: apply`);
  console.log(`Objects copied: ${copied}`);
  console.log(`Objects already at target: ${alreadyCopied}`);
  console.log(`Objects missing at source: ${missingSources}`);
  console.log(`Objects deleted from old prefixes: ${deleted}`);
  console.log(`Project files updated: ${changedFiles}`);
  console.log(`Projects skipped for manual review: ${conflictedProjects.size}`);

  if (conflictedProjects.size > 0) {
    for (const [project, message] of conflictedProjects.entries()) {
      console.log(`SKIPPED ${project}: ${message}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
