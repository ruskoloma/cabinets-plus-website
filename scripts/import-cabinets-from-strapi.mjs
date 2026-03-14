#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { S3Client, CopyObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { dump as toYaml } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const STRAPI_BASE_URL = "https://strapi.spokanecabinetsplus.com";
const STRAPI_ENDPOINT = `${STRAPI_BASE_URL}/api/cabinets`;
const DEFAULT_UPLOAD_PREFIX = "uploads/cabinets";
const CONTENT_DIR = path.join(projectRoot, "content", "cabinets");

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

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
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
  };
  return map[mime] || "";
}

function safeFilename(name, id, mime) {
  const ext = (path.extname(name || "") || extFromMime(mime || "") || ".bin").toLowerCase();
  const base = normalizeSlug(path.basename(name || "file", path.extname(name || ""))) || "file";
  return `${String(id || "0")}-${base}${ext}`;
}

function inferPaintOption(name, manufacturer) {
  const value = `${name || ""} ${manufacturer || ""}`.toLowerCase();

  if (/(off[ -]?white|antique white|ivory|cream)/.test(value)) return "off white";
  if (/(white|frost|snow)/.test(value)) return "white";
  if (/(blue|navy)/.test(value)) return "blue";
  if (/(green|sage)/.test(value)) return "green";
  if (/(black|onyx)/.test(value)) return "black";
  if (/(gray|grey|cinder|ash|smoke|slate)/.test(value)) return "gray";
  if (/(brown|toffee|saddle|espresso|mocha|walnut|kodiak|sand)/.test(value)) return "brown";
  if (/(oak|maple|cherry|hickory|timber|wood)/.test(value)) return "timber";

  return "custom paint";
}

function inferStainType(name, description, specs) {
  const specsText =
    specs && typeof specs === "object"
      ? Object.entries(specs)
          .map(([key, value]) => `${key} ${String(value || "")}`)
          .join(" ")
      : "";
  const value = `${name || ""} ${description || ""} ${specsText}`.toLowerCase();
  if (/(white glaze)/.test(value)) return "white glaze stain";
  if (/(mocha)/.test(value)) return "mocha stain";
  return "";
}

function generateDescription(name) {
  const model = name || "This";
  return `${model} sample door is produced using the exact same manufacturing process as our full cabinet line, ensuring absolute consistency in material selection, construction methods, and finishing techniques. The style, recessed panel, stile and rail dimensions, and solid birchwood are aligned with our true cabinet products, offering a precise representation of the quality you can expect in your completed cabinets.\n\nThis sample allows you to inspect the authentic craftsmanship, durability, and finish before making your final selection.`;
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

async function fetchAllCabinets(token) {
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

function collectMedia(attributes) {
  const all = [];

  const addFile = (entity, sourceKind) => {
    if (!entity || !entity.id || !entity.attributes) return;
    all.push({
      id: entity.id,
      sourceKind,
      ...entity.attributes,
    });
  };

  const picture = attributes?.Picture?.data;
  if (picture) addFile(picture, "picture");

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
      // Fall through to download+upload when direct copy is unavailable.
    }
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download media (${response.status}) from ${sourceUrl}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mime || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return "uploaded";
}

async function cleanCabinetContentDir() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const files = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const deletions = files
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => fs.unlink(path.join(CONTENT_DIR, entry.name)));
  await Promise.all(deletions);
}

