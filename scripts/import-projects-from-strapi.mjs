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
const STRAPI_ENDPOINT = `${STRAPI_BASE_URL}/api/projects`;
const DEFAULT_UPLOAD_PREFIX = "uploads/projects";
const CONTENT_DIR = path.join(projectRoot, "content", "projects");
const CACHE_FILE = path.join(CONTENT_DIR, "_vision-cache.json");
const DEFAULT_PROJECT_MODEL = process.env.OPENROUTER_PROJECT_MODEL || "openai/gpt-5.4";
const DEFAULT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5.4";
const PROJECT_SAMPLE_IMAGE_LIMIT = 10;
const PROJECT_CONCURRENCY = Number(process.env.PROJECT_VISION_CONCURRENCY || 3);
const IMAGE_CONCURRENCY = Number(process.env.IMAGE_VISION_CONCURRENCY || 10);
const PROJECT_META_CACHE_VERSION = "project-meta-v2-no-location";
const IMAGE_CLASSIFICATION_CACHE_VERSION = "image-classification-v3-per-image-arrays-flooring";

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

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (["and", "with", "in", "of", "the", "a", "an"].includes(lower)) return lower;
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\bWa\b/g, "WA")
    .replace(/\bId\b/g, "ID");
}

function extFromMime(mime) {
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
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

async function fetchAllProjects(token) {
  const pageSize = 25;
  let page = 1;
  let pageCount = 1;
  const all = [];

  while (page <= pageCount) {
    const params = new URLSearchParams();
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("populate", "*");

    const url = `${STRAPI_ENDPOINT}?${params.toString()}`;
    const payload = await requestJson(url, token);
    const items = Array.isArray(payload?.data) ? payload.data : [];
    const meta = payload?.meta?.pagination;

    all.push(...items);
    pageCount = Number(meta?.pageCount || 1);
    page += 1;
  }

  return all;
}

function normalizeLabel(value) {
  return String(value || "").trim();
}

function collectMedia(attributes) {
  const all = [];

  const addFile = (entity, sourceKind) => {
    if (!entity || !entity.id || !entity.attributes) return;
    const url = entity.attributes?.url;
    const formats = entity.attributes?.formats || {};
    const mediumUrl = formats?.medium?.url || formats?.small?.url || formats?.thumbnail?.url || url;
    all.push({
      id: entity.id,
      sourceKind,
      analysisUrl: mediumUrl?.startsWith("http") ? mediumUrl : `${STRAPI_BASE_URL}${mediumUrl}`,
      sourceUrl: url?.startsWith("http") ? url : `${STRAPI_BASE_URL}${url}`,
      ...entity.attributes,
    });
  };

  const cover = attributes?.Cover?.data;
  if (cover) addFile(cover, "cover");

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

  return deduped;
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
      // fall through
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

function readCatalogSettingsOptions() {
  try {
    const raw = JSON.parse(readFileSync(path.join(projectRoot, "content", "global", "catalog-settings.json"), "utf8"));
    return {
      rooms: Array.isArray(raw.rooms) ? raw.rooms : ["Kitchen", "Bathroom", "Laundry", "Other"],
      paintOptions: Array.isArray(raw.paintOptions) ? raw.paintOptions.map((entry) => (typeof entry === "string" ? entry : entry?.value)).filter(Boolean) : ["white", "off white", "timber", "gray", "brown", "blue", "green", "black", "custom paint"],
      stainTypes: Array.isArray(raw.stainTypes) ? raw.stainTypes.map((entry) => (typeof entry === "string" ? entry : entry?.value)).filter(Boolean) : ["white glaze stain", "mocha stain"],
      countertopTypes: Array.isArray(raw.countertopTypes) ? raw.countertopTypes : ["Quartz", "Granite", "Marble", "Quartzite", "Porcelain", "Butcher Block", "Other"],
    };
  } catch {
    return {
      rooms: ["Kitchen", "Bathroom", "Laundry", "Other"],
      paintOptions: ["white", "off white", "timber", "gray", "brown", "blue", "green", "black", "custom paint"],
      stainTypes: ["white glaze stain", "mocha stain"],
      countertopTypes: ["Quartz", "Granite", "Marble", "Quartzite", "Porcelain", "Butcher Block", "Other"],
    };
  }
}

const catalogOptions = readCatalogSettingsOptions();

function dedupeStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = normalizeLabel(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

function clampDescription(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function takeWords(text, count) {
  return clampDescription(text).split(" ").filter(Boolean).slice(0, count).join(" ");
}

function coerceAllowed(value, allowed) {
  const normalized = normalizeLabel(value);
  if (!normalized) return "";
  const match = allowed.find((item) => item.toLowerCase() === normalized.toLowerCase());
  return match || "";
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

async function loadCache() {
  try {
    const parsed = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
    return {
      projectMetaVersion: parsed.projectMetaVersion || "",
      imageClassificationVersion: parsed.imageClassificationVersion || "",
      projectMeta: parsed.projectMeta || {},
      imageClassifications: parsed.imageClassifications || {},
    };
  } catch {
    return {
      projectMetaVersion: PROJECT_META_CACHE_VERSION,
      imageClassificationVersion: IMAGE_CLASSIFICATION_CACHE_VERSION,
      projectMeta: {},
      imageClassifications: {},
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
          "X-Title": "Cabinets Plus Vision Import",
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
      const content = payload?.choices?.[0]?.message?.content || "";
      return {
        content,
        raw: payload,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  }

  throw lastError;
}

function fallbackProjectTitle(legacySlug, labels, title) {
  if (normalizeLabel(title)) return normalizeLabel(title);
  const label = dedupeStrings(labels)[0];
  if (label) return titleCase(label);
  return titleCase((legacySlug || "project gallery").replace(/-/g, " "));
}

function sanitizeProjectTitle(value, fallbackTitle) {
  const raw = normalizeLabel(value) || normalizeLabel(fallbackTitle);
  return raw
    .replace(/\b(spokane|post falls|coeur d['’]?alene|deer park|chattaroy|coolin|colbert|mead|nine mile falls|regal street|bolan avenue|whitetail lane|conklin street)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+&\s*$/, "")
    .replace(/^[&\s-]+|[&\s-]+$/g, "")
    .trim();
}

async function analyzeProjectMeta({ apiKey, model, project, mediaFiles, cache }) {
  const cacheKey = String(project.id);
  if (cache.projectMeta?.[cacheKey]) return cache.projectMeta[cacheKey];

  const sampleMedia = mediaFiles.slice(0, PROJECT_SAMPLE_IMAGE_LIMIT);
  const content = [
    {
      type: "text",
      text:
        `Analyze this cabinetry/interior project and return strict JSON only with keys ` +
        `title, description, slug, summaryTags. ` +
        `Rules: title should be concise and marketable; description around 70 words; slug lowercase SEO-friendly with hyphens only; ` +
        `summaryTags should be an array of short factual descriptors. Base the answer mainly on images. ` +
        `Never mention any location, city, street, neighborhood, address, client name, or property identifier in title, description, slug, or tags. ` +
        `Do not use place names even if they appear in filenames or legacy data. Focus on design, cabinetry, room type, material tone, and style only. ` +
        `Legacy slug: ${project.legacySlug || ""}. Existing title: ${normalizeLabel(project.attributes?.Title) || ""}. Imported labels: ${(project.labels || []).join(", ") || "none"}.`,
    },
  ];

  for (const file of sampleMedia) {
    content.push({ type: "text", text: `Image ${file.id} (${file.sourceKind})` });
    content.push({ type: "image_url", image_url: { url: file.analysisUrl } });
  }

  const response = await callOpenRouter({
    apiKey,
    model,
    body: {
      max_tokens: 400,
      messages: [{ role: "user", content }],
    },
  });

  const parsed = safeJsonParse(response.content) || {};
  const fallback = fallbackProjectTitle(project.legacySlug, project.labels, project.attributes?.Title);
  const title = sanitizeProjectTitle(parsed.title, fallback) || fallback;
  const description = clampDescription(parsed.description)
    .replace(/\b(spokane|post falls|coeur d['’]?alene|deer park|chattaroy|coolin|colbert|mead|nine mile falls|washington|idaho)\b/gi, "")
    .replace(/\b[a-z0-9 .,'-]+ (road|rd|street|st|avenue|ave|lane|ln|drive|dr|loop|court|ct|way|blvd)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim() ||
    takeWords(`${title} showcases a custom interior project with tailored cabinetry, refined materials, and a layout designed for daily comfort. Finishes, storage details, and surrounding surfaces work together to create a cohesive, polished space that feels practical, bright, and thoughtfully composed throughout the home.`, 75);
  const slug = normalizeSlug(parsed.slug) || normalizeSlug(title) || normalizeSlug(project.legacySlug) || `project-${project.id}`;
  const summaryTags = Array.isArray(parsed.summaryTags) ? dedupeStrings(parsed.summaryTags) : [];

  const result = { title, description, slug, summaryTags };
  cache.projectMeta[cacheKey] = result;
  await saveCache(cache);
  return result;
}

async function analyzeSingleImage({ apiKey, model, project, file }) {
  const content = [
    {
      type: "text",
      text:
        `Analyze this single project image and return strict JSON only with keys ` +
        `room, cabinetPaints, cabinetStains, countertop, flooring, label, confidence. ` +
        `Allowed room values: Kitchen, Bathroom, Laundry, Other, or empty string. ` +
        `Allowed cabinetPaints values: white, off white, timber, gray, brown, blue, green, black, custom paint. ` +
        `Allowed cabinetStains values: white glaze stain, mocha stain. ` +
        `Allowed countertop values: Quartz, Granite, Marble, Quartzite, Porcelain, Butcher Block, Other, or empty string. ` +
        `flooring must be true only when the floor is clearly visible, occupies a meaningful portion of the image, and is close enough to judge flooring material or style. Otherwise false. ` +
        `cabinetPaints and cabinetStains must be arrays with zero, one, or two values only. ` +
        `Only identify cabinet finishes that are actually visible on cabinetry. Ignore wall color, furniture color, floor color, and decor. ` +
        `If cabinetry is not visible or finish is uncertain, use empty arrays. ` +
        `A painted wood-look finish should still be paint, not stain, unless the image clearly shows a stained wood cabinet finish. ` +
        `Use stain only when the cabinetry visibly reads as stained wood and the stain matches one of the allowed stain values. ` +
        `Never mention any location, address, street, neighborhood, city, or client in the label. ` +
        `Label should be a short factual caption, 2-6 words. ` +
        `Project slug context: ${project.generatedSlug || project.legacySlug || ""}. Imported labels: ${(project.labels || []).join(", ") || "none"}.`,
    },
    { type: "image_url", image_url: { url: file.analysisUrl } },
  ];

  const response = await callOpenRouter({
    apiKey,
    model,
    body: {
      max_tokens: 350,
      messages: [{ role: "user", content }],
    },
  });

  const parsed = safeJsonParse(response.content) || {};
  return {
    room: normalizeLabel(parsed.room),
    cabinetPaints: dedupeStrings(Array.isArray(parsed.cabinetPaints) ? parsed.cabinetPaints : []),
    cabinetStains: dedupeStrings(Array.isArray(parsed.cabinetStains) ? parsed.cabinetStains : []),
    countertop: normalizeLabel(parsed.countertop),
    flooring: Boolean(parsed.flooring),
    label: normalizeLabel(parsed.label),
    confidence: Number(parsed.confidence || 0),
  };
}

async function analyzeProjectImages({ apiKey, model, project, cache }) {
  const uncached = project.mediaFiles.filter((file) => !cache.imageClassifications?.[String(file.id)]);
  if (uncached.length === 0) return;

  const results = await mapWithConcurrency(uncached, IMAGE_CONCURRENCY, async (file) => {
    try {
      return {
        id: String(file.id),
        result: await analyzeSingleImage({ apiKey, model, project, file }),
      };
    } catch {
      return {
        id: String(file.id),
        result: {
          room: "",
          cabinetPaints: [],
          cabinetStains: [],
          countertop: "",
          flooring: false,
          label: "",
          confidence: 0,
        },
      };
    }
  });

  for (const item of results) {
    cache.imageClassifications[item.id] = item.result;
  }

  await saveCache(cache);
}

function projectTokens(project) {
  return new Set(
    [
      project.legacySlug,
      ...(project.labels || []),
      project.generatedTitle,
      project.generatedDescription,
      ...(project.summaryTags || []),
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3)
  );
}

function buildNotes({ legacySlug, labels }) {
  const lines = [];
  if (legacySlug) lines.push(`Old Strapi slug: ${legacySlug}`);
  if (labels.length) lines.push(`Imported labels: ${labels.join(", ")}`);
  return lines.join("\n");
}

function buildMediaDescription({ projectTitle, room, cabinetPaints, cabinetStains, countertop, sourceKind, aiLabel }) {
  const bits = [];
  if (aiLabel) bits.push(aiLabel.toLowerCase());
  if (room) bits.push(room.toLowerCase());
  if (Array.isArray(cabinetPaints) && cabinetPaints.length > 0) bits.push(`${cabinetPaints.join(" + ")} cabinetry`);
  if (Array.isArray(cabinetStains) && cabinetStains.length > 0) bits.push(cabinetStains.join(" + ").toLowerCase());
  if (countertop) bits.push(`${countertop.toLowerCase()} surfaces`);
  if (sourceKind === "cover") bits.push("primary project view");
  return bits.length ? `${projectTitle} featuring ${bits.join(", ")}.` : "";
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
  const projectModel = parseArg("project-model") || parseArg("model") || DEFAULT_PROJECT_MODEL;
  const imageModel = parseArg("image-model") || parseArg("model") || DEFAULT_IMAGE_MODEL;
  if (!token) throw new Error("Missing Strapi token. Pass --token=... or set STRAPI_TOKEN.");
  if (!openRouterApiKey) throw new Error("Missing OpenRouter key. Pass --openrouter-key=... or set OPENROUTER_API_KEY.");

  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const cdnBase = process.env.S3_CDN_URL;
  const uploadPrefix = parseArg("upload-prefix") || DEFAULT_UPLOAD_PREFIX;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 credentials in environment (.env).");
  }

  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const cache = await loadCache();
  if (cache.projectMetaVersion !== PROJECT_META_CACHE_VERSION) {
    cache.projectMeta = {};
    cache.projectMetaVersion = PROJECT_META_CACHE_VERSION;
  }
  if (cache.imageClassificationVersion !== IMAGE_CLASSIFICATION_CACHE_VERSION) {
    cache.imageClassifications = {};
    cache.imageClassificationVersion = IMAGE_CLASSIFICATION_CACHE_VERSION;
  }
  await saveCache(cache);

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const sourceProjects = await fetchAllProjects(token);
  const baseProjects = sourceProjects.map((entry) => {
    const attributes = entry?.attributes || {};
    const labels = Array.isArray(attributes?.Labels)
      ? attributes.Labels.map((item) => normalizeLabel(item?.title)).filter(Boolean)
      : [];
    return {
      id: entry.id,
      attributes,
      labels,
      legacySlug: normalizeLabel(attributes?.Slug),
      address: normalizeLabel(attributes?.Address),
      mediaFiles: collectMedia(attributes),
    };
  });

  const projects = await mapWithConcurrency(baseProjects, PROJECT_CONCURRENCY, async (project) => {
    const meta = await analyzeProjectMeta({
      apiKey: openRouterApiKey,
      model: projectModel,
      project,
      mediaFiles: project.mediaFiles,
      cache,
    });

    const enrichedProject = {
      ...project,
      generatedTitle: meta.title,
      generatedDescription: meta.description,
      generatedSlug: meta.slug,
      summaryTags: meta.summaryTags,
    };

    await analyzeProjectImages({
        apiKey: openRouterApiKey,
        model: imageModel,
        project: enrichedProject,
        cache,
    });

    console.log(`Analyzed project ${project.id}: ${meta.title}`);
    return enrichedProject;
  });

  const slugCounts = new Map();
  for (const project of projects) {
    const baseSlug = project.generatedSlug;
    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);
    if (count > 0) project.generatedSlug = `${baseSlug}-${count + 1}`;
  }

  const tokenSets = new Map(projects.map((project) => [project.generatedSlug, projectTokens(project)]));
  const relatedMap = new Map();
  for (const project of projects) {
    const currentTokens = tokenSets.get(project.generatedSlug) || new Set();
    const scored = [];
    for (const candidate of projects) {
      if (candidate.generatedSlug === project.generatedSlug) continue;
      const otherTokens = tokenSets.get(candidate.generatedSlug) || new Set();
      let overlap = 0;
      for (const token of currentTokens) {
        if (otherTokens.has(token)) overlap += 1;
      }
      const score = overlap;
      scored.push({ slug: candidate.generatedSlug, score, title: candidate.generatedTitle });
    }
    scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    relatedMap.set(project.generatedSlug, scored.slice(0, 3).map((item) => item.slug));
  }

  const stats = {
    copiedWithinS3: 0,
    uploadedFromDownload: 0,
    skippedExisting: 0,
  };

  for (const project of projects) {
    const mediaEntries = await mapWithConcurrency(project.mediaFiles, 6, async (file) => {
      const fileName = safeFilename(file.name, file.id, file.mime);
      const objectKey = `${uploadPrefix}/${project.generatedSlug}/${fileName}`;
      const publicUrl = buildCdnUrl(cdnBase, bucket, region, objectKey);

      const exists = await objectExists(s3, bucket, objectKey);
      if (!exists) {
        const result = await uploadFromRemote({
          s3,
          bucket,
          key: objectKey,
          sourceUrl: file.sourceUrl,
          mime: file.mime,
        });
        if (result === "copied") stats.copiedWithinS3 += 1;
        if (result === "uploaded") stats.uploadedFromDownload += 1;
      } else {
        stats.skippedExisting += 1;
      }

      const ai = cache.imageClassifications[String(file.id)] || {};
      const confidence = Number(ai.confidence || 0);
      const room = confidence >= 0.75 ? coerceAllowed(ai.room, catalogOptions.rooms) : "";
      const cabinetPaints = confidence >= 0.86
        ? dedupeStrings(Array.isArray(ai.cabinetPaints) ? ai.cabinetPaints.map((value) => coerceAllowed(value, catalogOptions.paintOptions)) : []).slice(0, 2)
        : [];
      const cabinetStains = confidence >= 0.9
        ? dedupeStrings(Array.isArray(ai.cabinetStains) ? ai.cabinetStains.map((value) => coerceAllowed(value, catalogOptions.stainTypes)) : []).slice(0, 2)
        : [];
      const countertop = confidence >= 0.82 ? coerceAllowed(ai.countertop, catalogOptions.countertopTypes) : "";
      const label = normalizeLabel(ai.label) || normalizeLabel(file.name) || path.basename(fileName);

      return {
        file: publicUrl,
        roomPriority: false,
        paintPriority: false,
        stainPriority: false,
        countertopPriority: false,
        flooring: confidence >= 0.8 ? Boolean(ai.flooring) : false,
        room,
        cabinetPaints,
        cabinetStains,
        countertop,
        label,
        description: buildMediaDescription({
          projectTitle: project.generatedTitle,
          room,
          cabinetPaints,
          cabinetStains,
          countertop,
          sourceKind: file.sourceKind,
          aiLabel: ai.label,
        }),
      };
    });

    const coverIndex = project.mediaFiles.findIndex((file) => file.sourceKind === "cover");
    const primaryPicture = coverIndex >= 0 ? mediaEntries[coverIndex]?.file || "" : mediaEntries[0]?.file || "";

    const output = {
      title: project.generatedTitle,
      slug: project.generatedSlug,
      description: takeWords(project.generatedDescription, 85),
      address: project.address || "",
      notes: buildNotes({ legacySlug: project.legacySlug, labels: project.labels }),
      primaryPicture,
      relatedProjects: relatedMap.get(project.generatedSlug) || [],
      media: mediaEntries,
      sourceId: project.id,
      sourceUpdatedAt: project.attributes?.updatedAt || null,
    };

    const yaml = toYaml(output, {
      lineWidth: 100,
      noRefs: true,
      quotingType: "'",
      forceQuotes: false,
      sortKeys: false,
    }).trimEnd();

    const filePath = path.join(CONTENT_DIR, `${project.generatedSlug}.md`);
    await fs.writeFile(filePath, `---\n${yaml}\n---\n`, "utf8");
  }

  const generatedFiles = new Set(projects.map((project) => `${project.generatedSlug}.md`));
  const existingFiles = (await fs.readdir(CONTENT_DIR)).filter((name) => name.endsWith(".md"));
  await Promise.all(
    existingFiles
      .filter((name) => !generatedFiles.has(name))
      .map((name) => fs.unlink(path.join(CONTENT_DIR, name)))
  );

  const summary = {
    importedAt: new Date().toISOString(),
    projects: projects.length,
    projectModel,
    imageModel,
    media: stats,
    contentPath: path.relative(projectRoot, CONTENT_DIR),
    uploadPrefix,
  };

  await fs.writeFile(path.join(CONTENT_DIR, "_import-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
