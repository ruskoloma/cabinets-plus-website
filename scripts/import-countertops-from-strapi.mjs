#!/usr/bin/env node

import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { S3Client, CopyObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { dump as toYaml } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const STRAPI_BASE_URL = "https://strapi.spokanecabinetsplus.com";
const STRAPI_ENDPOINT = `${STRAPI_BASE_URL}/api/countertops`;
const DEFAULT_UPLOAD_PREFIX = "uploads/countertops";
const CONTENT_DIR = path.join(projectRoot, "content", "countertops");
const CACHE_FILE = path.join(CONTENT_DIR, "_vision-cache.json");
const DEFAULT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5.4";
const DESCRIPTION_CACHE_VERSION = "countertop-description-v1";
const DESCRIPTION_FOOTER =
  "This sample allows you to inspect the authentic craftsmanship, durability, and finish before making your final selection.";
const DESCRIPTION_CONCURRENCY = Number(process.env.COUNTERTOP_VISION_CONCURRENCY || 3);

function parseArg(name) {
  const pref = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(pref));
  return hit ? hit.slice(pref.length) : undefined;
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

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extFromMime(mime) {
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
  };
  return map[mime] || "";
}

function safeFilename(name, id, mime) {
  const ext = (path.extname(name || "") || extFromMime(mime || "") || ".bin").toLowerCase();
  const base = normalizeSlug(path.basename(name || "file", path.extname(name || ""))) || "file";
  return `${String(id || "0")}-${base}${ext}`;
}

