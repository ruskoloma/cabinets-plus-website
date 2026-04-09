#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { dump as toYaml } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(projectRoot, "content", "countertops");
const SLAB_DIR = path.join(projectRoot, "SLAB INVENTORY");
const CACHE_FILE = path.join(CONTENT_DIR, "_vision-cache.json");
const DEFAULT_UPLOAD_PREFIX = "uploads/countertops";
const DEFAULT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5.4";
const DESCRIPTION_CACHE_VERSION = "local-countertop-description-v1";
const DESCRIPTION_FOOTER =
  "This sample allows you to inspect the authentic craftsmanship, durability, and finish before making your final selection.";

const SLABS = [
  {
    name: "Black Pearl Granite Polished",
    slug: "blackpearlgranitepolished",
    code: "BlackPearlGranitePolished",
    countertopType: "Granite",
    thickness: "3CM",
    finish: "Polished",
    photos: [
      { file: "photo/Black Pearl Granite - polished.jpg", primary: true, altText: "Black Pearl Granite polished finish" },
      { file: "photo/Black Pearl Granite - full slab.jpg", altText: "Black Pearl Granite full slab" },
    ],
    videos: [
      { file: "Video/Black Pearl Granite - polished.mp4" },
    ],
    relatedProducts: [
      "content/countertops/blackpearlgraniteleathered.md",
      "content/countertops/simpleblacklaza.md",
      "content/countertops/cararrablackmistsuede.md",
      "content/countertops/rockygraysparkle.md",
    ],
  },
  {
    name: "Black Pearl Granite Leathered",
    slug: "blackpearlgraniteleathered",
    code: "BlackPearlGraniteLeathered",
    countertopType: "Granite",
    thickness: "3CM",
    finish: "Leathered",
    photos: [
      { file: "photo/Black Pearl Granite - leathered.jpg", primary: true, altText: "Black Pearl Granite leathered finish" },
      { file: "photo/Black Pearl Granite - full slab.jpg", altText: "Black Pearl Granite full slab" },
    ],
    videos: [
      { file: "Video/Black Pearl Granite - leathered.mp4" },
    ],
    relatedProducts: [
      "content/countertops/blackpearlgranitepolished.md",
      "content/countertops/simpleblacklaza.md",
      "content/countertops/cararrablackmistsuede.md",
      "content/countertops/rockywhite.md",
    ],
  },
  {
    name: "Calacatta Gold",
    slug: "calacattagold",
    code: "CalacattaGold",
    countertopType: "Quartz",
    thickness: "3CM",
    photos: [
      { file: "photo/Calacatta Gold .jpg", primary: true, altText: "Calacatta Gold" },
      { file: "photo/Calacatta Gold Full slab .jpg", altText: "Calacatta Gold full slab" },
    ],
    videos: [
      { file: "Video/Calacatta Gold.mp4" },
      { file: "Video/Calacatta Gold(1).mp4" },
    ],
    relatedProducts: [
      "content/countertops/calacattaelitegold.md",
      "content/countertops/calacattaibizagold.md",
      "content/countertops/calacattasimplegold.md",
      "content/countertops/calacattabellagio.md",
    ],
  },
  {
    name: "Calacatta Great",
    slug: "calacattagreat",
    code: "CalacattaGreat",
    countertopType: "Quartz",
    thickness: "3CM",
    photos: [
      { file: "photo/Calacatta Great.jpg", primary: true, altText: "Calacatta Great" },
      { file: "photo/Calacatta Great Full slab .jpg", altText: "Calacatta Great full slab" },
    ],
    videos: [
      { file: "Video/Calacatta Great.mp4" },
      { file: "Video/Calacatta Great(1).mp4" },
    ],
    relatedProducts: [
      "content/countertops/calacattaperfection.md",
      "content/countertops/calacattahighlight.md",
      "content/countertops/calacattadays.md",
      "content/countertops/calacattabrezze.md",
    ],
  },
  {
    name: "Calacatta Royal",
    slug: "calacattaroyal",
    code: "CalacattaRoyal",
    countertopType: "Quartz",
    thickness: "3CM",
    photos: [
      { file: "photo/Calacatta Royal .jpg", primary: true, altText: "Calacatta Royal" },
      { file: "photo/Calacatta Royal Full slab .jpg", altText: "Calacatta Royal full slab" },
    ],
    videos: [
      { file: "Video/Calacatta Royal.mp4" },
      { file: "Video/Calacatta Royal(1).mp4" },
    ],
    relatedProducts: [
      "content/countertops/calacattabellagio.md",
      "content/countertops/calacattahighlight.md",
      "content/countertops/calacattaelitegold.md",
      "content/countertops/calacattaperfection.md",
    ],
  },
  {
    name: "Calacatta Sand",
    slug: "calacattasand",
    code: "CalacattaSand",
    countertopType: "Quartz",
    thickness: "3CM",
    photos: [
      { file: "photo/Calacatta Sand .jpg", primary: true, altText: "Calacatta Sand" },
      { file: "photo/Calacatta Sand Full slab.jpg", altText: "Calacatta Sand full slab" },
    ],
    videos: [
      { file: "Video/Calacatta Sand.mp4" },
      { file: "Video/Calacatta Sand(1).mp4" },
    ],
    relatedProducts: [
      "content/countertops/tajlight.md",
      "content/countertops/tajperfection.md",
      "content/countertops/calacattabrezze.md",
      "content/countertops/calacattabellagio.md",
    ],
  },
  {
    name: "Taj Mahal Real",
    slug: "tajmahalreal",
    code: "TajMahalReal",
    countertopType: "Quartz",
    thickness: "3CM",
    photos: [
      { file: "photo/Taj Mahal Real.jpg", primary: true, altText: "Taj Mahal Real" },
      { file: "photo/Taj Mahal Real Full slab.jpg", altText: "Taj Mahal Real full slab" },
    ],
    videos: [{ file: "Video/Taj Mahal quartz.mp4" }],
    relatedProducts: [
      "content/countertops/tajlight.md",
      "content/countertops/tajperfection.md",
      "content/countertops/calacattaperfection.md",
      "content/countertops/coastalwhite.md",
    ],
  },
];

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
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
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(eqIndex + 1).trim();
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
    `${typeLead} ${name ? `for ${name}` : ""} presents a balanced mix of soft tonal variation, flowing movement, and refined contrast. The surface reads clean and polished from a distance, while the pattern adds depth and designer character up close, making it feel bright, versatile, and visually elevated without becoming overly busy.`,
  );
}

function buildCdnUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, "")}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function mimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

function mediaKindFromPath(filePath) {
  return mimeFromPath(filePath).startsWith("video/") ? "video" : "image";
}

function cleanStem(filePath) {
  return normalizeSlug(path.basename(filePath, path.extname(filePath))) || "file";
}

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadLocalFile({ s3, bucket, key, sourcePath }) {
  const body = await fs.readFile(sourcePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mimeFromPath(sourcePath),
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

async function loadCache() {
  try {
    const parsed = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
    return {
      version: parsed.version || DESCRIPTION_CACHE_VERSION,
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
          "X-Title": "Cabinets Plus Local Countertop Import",
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

async function describeCountertop({ apiKey, model, slab, primaryImageUrl, cache }) {
  const cacheKey = `${slab.slug}:${primaryImageUrl}:${model}`;
  if (cache.descriptions?.[cacheKey]) {
    return cache.descriptions[cacheKey];
  }

  const fallback = buildFallbackDescription(slab.name, slab.countertopType);

  if (!apiKey || !primaryImageUrl) {
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
                  `Countertop name: ${slab.name}. ` +
                  `Countertop type: ${slab.countertopType || "unspecified"}.`,
              },
              { type: "image_url", image_url: { url: primaryImageUrl } },
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

function buildTechnicalDetails(slab) {
  const entries = [
    { key: "Type", value: slab.countertopType, unit: "", order: 2 },
    { key: "Thickness", value: slab.thickness || "3CM", unit: "", order: 3 },
    ...(slab.finish ? [{ key: "Finish", value: slab.finish, unit: "", order: 5 }] : []),
    { key: "Store Collection", value: "in-stock", unit: "", order: 6 },
  ];

  return entries.filter((entry) => String(entry.value || "").trim());
}

function createFrontmatter({ slab, description, pictureUrl, media, sourceUpdatedAt }) {
  return {
    published: true,
    name: slab.name,
    code: slab.code,
    slug: slab.slug,
    countertopType: slab.countertopType || "",
    description,
    picture: pictureUrl,
    relatedProducts: slab.relatedProducts.map((product) => ({ product })),
    technicalDetails: buildTechnicalDetails(slab),
    media,
    sourceUpdatedAt,
  };
}

async function ensureSourceFilesExist() {
  for (const slab of SLABS) {
    for (const item of [...slab.photos, ...slab.videos]) {
      const fullPath = path.join(SLAB_DIR, item.file);
      await fs.access(fullPath);
    }
  }
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));
  await ensureSourceFilesExist();

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const cdnBase = process.env.S3_CDN_URL || "";
  const uploadPrefix = (parseArg("upload-prefix") || DEFAULT_UPLOAD_PREFIX).replace(/\/+$/, "");
  const openRouterApiKey = parseArg("openrouter-key") || process.env.OPENROUTER_API_KEY || "";
  const imageModel = parseArg("image-model") || parseArg("model") || DEFAULT_IMAGE_MODEL;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 credentials in environment: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  await fs.mkdir(CONTENT_DIR, { recursive: true });

  let cache = await loadCache();
  if (cache.version !== DESCRIPTION_CACHE_VERSION) {
    cache = { version: DESCRIPTION_CACHE_VERSION, descriptions: {} };
  }

  let mediaUploaded = 0;
  let mediaSkipped = 0;
  const importedAt = new Date().toISOString();

  for (const slab of SLABS) {
    const media = [];
    let pictureUrl = "";
    let photoIndex = 1;
    let videoIndex = 1;

    for (const photo of slab.photos) {
      const sourcePath = path.join(SLAB_DIR, photo.file);
      const ext = path.extname(sourcePath).toLowerCase();
      const fileName = `${String(photoIndex).padStart(2, "0")}-${cleanStem(photo.file)}${ext}`;
      const objectKey = `${uploadPrefix}/${slab.slug}/${fileName}`;
      const publicUrl = buildCdnUrl(cdnBase, bucket, region, objectKey);

      if (await objectExists(s3, bucket, objectKey)) {
        mediaSkipped += 1;
      } else {
        await uploadLocalFile({ s3, bucket, key: objectKey, sourcePath });
        mediaUploaded += 1;
      }

      if (!pictureUrl || photo.primary) {
        pictureUrl = publicUrl;
      }

      media.push({
        file: publicUrl,
        kind: mediaKindFromPath(sourcePath),
        mimeType: mimeFromPath(sourcePath),
        isPrimary: Boolean(photo.primary),
        label: path.basename(photo.file).trim(),
        altText: photo.altText || slab.name,
        description: "",
      });

      photoIndex += 1;
    }

    for (const video of slab.videos) {
      const sourcePath = path.join(SLAB_DIR, video.file);
      const ext = path.extname(sourcePath).toLowerCase();
      const fileName = `${String(videoIndex).padStart(2, "0")}-${cleanStem(video.file)}${ext}`;
      const objectKey = `${uploadPrefix}/${slab.slug}/${fileName}`;
      const publicUrl = buildCdnUrl(cdnBase, bucket, region, objectKey);

      if (await objectExists(s3, bucket, objectKey)) {
        mediaSkipped += 1;
      } else {
        await uploadLocalFile({ s3, bucket, key: objectKey, sourcePath });
        mediaUploaded += 1;
      }

      media.push({
        file: publicUrl,
        kind: "video",
        mimeType: mimeFromPath(sourcePath),
        isPrimary: false,
        label: path.basename(video.file).trim(),
        altText: "",
        description: "",
      });

      videoIndex += 1;
    }

    const description = await describeCountertop({
      apiKey: openRouterApiKey,
      model: imageModel,
      slab,
      primaryImageUrl: pictureUrl,
      cache,
    });

    const frontmatter = createFrontmatter({
      slab,
      description,
      pictureUrl,
      media,
      sourceUpdatedAt: slab.sourceUpdatedAt || importedAt,
    });

    const body = `---\n${toYaml(frontmatter, {
      lineWidth: 100,
      noRefs: true,
      sortKeys: false,
    })}---\n`;

    await fs.writeFile(path.join(CONTENT_DIR, `${slab.slug}.md`), body, "utf8");
  }

  const summary = {
    importedAt,
    slabs: SLABS.map((slab) => slab.slug),
    uploadPrefix,
    descriptionModel: openRouterApiKey ? imageModel : "fallback-description",
    media: {
      uploaded: mediaUploaded,
      skippedExisting: mediaSkipped,
    },
    contentPath: "content/countertops",
  };

  await fs.writeFile(path.join(CONTENT_DIR, "_local-import-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
