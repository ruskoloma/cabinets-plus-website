#!/usr/bin/env node

import { promises as fs } from "node:fs";
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

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const CONTENT_DIR = path.join(projectRoot, "content", "projects");
const DEFAULT_SOURCE_DIR = path.join(projectRoot, "new-projects");
const TEMP_ROOT = path.join(os.tmpdir(), "cabinets-plus-zip-import");
const DEFAULT_UPLOAD_PREFIX = "uploads/projects";
const DEFAULT_PROJECT_MODEL = process.env.OPENROUTER_PROJECT_MODEL || "openai/gpt-5.4";
const DEFAULT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5.4";
const PROJECT_SAMPLE_IMAGE_LIMIT = 12;
const IMAGE_CONCURRENCY = Number(process.env.IMAGE_VISION_CONCURRENCY || 4);
const MAX_ORIGINAL_WIDTH = 2400;
const ORIGINAL_QUALITY = 82;
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|heic|heif|tif|tiff)$/i;

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

const ROOM_VALUES = ["Kitchen", "Bathroom", "Laundry", "Other"];
const PAINT_VALUES = ["white", "off white", "timber", "gray", "brown", "blue", "green", "black", "custom paint"];
const STAIN_VALUES = ["white glaze stain", "mocha stain"];
const COUNTERTOP_VALUES = ["Quartz", "Granite", "Marble", "Quartzite", "Porcelain", "Butcher Block", "Other"];

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
  return String(value || "").replace(/\s+/g, " ").trim();
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

