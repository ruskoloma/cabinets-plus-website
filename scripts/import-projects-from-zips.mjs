#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { dump as toYaml } from "js-yaml";
import variantPresets from "../lib/image-variant-presets.json" with { type: "json" };
import {
  createOpenRouterUsageSummary,
  loadCatalogOptions,
  normalizeImageAnalysis,
  normalizeText,
  recordOpenRouterUsage,
  scoreCoverCandidate,
  validateProjectDocument,
} from "./project-import-lib.mjs";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const CONTENT_DIR = path.join(projectRoot, "content", "projects");
const DEFAULT_SOURCE_DIR = path.join(projectRoot, "new-projects");
const TEMP_ROOT = path.join(os.tmpdir(), "cabinets-plus-zip-import");
const DEFAULT_MANIFEST_PATH = path.join(projectRoot, ".cache", "project-import", "state.json");
const DEFAULT_UPLOAD_PREFIX = "uploads/projects";
const FALLBACK_PROJECT_MODEL = "openai/gpt-5.4";
const FALLBACK_IMAGE_MODEL = "openai/gpt-5.4";
const MANIFEST_VERSION = 1;
const PROJECT_SAMPLE_IMAGE_LIMIT = 12;
const MAX_ORIGINAL_WIDTH = 2400;
const ORIGINAL_QUALITY = 82;
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|heic|heif|tif|tiff)$/i;
const openRouterJobUsage = createOpenRouterUsageSummary();
let openRouterManagementApiKey = "";
let openRouterCreditsBefore = null;
let openRouterCostReport = null;

const DIRECTION_TOKENS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);
const STREET_SUFFIX_MAP = new Map([
  ["aly", "Alley"],
  ["ave", "Avenue"],
  ["avenue", "Avenue"],
  ["blvd", "Boulevard"],
  ["boulevard", "Boulevard"],
  ["cir", "Circle"],
  ["circle", "Circle"],
  ["ct", "Court"],
  ["court", "Court"],
  ["cv", "Cove"],
  ["cove", "Cove"],
  ["dr", "Drive"],
  ["drive", "Drive"],
  ["hwy", "Highway"],
  ["highway", "Highway"],
  ["ln", "Lane"],
  ["lane", "Lane"],
  ["lp", "Loop"],
  ["loop", "Loop"],
  ["pkwy", "Parkway"],
  ["parkway", "Parkway"],
  ["pl", "Place"],
  ["place", "Place"],
  ["rd", "Road"],
  ["road", "Road"],
  ["sq", "Square"],
  ["street", "Street"],
  ["st", "Street"],
  ["ter", "Terrace"],
  ["terrace", "Terrace"],
  ["trl", "Trail"],
  ["trail", "Trail"],
  ["way", "Way"],
]);

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

function normalizeLabel(value) {
  return normalizeText(value);
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCaseWord(word) {
  const normalized = String(word || "").trim();
  if (!normalized) return "";

  const lower = normalized.toLowerCase();
  if (lower === "wa") return "WA";
  if (lower === "id") return "ID";
  if (lower === "usa") return "USA";
  if (DIRECTION_TOKENS.has(lower)) return lower.toUpperCase();
  if (["and", "of", "the", "on", "at", "with"].includes(lower)) return lower;
  if (/^\d+$/.test(normalized)) return normalized;

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCasePhrase(value) {
  return normalizeLabel(value)
    .split(" ")
    .map((word, index) => {
      const cased = titleCaseWord(word);
      if (index === 0 && cased) return cased.charAt(0).toUpperCase() + cased.slice(1);
      return cased;
    })
    .join(" ");
}

function stripCodeFence(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function safeJsonParse(text) {
  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    return null;
  }
}

function dedupeStrings(values) {
  const output = [];
  const seen = new Set();

  for (const value of values || []) {
    const normalized = normalizeLabel(value);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function takeWords(text, count) {
  return normalizeLabel(text).split(" ").filter(Boolean).slice(0, count).join(" ");
}

function clampDescription(value) {
  return normalizeLabel(value).replace(/\s*([,.;:!?])\s*/g, "$1 ").replace(/\s+/g, " ").trim();
}

function buildCdnUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, "")}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function safeBaseFilename(name, index) {
  const originalBase = path.basename(name, path.extname(name));
  const normalizedBase = normalizeSlug(originalBase) || `photo-${String(index + 1).padStart(2, "0")}`;
  return `${String(index + 1).padStart(2, "0")}-${normalizedBase}`;
}

function cleanZipStem(stem) {
  return normalizeLabel(stem.replace(/\([^)]*\)/g, " "));
}

function buildCleanAddress(value) {
  return titleCasePhrase(
    normalizeLabel(value)
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s+/g, " "),
  ).replace(/, Wa\b/g, ", WA").replace(/, Id\b/g, ", ID");
}