function parseS3Location(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname;
    const pathname = parsed.pathname.replace(/^\//, "");

    const virtualHostMatch = host.match(/^(.+)\.s3[.-][a-z0-9-]+\.amazonaws\.com$/i);
    if (virtualHostMatch) {
      return {
        bucket: virtualHostMatch[1],
        key: decodeURIComponent(pathname),
      };
    }

    const pathStyleMatch = host.match(/^s3[.-][a-z0-9-]+\.amazonaws\.com$/i);
    if (pathStyleMatch) {
      const [bucket, ...rest] = pathname.split("/");
      if (!bucket || rest.length === 0) return null;
      return {
        bucket: decodeURIComponent(bucket),
        key: decodeURIComponent(rest.join("/")),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function buildCdnUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, "")}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function requestJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strapi request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  return response.json();
}

async function fetchAllCountertops(token) {
  const pageSize = 100;
  let page = 1;
  let pageCount = 1;
  const all = [];

  while (page <= pageCount) {
    const params = new URLSearchParams();
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("filters[StoreCollection][$eq]", "in-stock");
    params.set("populate", "*");

    const payload = await requestJson(`${STRAPI_ENDPOINT}?${params.toString()}`, token);
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const meta = payload?.meta?.pagination;

    all.push(...items);
    pageCount = Number(meta?.pageCount || 1);
    page += 1;
  }

  return all;
}

function mediaKindFromMime(mime, fileName) {
  const normalizedMime = String(mime || "").toLowerCase();
  if (normalizedMime.startsWith("image/")) return "image";
  if (normalizedMime.startsWith("video/")) return "video";

  const ext = path.extname(fileName || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) return "image";
  if ([".mp4", ".mov", ".webm", ".m4v"].includes(ext)) return "video";
  return "other";
}

function collectMedia(attributes) {
  const all = [];

  const addFile = (entity, sourceKind) => {
    if (!entity || !entity.id || !entity.attributes) return;

    const url = entity.attributes?.url;
    if (!url) return;

    const formats = entity.attributes?.formats || {};
    const analysisUrl = formats?.medium?.url || formats?.small?.url || formats?.thumbnail?.url || url;

    all.push({
      id: entity.id,
      sourceKind,
      sourceUrl: url.startsWith("http") ? url : `${STRAPI_BASE_URL}${url}`,
      analysisUrl: analysisUrl.startsWith("http") ? analysisUrl : `${STRAPI_BASE_URL}${analysisUrl}`,
      ...entity.attributes,
    });
  };

  const picture = attributes?.Picture?.data;
  if (picture) addFile(picture, "picture");

  const mediaItems = attributes?.Media?.data;
  if (Array.isArray(mediaItems)) {
    for (const item of mediaItems) addFile(item, "gallery");
  }

  const deduped = [];
  const seen = new Set();
  for (const file of all) {
    const key = String(file.id);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(file);
  }

  deduped.sort((left, right) => {
    if (left.sourceKind === right.sourceKind) return Number(left.id) - Number(right.id);
    if (left.sourceKind === "picture") return -1;
    if (right.sourceKind === "picture") return 1;
    return Number(left.id) - Number(right.id);
  });

  return deduped;
}

function readCatalogSettingsOptions() {
  try {
    const raw = JSON.parse(readFileSync(path.join(projectRoot, "content", "global", "catalog-settings.json"), "utf8"));
    return Array.isArray(raw.countertopTypes)
      ? raw.countertopTypes
          .map((entry) => (typeof entry === "string" ? entry : entry?.value || entry?.label))
          .map((entry) => normalizeLabel(entry))
          .filter(Boolean)
      : ["Quartz", "Granite", "Marble", "Quartzite", "Soapstone", "Porcelain", "Butcher Block", "Other"];
  } catch {
    return ["Quartz", "Granite", "Marble", "Quartzite", "Soapstone", "Porcelain", "Butcher Block", "Other"];
  }
}

function normalizeCountertopType(value, allowedValues) {
  const normalized = normalizeLabel(value);
  if (!normalized) return "";

  const exact = allowedValues.find((entry) => entry.toLowerCase() === normalized.toLowerCase());
  return exact || normalized;
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

function normalizeSentence(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^"+|"+$/g, "")
    .trim();
}

function takeWords(text, count) {
  return normalizeSentence(text).split(" ").filter(Boolean).slice(0, count).join(" ");
}

function finalizeParagraph(text) {
  const trimmed = normalizeSentence(text);
  if (!trimmed) return "";
  const limited = takeWords(trimmed, 60) || trimmed;
  return /[.!?]$/.test(limited) ? limited : `${limited}.`;
}

function buildFallbackDescription(name, countertopType) {
  const typeLead = countertopType ? `${countertopType} slab` : "Slab";
  return finalizeParagraph(
    `${typeLead} ${name ? `for ${name}` : ""} presents a balanced mix of soft tonal variation, flowing movement, and refined contrast. The surface reads clean and polished from a distance, while the pattern adds depth and designer character up close, making it feel bright, versatile, and visually elevated without becoming overly busy.`
  );
}

async function loadCache() {
  try {
    const parsed = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
    return {
      version: parsed.version || "",
      descriptions: parsed.descriptions || {},
    };
  } catch {
    return {
      version: DESCRIPTION_CACHE_VERSION,
      descriptions: {},
    };
  }
}

async function saveCache(cache) {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
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
          "X-Title": "Cabinets Plus Countertop Import",
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

      const payload = JSON.parse(text);
      return payload?.choices?.[0]?.message?.content || "";
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw lastError;
}

async function describeCountertop({ apiKey, model, item, cache }) {
  const primaryImage = item.primaryImage;
  const cacheKey = `${item.sourceId}:${item.sourceUpdatedAt || ""}:${model}`;
  if (cache.descriptions?.[cacheKey]) {
    return cache.descriptions[cacheKey];
  }

  const fallback = buildFallbackDescription(item.name, item.countertopType);
  if (!primaryImage?.analysisUrl) {
    const description = `${fallback}\n\n${DESCRIPTION_FOOTER}`;
    cache.descriptions[cacheKey] = description;
    await saveCache(cache);
    return description;
  }

  let description = "";
  try {
    const raw = await callOpenRouter({
      apiKey,
      model,
      body: {
        max_tokens: 220,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Analyze this countertop slab image and return strict JSON only with the key "description". ` +
                  `Write one paragraph of 45-60 words describing only the visible color palette, veining, movement, contrast, and overall design character. ` +
                  `Do not mention pricing, stock, showroom, camera angle, fabrication claims, or room usage. ` +
                  `Countertop name: ${item.name}. ` +
                  `Countertop type: ${item.countertopType || "unspecified"}.`,
              },
              { type: "image_url", image_url: { url: primaryImage.analysisUrl } },
            ],
          },
        ],
      },
    });

    const parsed = safeJsonParse(raw);
    description = finalizeParagraph(parsed?.description || raw);
  } catch {
    description = "";
  }

  const firstParagraph = description || fallback;
  const fullDescription = `${firstParagraph}\n\n${DESCRIPTION_FOOTER}`;
  cache.descriptions[cacheKey] = fullDescription;
  await saveCache(cache);
  return fullDescription;
}

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === "NotFound") return false;
    return false;
  }
}

function encodeCopySource(bucket, key) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${encodeURIComponent(bucket)}/${encodedKey}`;
}

async function uploadFromRemote({ s3, bucket, key, sourceUrl, mime }) {
  const source = parseS3Location(sourceUrl);

  if (source) {
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: encodeCopySource(source.bucket, source.key),
          ContentType: mime || undefined,
          MetadataDirective: mime ? "REPLACE" : undefined,
        })
      );
      return "copied";
    } catch {
      // Fall through to download + upload if direct copy is unavailable.
    }
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download media (${response.status}) from ${sourceUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mime || response.headers.get("content-type") || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return "uploaded";
}

function buildTechnicalDetails(item) {
  const entries = [
    ["Manufacturer", item.manufacturer],
    ["Type", item.countertopType],
    ["Thickness", item.thickness],
    ["Size", item.size],
    ["Finish", item.finish],
  ];

  return entries
    .map(([key, value], index) => ({
      key,
      value: normalizeLabel(value),
      unit: "",
      order: index + 1,
    }))
    .filter((entry) => entry.value);
}

async function cleanCountertopContentDir() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const files = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const deletions = files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => fs.unlink(path.join(CONTENT_DIR, entry.name)));
  await Promise.all(deletions);
}

async function mapWithConcurrency(items, concurrency, iteratee) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const token = parseArg("token") || process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;
  const openRouterApiKey = parseArg("openrouter-key") || process.env.OPENROUTER_API_KEY;
  const imageModel = parseArg("image-model") || parseArg("model") || DEFAULT_IMAGE_MODEL;
  const uploadPrefix = (parseArg("upload-prefix") || DEFAULT_UPLOAD_PREFIX).replace(/\/+$/, "");

  if (!token) throw new Error("Missing Strapi token. Pass --token=... or set STRAPI_TOKEN.");
  if (!openRouterApiKey) throw new Error("Missing OpenRouter key. Pass --openrouter-key=... or set OPENROUTER_API_KEY.");

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const cdnBase = process.env.S3_CDN_URL || "";

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 credentials in environment (.env): S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const allowedCountertopTypes = readCatalogSettingsOptions();
  const rawCountertops = await fetchAllCountertops(token);
  if (!rawCountertops.length) {
    throw new Error('No countertops returned from Strapi for StoreCollection = "in-stock".');
  }

  const sortedCountertops = rawCountertops
    .map((countertop) => {
      const attributes = countertop?.attributes || {};
      return {
        countertop,
        attributes,
        name: normalizeLabel(attributes?.Name) || "Unnamed Countertop",
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const usedSlugs = new Set();
  const normalizedCountertops = sortedCountertops.map(({ countertop, attributes, name }) => {
    const code = normalizeCode(attributes?.Code || name || `countertop-${countertop.id}`) || `countertop-${countertop.id}`;
    let slug = normalizeSlug(attributes?.Code || attributes?.Name || `countertop-${countertop.id}`) || `countertop-${countertop.id}`;

    if (usedSlugs.has(slug)) {
      let idx = 2;
      while (usedSlugs.has(`${slug}-${idx}`)) idx += 1;
      slug = `${slug}-${idx}`;
    }
    usedSlugs.add(slug);

    const mediaFiles = collectMedia(attributes);
    const primaryImage = mediaFiles.find((file) => file.sourceKind === "picture") || mediaFiles[0] || null;

    return {
      sourceId: Number(countertop.id),
      sourceUpdatedAt: attributes?.updatedAt || null,
      name,
      code,
      slug,
      manufacturer: normalizeLabel(attributes?.Manufacturer),
      countertopType: normalizeCountertopType(attributes?.Type, allowedCountertopTypes),
      thickness: normalizeLabel(attributes?.Thickness),
      size: normalizeLabel(attributes?.Size),
      finish: normalizeLabel(attributes?.Finish),
      mediaFiles,
      primaryImage,
    };
  });

  let cache = await loadCache();
  if (cache.version !== DESCRIPTION_CACHE_VERSION) {
    cache = { version: DESCRIPTION_CACHE_VERSION, descriptions: {} };
  }

  const descriptions = await mapWithConcurrency(
    normalizedCountertops,
    DESCRIPTION_CONCURRENCY,
    async (item) => describeCountertop({ apiKey: openRouterApiKey, model: imageModel, item, cache })
  );

  await cleanCountertopContentDir();

  let mediaCopied = 0;
  let mediaUploaded = 0;
  let mediaSkipped = 0;

  for (let index = 0; index < normalizedCountertops.length; index += 1) {
    const item = normalizedCountertops[index];
    const mediaEntries = [];
    let pictureUrl = "";

    for (const file of item.mediaFiles) {
      const fileName = safeFilename(file.name, file.id, file.mime);
      const objectKey = `${uploadPrefix}/${item.slug}/${fileName}`;
      const publicUrl = buildCdnUrl(cdnBase, bucket, region, objectKey);

      const exists = await objectExists(s3, bucket, objectKey);
      if (exists) {
        mediaSkipped += 1;
      } else {
        const mode = await uploadFromRemote({
          s3,
          bucket,
          key: objectKey,
          sourceUrl: file.sourceUrl,
          mime: file.mime,
        });

        if (mode === "copied") mediaCopied += 1;
        if (mode === "uploaded") mediaUploaded += 1;
      }

      const entry = {
        file: publicUrl,
        kind: mediaKindFromMime(file.mime, file.name),
        mimeType: normalizeLabel(file.mime),
        isPrimary: file.sourceKind === "picture",
        label: normalizeLabel(file.caption) || normalizeLabel(file.name),
        altText: normalizeLabel(file.alternativeText) || (file.sourceKind === "picture" ? item.name : ""),
        description: normalizeLabel(file.caption),
        sourceId: Number(file.id),
      };

      mediaEntries.push(entry);
      if (entry.isPrimary && !pictureUrl) pictureUrl = publicUrl;
    }

    const frontmatter = {
      name: item.name,
      code: item.code,
      slug: item.slug,
      countertopType: item.countertopType,
      description: descriptions[index],
      picture: pictureUrl,
      technicalDetails: buildTechnicalDetails(item),
      media: mediaEntries,
      sourceId: item.sourceId,
      sourceUpdatedAt: item.sourceUpdatedAt,
    };

    const markdown = `---\n${toYaml(frontmatter, {
      noRefs: true,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
      sortKeys: false,
    })}---\n`;

    await fs.writeFile(path.join(CONTENT_DIR, `${item.slug}.md`), markdown, "utf8");
  }

  const summary = {
    importedAt: new Date().toISOString(),
    countertops: normalizedCountertops.length,
    uploadPrefix,
    descriptionModel: imageModel,
    media: {
      copiedWithinS3: mediaCopied,
      uploadedFromDownload: mediaUploaded,
      skippedExisting: mediaSkipped,
    },
    contentPath: "content/countertops",
  };

  await fs.writeFile(path.join(CONTENT_DIR, "_import-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`Imported ${summary.countertops} countertops.`);
  console.log(`Media copied within S3: ${mediaCopied}`);
  console.log(`Media uploaded from remote download: ${mediaUploaded}`);
  console.log(`Media skipped (already existed): ${mediaSkipped}`);
  console.log(`Output directory: ${CONTENT_DIR}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