function ensureUniqueSlug(initialSlug, usedSlugs) {
  const base = normalizeSlug(initialSlug) || "project";
  if (!usedSlugs.has(base)) {
    usedSlugs.add(base);
    return base;
  }

  let suffix = 2;
  while (usedSlugs.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  const slug = `${base}-${suffix}`;
  usedSlugs.add(slug);
  return slug;
}

async function listImageFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
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

async function callOpenRouter({ apiKey, model, body }) {
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

async function analyzeProjectMeta({ apiKey, model, uploadedMedia, titleHint, zipHint }) {
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

  try {
    const result = safeJsonParse(
      await callOpenRouter({
        apiKey,
        model,
        body: {
          max_tokens: 500,
          messages: [{ role: "user", content }],
        },
      }),
    );

    return {
      title: normalizeLabel(titleHint || result?.title),
      description: clampDescription(result?.description),
      summaryTags: Array.isArray(result?.summaryTags) ? dedupeStrings(result.summaryTags) : [],
    };
  } catch {
    return {
      title: normalizeLabel(titleHint),
      description: "",
      summaryTags: [],
    };
  }
}

function coerceAllowed(value, allowed) {
  const normalized = normalizeLabel(value);
  if (!normalized) return "";

  const exact = allowed.find((item) => item.toLowerCase() === normalized.toLowerCase());
  if (exact) return exact;

  const lower = normalized.toLowerCase();

  if (allowed === ROOM_VALUES) {
    if (/(powder|bath|vanity)/i.test(lower)) return "Bathroom";
    if (/(laundry|mudroom|utility)/i.test(lower)) return "Laundry";
    if (/(kitchen|pantry)/i.test(lower)) return "Kitchen";
    if (/(living|entry|hall|office|bar|closet)/i.test(lower)) return "Other";
  }

  if (allowed === COUNTERTOP_VALUES) {
    if (lower.includes("quartzite")) return "Quartzite";
    if (lower.includes("quartz")) return "Quartz";
    if (lower.includes("granite")) return "Granite";
    if (lower.includes("marble")) return "Marble";
    if (lower.includes("porcelain")) return "Porcelain";
    if (lower.includes("butcher")) return "Butcher Block";
    if (lower.includes("stone") || lower.includes("solid surface")) return "Other";
  }

  return "";
}

function mapPaintValue(value) {
  const normalized = normalizeLabel(value).toLowerCase();
  if (!normalized) return "";

  if (["white"].includes(normalized)) return "white";
  if (["off white", "cream", "ivory", "beige-white", "warm white"].includes(normalized)) return "off white";
  if (["timber", "wood", "wood tone", "natural wood", "light wood", "medium wood", "oak", "walnut", "maple"].includes(normalized)) {
    return "timber";
  }
  if (["gray", "grey", "charcoal"].includes(normalized)) return "gray";
  if (["brown", "espresso", "chocolate"].includes(normalized)) return "brown";
  if (["blue", "navy"].includes(normalized)) return "blue";
  if (["green", "olive", "sage"].includes(normalized)) return "green";
  if (["black"].includes(normalized)) return "black";
  if (["custom paint", "painted custom color"].includes(normalized)) return "custom paint";

  return "";
}

function mapStainValue(value) {
  const normalized = normalizeLabel(value).toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("white glaze")) return "white glaze stain";
  if (normalized.includes("mocha")) return "mocha stain";
  return "";
}

function buildFilenameLabel(sourceName, fallbackIndex) {
  const normalized = normalizeLabel(path.basename(sourceName, path.extname(sourceName)).replace(/[_-]+/g, " "));
  if (!normalized) return `Project photo ${fallbackIndex + 1}`;
  return titleCasePhrase(normalized);
}

async function analyzeSingleImage({ apiKey, model, projectTitle, media }) {
  const content = [
    {
      type: "text",
      text:
        `Analyze this single interior project image and return strict JSON only. ` +
        `Required keys: room, cabinetPaints, cabinetStains, countertop, flooring, label, confidence. ` +
        `Allowed room values: Kitchen, Bathroom, Laundry, Other, or empty string. ` +
        `Allowed cabinetPaints values: white, off white, timber, gray, brown, blue, green, black, custom paint. ` +
        `Allowed cabinetStains values: white glaze stain, mocha stain. ` +
        `Allowed countertop values: Quartz, Granite, Marble, Quartzite, Porcelain, Butcher Block, Other, or empty string. ` +
        `cabinetPaints and cabinetStains must be arrays with zero, one, or two items. ` +
        `Only identify cabinet finishes that are clearly visible on cabinetry. Ignore wall, decor, or flooring color. ` +
        `flooring is true only when the floor is clearly visible and substantial in the frame. ` +
        `label should be a short factual caption, 2-6 words, with no address or client names. ` +
        `Project title context: ${projectTitle || "Project"}.`,
    },
    { type: "image_url", image_url: { url: media.featureUrl } },
  ];

  try {
    const parsed =
      safeJsonParse(
        await callOpenRouter({
          apiKey,
          model,
          body: {
            max_tokens: 400,
            messages: [{ role: "user", content }],
          },
        }),
      ) || {};

    const cabinetPaints = dedupeStrings(
      (Array.isArray(parsed.cabinetPaints) ? parsed.cabinetPaints : [])
        .map((value) => mapPaintValue(value))
        .filter(Boolean),
    ).slice(0, 2);

    const cabinetStains = dedupeStrings(
      (Array.isArray(parsed.cabinetStains) ? parsed.cabinetStains : [])
        .map((value) => mapStainValue(value))
        .filter(Boolean),
    ).slice(0, 2);

    return {
      room: coerceAllowed(parsed.room, ROOM_VALUES),
      cabinetPaints,
      cabinetStains,
      countertop: coerceAllowed(parsed.countertop, COUNTERTOP_VALUES),
      flooring: Boolean(parsed.flooring),
      label: normalizeLabel(parsed.label),
      confidence: Number(parsed.confidence || 0),
    };
  } catch {
    return {
      room: "",
      cabinetPaints: [],
      cabinetStains: [],
      countertop: "",
      flooring: false,
      label: "",
      confidence: 0,
    };
  }
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

function buildMediaDescription({ projectTitle, room, cabinetPaints, cabinetStains, countertop, aiLabel, isCover }) {
  const parts = [];

  if (aiLabel) parts.push(aiLabel.toLowerCase());
  if (room) parts.push(room.toLowerCase());
  if (cabinetPaints.length) parts.push(`${cabinetPaints.join(" + ")} cabinetry`);
  if (cabinetStains.length) parts.push(cabinetStains.join(" + ").toLowerCase());
  if (countertop) parts.push(`${countertop.toLowerCase()} surfaces`);
  if (isCover) parts.push("primary project view");

  if (!parts.length) return `${projectTitle} project image.`;
  return `${projectTitle} featuring ${parts.join(", ")}.`;
}

function scoreMediaForCover(item) {
  const roomScore = item.room === "Kitchen" ? 40 : item.room === "Other" ? 24 : item.room === "Bathroom" ? 16 : item.room === "Laundry" ? 10 : 0;
  const finishScore = item.cabinetPaints.length > 0 || item.cabinetStains.length > 0 ? 12 : 0;
  const countertopScore = item.countertop ? 8 : 0;
  const flooringScore = item.flooring ? 3 : 0;
  const confidenceScore = Number.isFinite(item.confidence) ? item.confidence : 0;
  return roomScore + finishScore + countertopScore + flooringScore + confidenceScore;
}

function createProjectDocument({ title, slug, description, address, media, sourceUpdatedAt }) {
  const coverMedia = media[0];
  const document = {
    published: true,
    title,
    slug,
    description: takeWords(description || fallbackProjectDescription(title), 90),
    ...(address ? { address } : {}),
    ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}),
    primaryPicture: coverMedia?.file || "",
    media,
  };

  return document;
}