function extractStreetDisplay(value) {
  const raw = cleanZipStem(value);
  const tokens = raw
    .replace(/,/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9-]/g, ""))
    .filter(Boolean);

  if (!tokens.length || !/^\d+[a-zA-Z-]*$/.test(tokens[0])) return null;

  let index = 1;
  if (tokens[index] && DIRECTION_TOKENS.has(tokens[index].toLowerCase())) {
    index += 1;
  }

  const collected = [];

  while (index < tokens.length) {
    const token = tokens[index];
    const lower = token.toLowerCase();
    collected.push(token);

    if (STREET_SUFFIX_MAP.has(lower)) {
      break;
    }

    index += 1;
  }

  if (!collected.length) return null;

  const lastToken = collected[collected.length - 1].toLowerCase();
  if (!STREET_SUFFIX_MAP.has(lastToken)) return null;

  return collected
    .map((token) => {
      const lower = token.toLowerCase();
      return STREET_SUFFIX_MAP.get(lower) || titleCaseWord(token);
    })
    .join(" ");
}

function inferProjectIdentity(zipFileName) {
  const stem = path.basename(zipFileName, path.extname(zipFileName));
  const cleanedStem = cleanZipStem(stem);
  const streetDisplay = extractStreetDisplay(stem);

  if (streetDisplay) {
    const title = `Residence on ${streetDisplay}`;
    return {
      uploadSlug: normalizeSlug(title),
      title,
      slug: normalizeSlug(title),
      address: buildCleanAddress(cleanedStem),
      isAddressBased: true,
    };
  }

  return {
    uploadSlug: normalizeSlug(cleanedStem || stem || "project"),
    title: "",
    slug: "",
    address: "",
    isAddressBased: false,
  };
}

function claimUnusedSlug(initialSlug, usedSlugs, label) {
  const base = normalizeSlug(initialSlug) || "project";
  if (usedSlugs.has(base)) {
    throw new Error(
      `${label || "Project"} resolves to existing slug "${base}". ` +
        `Stop and confirm whether this is an update; the importer will not create a silent -2 duplicate.`,
    );
  }

  usedSlugs.add(base);
  return base;
}

async function listImageFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "__MACOSX" || entry.name.startsWith("._")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listImageFiles(fullPath)));
      continue;
    }

    if (IMAGE_EXTENSION_PATTERN.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) =>
    left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

async function hashFile(filePath, hash) {
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
}

async function fingerprintSource(source) {
  const hash = createHash("sha256");
  hash.update(`${source.kind}\n${source.name}\n`);

  if (source.kind === "zip") {
    await hashFile(source.path, hash);
    return hash.digest("hex");
  }

  const imageFiles = await listImageFiles(source.path);
  for (const imagePath of imageFiles) {
    hash.update(`${path.relative(source.path, imagePath)}\n`);
    await hashFile(imagePath, hash);
  }

  return hash.digest("hex");
}

async function resolveSources(sourceArg, sourceDirArg) {
  if (sourceArg) {
    const sourcePath = path.resolve(sourceArg);
    const stat = await fs.stat(sourcePath);

    if (stat.isDirectory()) {
      return [{ kind: "folder", name: path.basename(sourcePath), path: sourcePath }];
    }

    if (stat.isFile() && sourcePath.toLowerCase().endsWith(".zip")) {
      return [{ kind: "zip", name: path.basename(sourcePath), path: sourcePath }];
    }

    throw new Error(`--source must point to a project image folder or ZIP file: ${sourcePath}`);
  }

  const sourceDir = path.resolve(sourceDirArg || DEFAULT_SOURCE_DIR);
  const zipEntries = (await fs.readdir(sourceDir))
    .filter((entry) => entry.toLowerCase().endsWith(".zip"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));

  if (!zipEntries.length) throw new Error(`No zip files found in ${sourceDir}`);
  return zipEntries.map((name) => ({ kind: "zip", name, path: path.join(sourceDir, name) }));
}