async function main() {
  await loadEnvFile(path.join(projectRoot, ".env"));

  const token = parseArg("token") || process.env.STRAPI_TOKEN;
  if (!token) {
    throw new Error("Missing Strapi token. Pass --token=... or set STRAPI_TOKEN in environment.");
  }

  const uploadPrefix = (parseArg("upload-prefix") || DEFAULT_UPLOAD_PREFIX).replace(/\/+$/, "");
  const s3Bucket = process.env.S3_BUCKET;
  const s3Region = process.env.S3_REGION;
  const s3AccessKey = process.env.S3_ACCESS_KEY;
  const s3SecretKey = process.env.S3_SECRET_KEY;
  const cdnBase = process.env.S3_CDN_URL || "";

  if (!s3Bucket || !s3Region || !s3AccessKey || !s3SecretKey) {
    throw new Error("Missing S3 credentials in environment (.env): S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  const s3 = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
    },
  });

  const cabinets = await fetchAllCabinets(token);
  if (!cabinets.length) {
    throw new Error("No cabinets returned from Strapi.");
  }

  await cleanCabinetContentDir();

  let mediaCopied = 0;
  let mediaUploaded = 0;
  let mediaSkipped = 0;

  const usedSlugs = new Set();
  const normalizedCabinets = [];

  for (const cabinet of cabinets) {
    const attributes = cabinet?.attributes || {};
    const name = String(attributes?.Name || "Unnamed Cabinet").trim();
    const code = normalizeCode(attributes?.Code || name || `CAB-${cabinet.id}`) || `CAB-${cabinet.id}`;

    let slug = normalizeSlug(attributes?.Code || attributes?.Name || `cabinet-${cabinet.id}`) || `cabinet-${cabinet.id}`;
    if (usedSlugs.has(slug)) {
      let idx = 2;
      while (usedSlugs.has(`${slug}-${idx}`)) idx += 1;
      slug = `${slug}-${idx}`;
    }
    usedSlugs.add(slug);

    normalizedCabinets.push({
      cabinet,
      attributes,
      name,
      code,
      slug,
    });
  }

  for (let index = 0; index < normalizedCabinets.length; index += 1) {
    const { cabinet, attributes, name, code, slug } = normalizedCabinets[index];
    const mediaFiles = collectMedia(attributes);
    const mediaEntries = [];
    let pictureUrl = "";

    for (const file of mediaFiles) {
      const sourceUrl = new URL(file.url, STRAPI_BASE_URL).toString();
      const fileName = safeFilename(file.name, file.id, file.mime);
      const objectKey = `${uploadPrefix}/${code}/${fileName}`;
      const publicUrl = buildCdnUrl(cdnBase, s3Bucket, s3Region, objectKey);

      const exists = await objectExists(s3, s3Bucket, objectKey);
      if (exists) {
        mediaSkipped += 1;
      } else {
        const mode = await uploadFromRemote({
          s3,
          bucket: s3Bucket,
          key: objectKey,
          sourceUrl,
          mime: file.mime,
        });
        if (mode === "copied") mediaCopied += 1;
        if (mode === "uploaded") mediaUploaded += 1;
      }

      mediaEntries.push({
        file: publicUrl,
        roomPriority: false,
        paintPriority: false,
        stainPriority: false,
        countertopPriority: false,
        flooring: false,
        room: "",
        cabinetPaints: [],
        cabinetStains: [],
        countertop: "",
        label: file.name || "",
        description: file.alternativeText || file.caption || "",
      });

      if (file.sourceKind === "picture" && !pictureUrl) pictureUrl = publicUrl;
    }

    const specs = attributes?.Specs && typeof attributes.Specs === "object" ? attributes.Specs : {};
    const technicalDetails = Object.entries(specs).map(([key, value], index) => ({
      key,
      value: value == null ? "" : String(value),
      unit: "",
      order: index + 1,
    }));
    const manufacturer = String(attributes?.Manufacturer || "").trim();
    if (manufacturer && !technicalDetails.some((item) => String(item.key || "").toLowerCase() === "manufacturer")) {
      technicalDetails.unshift({
        key: "Manufacturer",
        value: manufacturer,
        unit: "",
        order: 0,
      });
      technicalDetails.forEach((item, index) => {
        item.order = index + 1;
      });
    }

    const relatedProducts = [];
    for (let offset = 1; relatedProducts.length < 4 && offset < normalizedCabinets.length; offset += 1) {
      const candidate = normalizedCabinets[(index + offset) % normalizedCabinets.length];
      if (!candidate || candidate.slug === slug) continue;
      relatedProducts.push({
        product: `${candidate.slug}.md`,
      });
    }

    const frontmatter = {
      name,
      code,
      slug,
      paint: inferPaintOption(name, manufacturer),
      stainType: inferStainType(name, attributes?.Description || "", specs),
      description:
        typeof attributes?.Description === "string" && attributes.Description.trim()
          ? attributes.Description.trim()
          : generateDescription(name),
      picture: pictureUrl,
      relatedProjects: [],
      relatedProducts,
      technicalDetails,
      media: mediaEntries,
      sourceId: Number(cabinet.id),
      sourceUpdatedAt: attributes?.updatedAt || null,
    };

    const markdown = `---\n${toYaml(frontmatter, {
      noRefs: true,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
      sortKeys: false,
    })}---\n`;

    await fs.writeFile(path.join(CONTENT_DIR, `${slug}.md`), markdown, "utf8");
  }

  const summary = {
    importedAt: new Date().toISOString(),
    cabinets: cabinets.length,
    media: {
      copiedWithinS3: mediaCopied,
      uploadedFromDownload: mediaUploaded,
      skippedExisting: mediaSkipped,
    },
    contentPath: "content/cabinets",
    uploadPrefix,
  };

  await fs.writeFile(path.join(CONTENT_DIR, "_import-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`Imported ${summary.cabinets} cabinets.`);
  console.log(`Media copied within S3: ${mediaCopied}`);
  console.log(`Media uploaded from remote download: ${mediaUploaded}`);
  console.log(`Media skipped (already existed): ${mediaSkipped}`);
  console.log(`Output directory: ${CONTENT_DIR}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