async function readOptionalCsvCredentials(csvPath) {
  if (!csvPath) return null;

  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;

  const [accessKeyId, secretAccessKey] = lines[1].replace(/^\uFEFF/, "").split(",");
  if (!normalizeLabel(accessKeyId) || !normalizeLabel(secretAccessKey)) return null;

  return {
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
  };
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const sourceDir = path.resolve(parseArg("source-dir") || DEFAULT_SOURCE_DIR);
  const uploadPrefix = parseArg("upload-prefix") || DEFAULT_UPLOAD_PREFIX;
  const projectModel = parseArg("project-model") || parseArg("model") || DEFAULT_PROJECT_MODEL;
  const imageModel = parseArg("image-model") || parseArg("model") || DEFAULT_IMAGE_MODEL;
  const openRouterApiKey = parseArg("openrouter-key") || process.env.OPENROUTER_API_KEY;
  const csvCredentials = await readOptionalCsvCredentials(parseArg("access-keys-csv"));

  if (!openRouterApiKey) {
    throw new Error("Missing OpenRouter key. Set OPENROUTER_API_KEY or pass --openrouter-key.");
  }

  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const cdnBase = process.env.S3_CDN_URL;
  const accessKeyId = csvCredentials?.accessKeyId || process.env.S3_ACCESS_KEY;
  const secretAccessKey = csvCredentials?.secretAccessKey || process.env.S3_SECRET_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 configuration. Expected S3_REGION, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY.");
  }

  const zipEntries = (await fs.readdir(sourceDir))
    .filter((entry) => entry.toLowerCase().endsWith(".zip"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));

  if (!zipEntries.length) {
    throw new Error(`No zip files found in ${sourceDir}`);
  }

  const existingSlugs = new Set(
    (await fs.readdir(CONTENT_DIR))
      .filter((entry) => entry.toLowerCase().endsWith(".md"))
      .map((entry) => normalizeSlug(entry.replace(/\.md$/i, ""))),
  );
  const usedUploadSlugs = new Set(existingSlugs);

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
  const importTimestamp = new Date().toISOString();

  for (const zipName of zipEntries) {
    const zipPath = path.join(sourceDir, zipName);
    const identity = inferProjectIdentity(zipName);
    const uniqueUploadSlug = ensureUniqueSlug(identity.uploadSlug || normalizeSlug(zipName), usedUploadSlugs);
    const extractionDir = path.join(TEMP_ROOT, uniqueUploadSlug);

    console.log(`Processing ${zipName}`);

    await extractZip(zipPath, extractionDir);
    const imageFiles = await listImageFiles(extractionDir);

    if (!imageFiles.length) {
      console.warn(`Skipping ${zipName}: no image files found.`);
      await fs.rm(extractionDir, { recursive: true, force: true });
      continue;
    }

    console.log(`  found ${imageFiles.length} images`);

    const uploadedMedia = [];
    for (const [index, imagePath] of imageFiles.entries()) {
      const uploaded = await optimizeAndUploadImage({
        s3,
        bucket,
        cdnBase,
        region,
        uploadPrefix,
        projectUploadSlug: uniqueUploadSlug,
        sourcePath: imagePath,
        index,
      });

      uploadedMedia.push(uploaded);
      uploadedImages += 1;

      if ((index + 1) % 5 === 0 || index === imageFiles.length - 1) {
        console.log(`  uploaded ${index + 1}/${imageFiles.length}`);
      }
    }

    console.log("  generating project description");
    const projectMeta = await analyzeProjectMeta({
      apiKey: openRouterApiKey,
      model: projectModel,
      uploadedMedia,
      titleHint: identity.title,
      zipHint: "",
    });

    const resolvedTitle =
      normalizeLabel(identity.title || projectMeta.title) ||
      (identity.isAddressBased ? titleCasePhrase(cleanZipStem(zipName)) : "") ||
      "Custom Residence Project";

    const resolvedSlug = ensureUniqueSlug(identity.slug || normalizeSlug(resolvedTitle), existingSlugs);

    console.log(`  analyzing image metadata for "${resolvedTitle}"`);
    const imageAnalyses = await mapWithConcurrency(uploadedMedia, IMAGE_CONCURRENCY, (media, index) =>
      analyzeSingleImage({
        apiKey: openRouterApiKey,
        model: imageModel,
        projectTitle: resolvedTitle,
        media,
      }).then((result) => ({ ...result, sourceName: media.sourceName, index })),
    );

    const scoredMedia = imageAnalyses.map((analysis, index) => ({
      ...analysis,
      ...uploadedMedia[index],
      fallbackLabel: buildFilenameLabel(uploadedMedia[index].sourceName, index),
      sortScore: scoreMediaForCover(analysis),
    }));

    const coverIndex = scoredMedia.reduce((bestIndex, current, currentIndex, list) => {
      if (bestIndex < 0) return currentIndex;
      return current.sortScore > list[bestIndex].sortScore ? currentIndex : bestIndex;
    }, -1);

    const orderedMedia = [
      ...(coverIndex >= 0 ? [scoredMedia[coverIndex]] : []),
      ...scoredMedia.filter((_, index) => index !== coverIndex),
    ].map((item, orderIndex) => {
      const cabinetPaints = item.confidence >= 0.72 ? item.cabinetPaints : [];
      const cabinetStains = item.confidence >= 0.8 ? item.cabinetStains : [];
      const room = item.room || (cabinetPaints.length || cabinetStains.length || item.countertop ? "Kitchen" : "");
      const label = item.label || item.fallbackLabel;
      const isCover = orderIndex === 0;

      return {
        file: item.fileUrl,
        roomPriority: isCover,
        paintPriority: false,
        stainPriority: false,
        countertopPriority: false,
        flooring: item.confidence >= 0.7 ? Boolean(item.flooring) : false,
        room,
        cabinetPaints,
        cabinetStains,
        countertop: item.confidence >= 0.68 ? item.countertop : "",
        label,
        description: buildMediaDescription({
          projectTitle: resolvedTitle,
          room,
          cabinetPaints,
          cabinetStains,
          countertop: item.confidence >= 0.68 ? item.countertop : "",
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
      sourceUpdatedAt: importTimestamp,
    });

    const outputPath = path.join(CONTENT_DIR, `${resolvedSlug}.md`);

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
    console.log(`  wrote ${path.basename(outputPath)}`);

    if (!hasFlag("keep-temp")) {
      await fs.rm(extractionDir, { recursive: true, force: true });
    }
  }

  console.log(
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        projects: createdFiles.length,
        uploadedImages,
        projectModel,
        imageModel,
        createdFiles,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