async function readManifest(manifestPath) {
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    if (parsed.version !== MANIFEST_VERSION || !parsed.sources || typeof parsed.sources !== "object") {
      throw new Error(`Unsupported project import manifest at ${manifestPath}`);
    }
    return parsed;
  } catch (error) {
    if (error?.code === "ENOENT") return { version: MANIFEST_VERSION, sources: {} };
    throw error;
  }
}

async function writeManifest(manifestPath, manifest) {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await fs.rename(temporaryPath, manifestPath);
}

async function extractZip(zipPath, destinationPath) {
  await fs.rm(destinationPath, { recursive: true, force: true });
  await fs.mkdir(destinationPath, { recursive: true });
  await execFileAsync("unzip", ["-oq", zipPath, "-d", destinationPath]);
}

function bodyFromBuffer(buffer) {
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

async function uploadBuffer({ s3, bucket, key, body, contentType }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bodyFromBuffer(body),
      ContentType: contentType,
      CacheControl: DEFAULT_CACHE_CONTROL,
    }),
  );
}

async function optimizeAndUploadImage({ s3, bucket, cdnBase, region, uploadPrefix, projectUploadSlug, sourcePath, index }) {
  const sourceBuffer = await fs.readFile(sourcePath);
  const baseFilename = safeBaseFilename(sourcePath, index);
  const originalKey = `${uploadPrefix}/${projectUploadSlug}/${baseFilename}.jpg`;

  const originalBuffer = await sharp(sourceBuffer, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_ORIGINAL_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: ORIGINAL_QUALITY,
      mozjpeg: true,
      progressive: true,
    })
    .toBuffer();

  await uploadBuffer({
    s3,
    bucket,
    key: originalKey,
    body: originalBuffer,
    contentType: "image/jpeg",
  });

  const variantUrls = {};

  for (const [presetName, preset] of Object.entries(variantPresets)) {
    const variantKey = `${uploadPrefix}/${projectUploadSlug}/${baseFilename}.${preset.suffix}.webp`;
    const variantBuffer = await sharp(originalBuffer, { failOn: "none" })
      .resize({
        width: preset.width,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: preset.quality,
      })
      .toBuffer();

    await uploadBuffer({
      s3,
      bucket,
      key: variantKey,
      body: variantBuffer,
      contentType: "image/webp",
    });

    variantUrls[presetName] = buildCdnUrl(cdnBase, bucket, region, variantKey);
  }

  return {
    sourcePath,
    sourceName: path.basename(sourcePath),
    fileUrl: buildCdnUrl(cdnBase, bucket, region, originalKey),
    featureUrl: variantUrls.feature || buildCdnUrl(cdnBase, bucket, region, originalKey),
    variantUrls,
  };
}

async function callOpenRouter({ apiKey, model, body, usageCategory }) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://local.codex.app",
          "X-Title": "Cabinets Plus Zip Import",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          ...body,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`OpenRouter request failed (${response.status}): ${text.slice(0, 1000)}`);
      }

      const parsed = JSON.parse(text);
      recordOpenRouterUsage(openRouterJobUsage, {
        category: usageCategory,
        model,
        usage: parsed?.usage,
      });
      return parsed?.choices?.[0]?.message?.content || "";
    } catch (error) {
      lastError = error;

      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw lastError;
}

async function getOpenRouterCredits(managementApiKey) {
  if (!managementApiKey) return null;

  const response = await fetch("https://openrouter.ai/api/v1/credits", {
    headers: {
      Authorization: `Bearer ${managementApiKey}`,
      "HTTP-Referer": "https://local.codex.app",
      "X-Title": "Cabinets Plus Zip Import",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter credits request failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const data = JSON.parse(text)?.data;
  const totalCreditsUsd = Number(data?.total_credits);
  const totalUsageUsd = Number(data?.total_usage);
  if (!Number.isFinite(totalCreditsUsd) || !Number.isFinite(totalUsageUsd)) {
    throw new Error("OpenRouter credits response contains no usable totals");
  }

  return {
    totalCreditsUsd,
    totalUsageUsd,
    remainingCreditsUsd: totalCreditsUsd - totalUsageUsd,
  };
}

function formatUsd(value) {
  return `$${Number(value || 0).toFixed(6)}`;
}

async function finalizeOpenRouterCostReport() {
  if (openRouterCostReport) return openRouterCostReport;

  let account = null;
  let managementError = "";
  if (openRouterManagementApiKey) {
    try {
      const after = await getOpenRouterCredits(openRouterManagementApiKey);
      account = {
        ...after,
        usageDeltaUsd: openRouterCreditsBefore
          ? Math.max(0, after.totalUsageUsd - openRouterCreditsBefore.totalUsageUsd)
          : null,
      };
    } catch (error) {
      managementError = error.message;
    }
  }

  openRouterCostReport = {
    job: openRouterJobUsage,
    account,
    managementError,
  };

  console.log("OpenRouter cost summary:");
  console.log(`  this job: ${formatUsd(openRouterJobUsage.total.costUsd)} across ${openRouterJobUsage.total.calls} responses`);
  for (const [category, usage] of Object.entries(openRouterJobUsage.categories)) {
    console.log(`  ${category}: ${formatUsd(usage.costUsd)} across ${usage.calls} responses`);
  }
  if (openRouterJobUsage.total.costUnavailableCalls) {
    console.warn(`  warning: ${openRouterJobUsage.total.costUnavailableCalls} responses did not include usage.cost`);
  }
  if (account) {
    if (account.usageDeltaUsd !== null) {
      console.log(`  account usage delta: ${formatUsd(account.usageDeltaUsd)} (may include concurrent OpenRouter activity)`);
    }
    console.log(`  account credits remaining: ${formatUsd(account.remainingCreditsUsd)}`);
  } else if (managementError) {
    console.warn(`  management API cross-check unavailable: ${managementError}`);
  }

  return openRouterCostReport;
}

function pickProjectSampleMedia(uploadedMedia) {
  if (uploadedMedia.length <= PROJECT_SAMPLE_IMAGE_LIMIT) return uploadedMedia;
  const sample = [];
  const maxIndex = uploadedMedia.length - 1;

  for (let i = 0; i < PROJECT_SAMPLE_IMAGE_LIMIT; i += 1) {
    const index = Math.round((i / (PROJECT_SAMPLE_IMAGE_LIMIT - 1)) * maxIndex);
    sample.push(uploadedMedia[index]);
  }

  const deduped = [];
  const seen = new Set();

  for (const item of sample) {
    if (!item || seen.has(item.fileUrl)) continue;
    seen.add(item.fileUrl);
    deduped.push(item);
  }

  return deduped;
}

function fallbackProjectDescription(title) {
  return takeWords(
    `${title} highlights custom cabinetry, thoughtful storage, and a coordinated mix of finishes across the main living spaces. The project balances practical layout decisions with a polished visual palette, creating rooms that feel bright, functional, and carefully composed for everyday use.`,
    85,
  );
}

async function analyzeProjectMeta({ apiKey, model, uploadedMedia, titleHint }) {
  const sampleMedia = pickProjectSampleMedia(uploadedMedia);
  const content = [
    {
      type: "text",
      text:
        `Analyze this completed cabinetry/interior project and return strict JSON only. ` +
        `If titleHint is provided, reuse it exactly. ` +
        `Required keys: title, description. Optional keys: summaryTags. ` +
        `Description should be factual, concise, and around 65-90 words. ` +
        `Avoid mentioning any exact address, city, state, neighborhood, client name, or zip source. ` +
        `Focus on cabinetry style, color palette, room types, surfaces, layout, and overall design feel. ` +
        `titleHint: ${titleHint || "none"}.`,
    },
  ];

  for (const [index, media] of sampleMedia.entries()) {
    content.push({ type: "text", text: `Sample image ${index + 1}` });
    content.push({ type: "image_url", image_url: { url: media.featureUrl } });
  }

  const result = safeJsonParse(
    await callOpenRouter({
      apiKey,
      model,
      usageCategory: "project",
      body: {
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      },
    }),
  );

  const description = clampDescription(result?.description);
  if (!description) {
    throw new Error("OpenRouter returned no usable project description");
  }

  return {
    title: normalizeLabel(titleHint || result?.title),
    description,
    summaryTags: Array.isArray(result?.summaryTags) ? dedupeStrings(result.summaryTags) : [],
  };
}

function buildFilenameLabel(sourceName, fallbackIndex) {
  const normalized = normalizeLabel(path.basename(sourceName, path.extname(sourceName)).replace(/[_-]+/g, " "));
  if (!normalized || /^(?:dsc|img|image|photo|project example)\s*\d+/i.test(normalized) || /^\d[\w\s-]*\d$/i.test(normalized)) {
    return `Project photo ${fallbackIndex + 1}`;
  }
  return titleCasePhrase(normalized);
}

function promptValues(values) {
  return values.map((value) => JSON.stringify(value)).join(", ");
}

async function analyzeSingleImage({ apiKey, model, projectTitle, media, catalogOptions }) {
  const content = [
    {
      type: "text",
      text:
        `Analyze this single interior project image and return strict JSON only. ` +
        `Required keys: room, cabinetPaints, cabinetStains, doorStyles, countertop, flooring, label, confidence, visualQuality. ` +
        `Allowed room values: ${promptValues(catalogOptions.rooms)}, or empty string. ` +
        `Allowed cabinetPaints values: ${promptValues(catalogOptions.paintOptions)}. ` +
        `Allowed cabinetStains values: ${promptValues(catalogOptions.stainTypes)}. ` +
        `Allowed doorStyles values: ${promptValues(catalogOptions.doorStyles)}. ` +
        `Allowed countertop values: ${promptValues(catalogOptions.countertopTypes)}, or empty string. ` +
        `cabinetPaints, cabinetStains, and doorStyles must be arrays with zero, one, or two items. ` +
        `Only identify cabinet finishes that are clearly visible on cabinetry. Ignore wall, decor, or flooring color. ` +
        `flooring is true only when the floor is clearly visible and substantial in the frame. ` +
        `label should be a short factual caption, 2-6 words, with no address or client names. ` +
        `confidence must be an object with room, cabinetPaints, cabinetStains, doorStyles, countertop, flooring, and label scores from 0 to 1. ` +
        `visualQuality must be an object with composition, sharpness, lighting, subjectCoverage, and obstructions scores from 0 to 1. ` +
        `For obstructions, 1 means the main cabinetry or room is heavily blocked; for all other visualQuality fields, 1 is best. ` +
        `Project title context: ${projectTitle || "Project"}.`,
    },
    { type: "image_url", image_url: { url: media.featureUrl } },
  ];

  const parsed = safeJsonParse(
    await callOpenRouter({
      apiKey,
      model,
      usageCategory: "image",
      body: {
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      },
    }),
  );
  const normalized = normalizeImageAnalysis(parsed, catalogOptions);

  if (!normalized.label) {
    throw new Error(`OpenRouter returned no usable label for ${media.sourceName}`);
  }

  return normalized;
}

async function mapWithConcurrency(items, concurrency, iteratee) {
  if (!items.length) return [];

  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, () => worker()),
  );

  return results;
}

function buildMediaDescription({ projectTitle, room, cabinetPaints, cabinetStains, doorStyles, countertop, aiLabel, isCover }) {
  const parts = [];

  if (aiLabel) parts.push(aiLabel.toLowerCase());
  if (room) parts.push(room.toLowerCase());
  if (cabinetPaints.length) parts.push(`${cabinetPaints.join(" + ")} cabinetry`);
  if (cabinetStains.length) parts.push(cabinetStains.join(" + ").toLowerCase());
  if (doorStyles.length) parts.push(`${doorStyles.join(" + ")} cabinet doors`);
  if (countertop) parts.push(`${countertop.toLowerCase()} surfaces`);
  if (isCover) parts.push("primary project view");

  if (!parts.length) return `${projectTitle} project image.`;
  return `${projectTitle} featuring ${parts.join(", ")}.`;
}

function scoreMediaForCover(item) {
  return scoreCoverCandidate(item);
}

function createProjectDocument({ title, slug, description, address, media, sourceUpdatedAt }) {
  const coverMedia = media[0];
  const document = {
    published: true,
    title,
    slug,
    description: takeWords(description || fallbackProjectDescription(title), 90),
    ...(address ? { address } : {}),
    primaryPicture: coverMedia?.file || "",
    media,
    sourceUpdatedAt,
  };

  return document;
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env.local"));
  await loadEnvFile(path.join(projectRoot, ".env"));

  const sources = await resolveSources(parseArg("source"), parseArg("source-dir"));
  const manifestPath = path.resolve(parseArg("manifest") || DEFAULT_MANIFEST_PATH);
  const uploadPrefix = parseArg("upload-prefix") || DEFAULT_UPLOAD_PREFIX;
  const projectModel = parseArg("project-model") || parseArg("model") || process.env.OPENROUTER_PROJECT_MODEL || FALLBACK_PROJECT_MODEL;
  const imageModel = parseArg("image-model") || parseArg("model") || process.env.OPENROUTER_IMAGE_MODEL || FALLBACK_IMAGE_MODEL;
  const configuredImageConcurrency = Number(process.env.IMAGE_VISION_CONCURRENCY || 4);
  const imageConcurrency = Number.isFinite(configuredImageConcurrency) && configuredImageConcurrency > 0
    ? Math.floor(configuredImageConcurrency)
    : 4;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  openRouterManagementApiKey = process.env.OPENROUTER_MANAGEMENT_API_KEY || "";

  if (!openRouterApiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. Inject it through the environment; command-line secrets are not accepted.");
  }

  if (openRouterManagementApiKey) {
    try {
      openRouterCreditsBefore = await getOpenRouterCredits(openRouterManagementApiKey);
    } catch (error) {
      console.warn(`OpenRouter management API preflight unavailable: ${error.message}`);
    }
  }

  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const cdnBase = process.env.S3_CDN_URL;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 configuration. Expected S3_REGION, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY.");
  }

  const catalogOptions = await loadCatalogOptions(projectRoot);
  const manifest = await readManifest(manifestPath);
  let manifestWriteQueue = Promise.resolve();
  const persistManifest = () => {
    manifestWriteQueue = manifestWriteQueue.then(() => writeManifest(manifestPath, manifest));
    return manifestWriteQueue;
  };

  const existingSlugs = new Set(
    (await fs.readdir(CONTENT_DIR))
      .filter((entry) => entry.toLowerCase().endsWith(".md"))
      .map((entry) => normalizeSlug(entry.replace(/\.md$/i, ""))),
  );
  const usedUploadSlugs = new Set(existingSlugs);
  const manifestUploadSlugOwners = new Map(
    Object.entries(manifest.sources)
      .filter(([, state]) => state?.uploadSlug)
      .map(([key, state]) => [state.uploadSlug, key]),
  );

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  await fs.mkdir(TEMP_ROOT, { recursive: true });

  const createdFiles = [];
  let uploadedImages = 0;
  let resumedProjects = 0;
  let skippedProjects = 0;

  for (const source of sources) {
    const fingerprint = await fingerprintSource(source);
    const sourceKey = `${source.kind}:${source.name}:${fingerprint}`;
    const identity = inferProjectIdentity(source.name);
    let sourceState = manifest.sources[sourceKey];

    if (sourceState?.status === "complete") {
      const completedPath = sourceState.outputFile ? path.join(projectRoot, sourceState.outputFile) : "";
      if (!completedPath || !(await fs.stat(completedPath).catch(() => null))) {
        throw new Error(`Manifest says ${source.name} is complete, but its project document is missing`);
      }
      console.log(`Skipping ${source.name}: already completed in import manifest`);
      skippedProjects += 1;
      continue;
    }

    if (!sourceState) {
      const proposedUploadSlug = normalizeSlug(identity.uploadSlug || source.name) || "project";
      const previousOwner = manifestUploadSlugOwners.get(proposedUploadSlug);
      if (previousOwner && previousOwner !== sourceKey) {
        throw new Error(
          `${source.name} changed since an earlier import attempt but still resolves to upload slug ` +
            `"${proposedUploadSlug}". Review the earlier manifest state before overwriting its S3 objects.`,
        );
      }
      const uploadSlug = claimUnusedSlug(
        proposedUploadSlug,
        usedUploadSlugs,
        source.name,
      );
      sourceState = {
        status: "pending",
        sourceKind: source.kind,
        sourceName: source.name,
        fingerprint,
        uploadSlug,
        importedAt: new Date().toISOString(),
        uploadedMedia: [],
        imageAnalyses: [],
      };
      manifest.sources[sourceKey] = sourceState;
      manifestUploadSlugOwners.set(uploadSlug, sourceKey);
      await persistManifest();
    } else {
      const resumableOutputPath = sourceState.outputFile ? path.join(projectRoot, sourceState.outputFile) : "";
      const resumableOutputExists = resumableOutputPath && (await fs.stat(resumableOutputPath).catch(() => null));
      if (usedUploadSlugs.has(sourceState.uploadSlug) && !resumableOutputExists) {
        throw new Error(`Cannot resume ${source.name}: upload slug "${sourceState.uploadSlug}" now collides with existing content`);
      }
      usedUploadSlugs.add(sourceState.uploadSlug);
      resumedProjects += 1;
    }

    const extractionDir = source.kind === "zip" ? path.join(TEMP_ROOT, sourceState.uploadSlug) : null;
    const imageRoot = extractionDir || source.path;

    console.log(`Processing ${source.name}${sourceState.status !== "pending" ? ` (resume: ${sourceState.status})` : ""}`);

    if (source.kind === "zip") await extractZip(source.path, extractionDir);
    const imageFiles = await listImageFiles(imageRoot);

    if (!imageFiles.length) {
      if (!sourceState.uploadedMedia.length) {
        delete manifest.sources[sourceKey];
        manifestUploadSlugOwners.delete(sourceState.uploadSlug);
        await persistManifest();
      }
      if (extractionDir && !hasFlag("keep-temp")) await fs.rm(extractionDir, { recursive: true, force: true });
      throw new Error(`No image files found in ${source.path}`);
    }

    console.log(`  found ${imageFiles.length} images`);

    const uploadedMedia = [];
    for (const [index, imagePath] of imageFiles.entries()) {
      const sourceRelativePath = path.relative(imageRoot, imagePath).split(path.sep).join("/");
      const cached = sourceState.uploadedMedia[index];
      if (cached) {
        if (cached.sourceRelativePath !== sourceRelativePath) {
          throw new Error(`Manifest image order mismatch for ${source.name} at index ${index}`);
        }
        uploadedMedia.push(cached);
        continue;
      }

      const uploaded = await optimizeAndUploadImage({
        s3,
        bucket,
        cdnBase,
        region,
        uploadPrefix,
        projectUploadSlug: sourceState.uploadSlug,
        sourcePath: imagePath,
        index,
      });

      const persistedUpload = { ...uploaded, sourceRelativePath };
      delete persistedUpload.sourcePath;
      sourceState.uploadedMedia[index] = persistedUpload;
      sourceState.status = "uploading";
      uploadedMedia.push(persistedUpload);
      uploadedImages += 1;
      await persistManifest();

      if ((index + 1) % 5 === 0 || index === imageFiles.length - 1) {
        console.log(`  uploaded ${index + 1}/${imageFiles.length}`);
      }
    }
    sourceState.status = "uploaded";
    await persistManifest();

    let projectMeta = sourceState.projectMeta;
    if (!projectMeta) {
      console.log("  generating project description");
      projectMeta = await analyzeProjectMeta({
        apiKey: openRouterApiKey,
        model: projectModel,
        uploadedMedia,
        titleHint: identity.title,
      });
      sourceState.projectMeta = projectMeta;
      sourceState.status = "project-analyzed";
      await persistManifest();
    }

    const resolvedTitle =
      normalizeLabel(identity.title || projectMeta.title) ||
      (identity.isAddressBased ? titleCasePhrase(cleanZipStem(source.name)) : "") ||
      "Custom Residence Project";
    let resolvedSlug = sourceState.resolvedSlug;
    if (!resolvedSlug) {
      resolvedSlug = claimUnusedSlug(identity.slug || normalizeSlug(resolvedTitle), existingSlugs, source.name);
      sourceState.resolvedTitle = resolvedTitle;
      sourceState.resolvedSlug = resolvedSlug;
      await persistManifest();
    } else if (existingSlugs.has(resolvedSlug)) {
      const outputPath = sourceState.outputFile ? path.join(projectRoot, sourceState.outputFile) : "";
      if (outputPath && (await fs.stat(outputPath).catch(() => null))) {
        sourceState.status = "complete";
        await persistManifest();
        skippedProjects += 1;
        console.log(`Skipping ${source.name}: project document already exists from this manifest`);
        if (extractionDir && !hasFlag("keep-temp")) await fs.rm(extractionDir, { recursive: true, force: true });
        continue;
      }
      throw new Error(`Cannot resume ${source.name}: project slug "${resolvedSlug}" now belongs to existing content`);
    } else {
      existingSlugs.add(resolvedSlug);
    }

    const skipImageMeta = hasFlag("skip-image-meta");
    const imageAnalyses = skipImageMeta ? uploadedMedia.map((media, index) => ({
          room: "",
          cabinetPaints: [],
          cabinetStains: [],
          doorStyles: [],
          countertop: "",
          flooring: false,
          label: "",
          confidence: {},
          visualQuality: {},
          sourceName: media.sourceName,
          index,
        })) : await (async () => {
          console.log(`  analyzing image metadata for "${resolvedTitle}"`);
          return mapWithConcurrency(uploadedMedia, imageConcurrency, async (media, index) => {
            const cached = sourceState.imageAnalyses[index];
            if (cached?.sourceName === media.sourceName) return cached;

            const result = await analyzeSingleImage({
              apiKey: openRouterApiKey,
              model: imageModel,
              projectTitle: resolvedTitle,
              media,
              catalogOptions,
            });
            const persistedAnalysis = { ...result, sourceName: media.sourceName, index };
            sourceState.imageAnalyses[index] = persistedAnalysis;
            sourceState.status = "images-analyzing";
            await persistManifest();
            return persistedAnalysis;
          });
        })();
    sourceState.status = "analyzed";
    await persistManifest();

    const scoredMedia = imageAnalyses.map((analysis, index) => ({
      ...analysis,
      ...uploadedMedia[index],
      fallbackLabel: buildFilenameLabel(uploadedMedia[index].sourceName, index),
      sortScore: scoreMediaForCover(analysis),
    }));

    const coverIndex = skipImageMeta
      ? (scoredMedia.length > 0 ? 0 : -1)
      : scoredMedia.reduce((bestIndex, current, currentIndex, list) => {
          if (bestIndex < 0) return currentIndex;
          return current.sortScore > list[bestIndex].sortScore ? currentIndex : bestIndex;
        }, -1);

    const orderedMedia = [
      ...(coverIndex >= 0 ? [scoredMedia[coverIndex]] : []),
      ...scoredMedia.filter((_, index) => index !== coverIndex),
    ].map((item, orderIndex) => {
      const confidence = item.confidence || {};
      const cabinetPaints = confidence.cabinetPaints >= 0.72 ? item.cabinetPaints : [];
      const cabinetStains = confidence.cabinetStains >= 0.8 ? item.cabinetStains : [];
      const doorStyles = confidence.doorStyles >= 0.75 ? item.doorStyles : [];
      const room = confidence.room >= 0.7 ? item.room : "";
      const countertop = confidence.countertop >= 0.68 ? item.countertop : "";
      const label = item.label || item.fallbackLabel;
      const isCover = orderIndex === 0;

      return {
        file: item.fileUrl,
        roomPriority: isCover,
        paintPriority: false,
        stainPriority: false,
        countertopPriority: false,
        flooring: confidence.flooring >= 0.7 ? Boolean(item.flooring) : false,
        room,
        doorStyles,
        cabinetPaints,
        cabinetStains,
        countertop,
        label,
        description: buildMediaDescription({
          projectTitle: resolvedTitle,
          room,
          cabinetPaints,
          cabinetStains,
          doorStyles,
          countertop,
          aiLabel: label,
          isCover,
        }),
      };
    });

    const projectDocument = createProjectDocument({
      title: resolvedTitle,
      slug: resolvedSlug,
      description: projectMeta.description,
      address: identity.address,
      media: orderedMedia,
      sourceUpdatedAt: sourceState.importedAt,
    });
    validateProjectDocument(projectDocument, catalogOptions);

    const outputPath = path.join(CONTENT_DIR, `${resolvedSlug}.md`);
    sourceState.outputFile = path.relative(projectRoot, outputPath).split(path.sep).join("/");
    sourceState.status = "ready-to-write";
    await persistManifest();

    await fs.writeFile(
      outputPath,
      `---\n${toYaml(projectDocument, {
        lineWidth: 100,
        noRefs: true,
        quotingType: "'",
        forceQuotes: false,
        sortKeys: false,
      }).trimEnd()}\n---\n`,
      "utf8",
    );

    createdFiles.push(outputPath);
    sourceState.status = "complete";
    sourceState.completedAt = new Date().toISOString();
    await persistManifest();
    console.log(`  wrote ${path.basename(outputPath)}`);

    if (extractionDir && !hasFlag("keep-temp")) {
      await fs.rm(extractionDir, { recursive: true, force: true });
    }
  }

  const openRouter = await finalizeOpenRouterCostReport();
  console.log(
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        projects: createdFiles.length,
        uploadedImages,
        resumedProjects,
        skippedProjects,
        projectModel,
        imageModel,
        openRouter,
        manifestPath,
        createdFiles,
      },
      null,
      2,
    ),
  );
}

main().catch(async (error) => {
  await finalizeOpenRouterCostReport();
  console.error(error);
  process.exit(1);
});
