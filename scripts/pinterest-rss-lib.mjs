import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DEFAULT_SITE_URL = "https://www.spokanecabinetsplus.com";
const PROJECTS_PATH = ["content", "projects"];
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const FALLBACK_DATE = new Date("2000-01-01T00:00:00.000Z");

export const PINTEREST_FEEDS = [
  {
    id: "kitchen-cabinet-ideas",
    boardName: "Kitchen Cabinet Ideas",
    boardDescription:
      "Kitchen cabinet ideas from real Cabinets Plus projects in Spokane, Washington. Explore white shaker cabinets, natural wood cabinetry, two-tone kitchens, islands, pantries, quartz countertops and modern storage.",
    channelPath: "/kitchen-remodel",
    kind: "primary",
    keywords: ["kitchen cabinet ideas", "kitchen remodel", "custom kitchen cabinets"],
  },
  {
    id: "bathroom-vanity-ideas",
    boardName: "Bathroom Vanity Ideas",
    boardDescription:
      "Bathroom vanity ideas from completed Cabinets Plus projects. Discover floating vanities, double vanities, shaker cabinets, natural wood finishes and stone countertops for Spokane bathroom remodels.",
    channelPath: "/bathroom-remodel",
    kind: "primary",
    keywords: ["bathroom vanity ideas", "bathroom remodel", "custom bathroom cabinets"],
  },
  {
    id: "laundry-mudroom-cabinets",
    boardName: "Laundry Room & Mudroom Cabinets",
    boardDescription:
      "Laundry room and mudroom cabinet ideas featuring built-in storage, entry benches, cubbies and practical custom cabinetry from Cabinets Plus projects in Spokane, Washington.",
    channelPath: "/gallery",
    kind: "primary",
    keywords: ["laundry room cabinets", "mudroom cabinets", "built-in storage"],
  },
  {
    id: "home-bar-cabinet-ideas",
    boardName: "Home Bar & Beverage Center Ideas",
    boardDescription:
      "Home bar cabinet ideas including wet bars, coffee bars, beverage centers, wine storage and entertaining spaces designed with custom cabinetry and stone countertops.",
    channelPath: "/gallery",
    kind: "primary",
    keywords: ["home bar cabinets", "wet bar ideas", "beverage center cabinets"],
  },
  {
    id: "custom-built-ins",
    boardName: "Custom Built-Ins & Home Storage",
    boardDescription:
      "Custom built-in cabinet and home storage ideas for offices, closets, fireplace walls, living rooms, entryways and other tailored spaces by Cabinets Plus in Spokane, Washington.",
    channelPath: "/gallery",
    kind: "primary",
    keywords: ["custom built-ins", "built-in cabinets", "home storage ideas"],
  },
  {
    id: "glass-shower-enclosures",
    boardName: "Glass Shower Enclosure Ideas",
    boardDescription:
      "Glass shower enclosure ideas from completed Spokane-area projects, including frameless shower doors, modern bathroom glass and custom enclosures by Cabinets Plus.",
    channelPath: "/glass-enclosures",
    kind: "primary",
    keywords: ["glass shower enclosure", "frameless shower doors", "bathroom glass ideas"],
  },
  {
    id: "countertop-design-ideas",
    boardName: "Quartz, Quartzite & Stone Countertop Ideas",
    boardDescription:
      "Quartz, quartzite, granite and marble countertop ideas selected from real Cabinets Plus kitchens, bathrooms, islands and home bars in Spokane, Washington.",
    channelPath: "/countertops",
    kind: "curated",
    keywords: ["countertop ideas", "quartz countertops", "quartzite countertops"],
  },
  {
    id: "spokane-remodeling",
    boardName: "Spokane Kitchen & Bathroom Remodeling",
    boardDescription:
      "Kitchen, bathroom and custom cabinetry remodeling inspiration from completed Cabinets Plus projects in Spokane and the Inland Northwest.",
    channelPath: "/gallery",
    kind: "curated",
    keywords: ["Spokane remodeling", "Spokane kitchen remodel", "Spokane bathroom remodel"],
  },
];

const FEED_BY_ID = new Map(PINTEREST_FEEDS.map((feed) => [feed.id, feed]));
const PRIMARY_FEED_IDS = new Set(
  PINTEREST_FEEDS.filter((feed) => feed.kind === "primary").map((feed) => feed.id),
);

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asStringArray(value) {
  return Array.isArray(value) ? value.map(normalizeSpace).filter(Boolean) : [];
}

function unique(values) {
  const result = [];
  const seen = new Set();

  for (const value of values) {
    const normalized = normalizeSpace(value);
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function truncateAtWord(value, maxLength) {
  const normalized = normalizeSpace(value);
  if (normalized.length <= maxLength) return normalized;

  const contentLength = Math.max(1, maxLength - 1);
  const sliced = normalized.slice(0, contentLength + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > contentLength * 0.65 ? lastSpace : contentLength).trim()}…`;
}

function titleCase(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (_match, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/\bWa\b/g, "WA")
    .replace(/\bLvp\b/g, "LVP");
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeSlug(value) {
  return normalizeSpace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function mediaIdentity(file) {
  try {
    const url = new URL(file);
    return decodeURIComponent(url.pathname).replace(/\/{2,}/g, "/");
  } catch {
    return String(file || "").split(/[?#]/)[0];
  }
}

function stableDigest(...parts) {
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

function mimeTypeForImage(file) {
  const pathname = mediaIdentity(file).toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".tif") || pathname.endsWith(".tiff")) return "image/tiff";
  return "image/jpeg";
}

function applyPinterestMediaOverrides(project, media) {
  // This legacy project predates the current image-recognition metadata. Keep
  // its Pinterest classification private to the feed generator so correcting
  // the archive does not alter visible project content in Tina or on the site.
  if (project.slug !== "residence-on-honeycomb-springs-lane") return media;

  const match = normalizeSpace(media.label).match(/^dsc0*(\d+)$/i);
  if (!match) return media;

  const imageNumber = Number(match[1]);
  const withMetadata = (metadata) => ({ ...media, ...metadata });

  if (imageNumber === 2462 || imageNumber === 2398 || imageNumber === 2467) {
    return withMetadata({
      room: "Bathroom",
      label: "Walk-in shower with custom glass enclosure",
    });
  }

  if (imageNumber <= 2304 || imageNumber >= 2512) {
    return withMetadata({
      room: "Kitchen",
      label: "Two-tone white and natural wood kitchen cabinets",
      cabinetPaints: ["white", "timber"],
    });
  }

  if ((imageNumber >= 2325 && imageNumber <= 2359)) {
    return withMetadata({
      room: "Other",
      label: "Living room fireplace built-ins",
      cabinetPaints: ["white", "timber"],
    });
  }

  if (
    (imageNumber >= 2368 && imageNumber <= 2377) ||
    (imageNumber >= 2509 && imageNumber <= 2510)
  ) {
    return withMetadata({
      room: "Laundry",
      label: "Mudroom built-in bench and storage",
      cabinetPaints: ["white"],
    });
  }

  if (
    imageNumber === 2394 ||
    imageNumber === 2400 ||
    (imageNumber >= 2447 && imageNumber <= 2495)
  ) {
    return withMetadata({
      room: "Bathroom",
      label: "Natural wood bathroom vanity",
      cabinetPaints: ["timber"],
    });
  }

  if (imageNumber >= 2406 && imageNumber <= 2444) {
    return withMetadata({
      room: "Laundry",
      label: "Green and white laundry room cabinets",
      cabinetPaints: ["green", "white"],
    });
  }

  if (imageNumber >= 2499 && imageNumber <= 2508) {
    return withMetadata({
      room: "Other",
      label: "Walk-in closet cabinets and storage",
      cabinetPaints: ["timber"],
    });
  }

  return media;
}

function searchableText(media) {
  return normalizeSpace(
    [media.label, media.description, mediaIdentity(media.file)]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();
}

export function classifyPrimaryFeed(project, media) {
  const text = searchableText(media);
  const room = normalizeSpace(media.room).toLowerCase();

  if (/\b(shower|shower enclosure|glass enclosure|shower glass|shower door|frameless shower|bathroom glass)\b/.test(text)) {
    return "glass-shower-enclosures";
  }

  if (/\b(wet bar|dry bar|home bar|coffee bar|coffee station|wine bar|bar area|bar sink|bar cabinets?|bar cabinetry|bar with|beverage center|beverage station|wine storage)\b/.test(text)) {
    return "home-bar-cabinet-ideas";
  }

  if (
    room === "laundry" ||
    /\b(laundry|mudroom|mud room|entry bench|built-in bench|storage bench|cubbies)\b/.test(text)
  ) {
    return "laundry-mudroom-cabinets";
  }

  if (room === "bathroom" || /\b(bathroom|vanity|powder room)\b/.test(text)) {
    return "bathroom-vanity-ideas";
  }

  if (room === "kitchen" || /\b(kitchen|pantry|kitchen island|range hood)\b/.test(text)) {
    return "kitchen-cabinet-ideas";
  }

  return "custom-built-ins";
}

function paintDisplayName(value) {
  const normalized = normalizeSpace(value).toLowerCase();
  const names = {
    white: "White",
    "off white": "Warm White",
    timber: "Natural Wood",
    gray: "Gray",
    brown: "Brown",
    blue: "Blue",
    green: "Green",
    black: "Black",
    "custom paint": "Custom-Painted",
  };
  return names[normalized] || titleCase(normalized);
}

function stainDisplayName(value) {
  const normalized = normalizeSpace(value).toLowerCase();
  if (normalized === "mocha stain") return "Mocha-Stained";
  if (normalized === "white glaze stain") return "White-Glazed";
  return titleCase(normalized);
}

function doorStyleDisplayName(value) {
  const normalized = normalizeSpace(value).toLowerCase();
  if (normalized === "flat panel") return "Flat-Panel";
  if (normalized === "slim shaker") return "Slim Shaker";
  if (normalized === "elegant shaker") return "Elegant Shaker";
  return titleCase(normalized);
}

function finishTitle(media) {
  const finishes = unique([
    ...asStringArray(media.cabinetPaints).map(paintDisplayName),
    ...asStringArray(media.cabinetStains).map(stainDisplayName),
  ]).slice(0, 2);

  if (finishes.length > 1) return `Two-Tone ${finishes.join(" and ")}`;
  return finishes[0] || "";
}

function styleTitle(media) {
  return doorStyleDisplayName(asStringArray(media.doorStyles)[0] || "");
}

function countertopTitle(media) {
  const normalized = normalizeSpace(media.countertop).toLowerCase();
  if (normalized === "other") return "Stone";
  return titleCase(normalized);
}

function joinedTitle(...parts) {
  return normalizeSpace(parts.filter(Boolean).join(" "));
}

function copySafeMediaLabel(media) {
  const label = normalizeSpace(media.label);
  if (!label || label.length < 5 || label.length > 90) return "";
  if (/\.(?:avif|gif|jpe?g|png|tiff?|webp)$/i.test(label)) return "";
  if (/^(?:dsc|img|image|photo|project[- ]?example)[-_ ]?\d+/i.test(label)) return "";
  if (/^\d[\w\s-]*\d$/i.test(label)) return "";
  return label;
}

function basePinterestTitle(feedId, media) {
  const label = normalizeSpace(media.label).toLowerCase();
  const finish = finishTitle(media);
  const style = styleTitle(media);
  const countertop = countertopTitle(media);
  const cabinetStyle = joinedTitle(finish, style);

  if (feedId === "glass-shower-enclosures") {
    if (/frameless/.test(label)) return "Frameless Glass Shower Enclosure Ideas";
    if (/textured|reeded|frosted/.test(label)) return "Textured Glass Shower Door Ideas";
    if (/partition|panel/.test(label)) return "Glass Shower Partition Ideas";
    if (/walk-in|walk in/.test(label)) return "Walk-In Glass Shower Enclosure Ideas";
    if (/tile|tiled/.test(label)) return "Tiled Shower with Custom Glass Enclosure";
    if (/modern/.test(label)) return "Modern Glass Shower Enclosure Ideas";
    if (/door/.test(label)) return "Custom Glass Shower Door Ideas";
    return "Custom Glass Shower Enclosure Ideas";
  }

  if (feedId === "home-bar-cabinet-ideas") {
    const subject = /coffee/.test(label)
      ? "Coffee Bar Cabinets"
      : /beverage/.test(label)
        ? "Beverage Center Cabinets"
        : /wine/.test(label)
          ? "Home Bar Cabinets with Wine Storage"
          : "Home Bar Cabinet Ideas";
    return joinedTitle(cabinetStyle, subject, countertop ? `with ${countertop} Countertops` : "");
  }

  if (feedId === "laundry-mudroom-cabinets") {
    const subject = /mud|entry|bench|cubbi/.test(label)
      ? "Mudroom Cabinets and Built-In Storage"
      : "Laundry Room Cabinet Ideas";
    return joinedTitle(cabinetStyle, subject);
  }

  if (feedId === "bathroom-vanity-ideas") {
    const subject = /double/.test(label) ? "Double Bathroom Vanity" : "Bathroom Vanity Ideas";
    return joinedTitle(cabinetStyle, subject, countertop ? `with ${countertop} Countertop` : "");
  }

  if (feedId === "kitchen-cabinet-ideas") {
    let subject = "Kitchen Cabinet Ideas";
    if (/pantry/.test(label)) subject = "Custom Kitchen Pantry Cabinets";
    else if (/range hood|hood/.test(label)) subject = "Kitchen Cabinets and Range Hood";
    else if (/backsplash/.test(label)) subject = "Kitchen Backsplash and Cabinet Ideas";
    else if (/open shel|floating shel/.test(label)) subject = "Kitchen Cabinets with Open Shelving";
    else if (/island.*seat|seat.*island/.test(label)) subject = "Kitchen Island with Seating";
    else if (/island/.test(label)) subject = countertop ? `Kitchen with ${countertop} Island` : "Kitchen Island Ideas";

    return joinedTitle(cabinetStyle, subject, !/island/.test(subject.toLowerCase()) && countertop ? `with ${countertop} Countertops` : "");
  }

  if (feedId === "countertop-design-ideas") {
    const material = countertop || "Stone";
    if (/waterfall/.test(label)) return `${material} Waterfall Kitchen Island Ideas`;
    if (normalizeSpace(media.room).toLowerCase() === "bathroom" || /vanity/.test(label)) {
      return `${material} Bathroom Vanity Countertop Ideas`;
    }
    if (/island/.test(label)) return `${material} Kitchen Island Countertop Ideas`;
    return `${material} Countertop Design Ideas`;
  }

  let subject = "Custom Built-In Cabinets and Storage";
  if (/office|desk/.test(label)) subject = "Custom Home Office Cabinets";
  else if (/fireplace|media center|entertainment/.test(label)) subject = "Built-In Fireplace and Media Cabinets";
  else if (/closet|wardrobe/.test(label)) subject = "Custom Closet Cabinets and Storage";
  else if (/shelv|bookcase/.test(label)) subject = "Custom Built-In Shelving Ideas";
  else if (/reception/.test(label)) subject = "Custom Reception Desk and Cabinets";
  else if (/dental|operatory/.test(label)) subject = "Custom Dental Office Cabinetry";
  else if (/cafe|service counter/.test(label)) subject = "Custom Cafe Counter and Cabinets";
  else if (/living room|living built/.test(label)) subject = "Living Room Built-In Cabinet Ideas";
  else if (/dining/.test(label)) subject = "Dining Room Built-In Cabinet Ideas";
  else if (/entry|locker/.test(label)) subject = "Entryway Built-In Storage Ideas";
  else if (/display|niche|accent cabinet/.test(label)) subject = "Custom Display Cabinet Ideas";
  else if (/utility/.test(label)) subject = "Custom Utility Room Cabinets";

  return joinedTitle(cabinetStyle, subject);
}

function featureDetails(media) {
  const paints = asStringArray(media.cabinetPaints).map((value) => paintDisplayName(value).toLowerCase());
  const stains = asStringArray(media.cabinetStains).map((value) => stainDisplayName(value).toLowerCase());
  const doorStyles = asStringArray(media.doorStyles).map((value) => `${doorStyleDisplayName(value).toLowerCase()} cabinet doors`);
  const countertop = countertopTitle(media);
  const finishWords = unique([...paints, ...stains]);
  const details = [];

  if (finishWords.length) details.push(`${formatList(finishWords)} cabinetry`);
  details.push(...doorStyles);
  if (countertop) details.push(`${countertop.toLowerCase()} countertops`);

  return unique(details).slice(0, 4);
}

function formatList(values) {
  const filtered = values.filter(Boolean);
  if (filtered.length <= 1) return filtered[0] || "";
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")}, and ${filtered.at(-1)}`;
}

function descriptionCallToAction(feedId) {
  const callsToAction = {
    "kitchen-cabinet-ideas": "Save this kitchen cabinet idea and explore the complete Cabinets Plus project in Spokane, Washington.",
    "bathroom-vanity-ideas": "Save this bathroom vanity idea and explore the complete Cabinets Plus project in Spokane, Washington.",
    "laundry-mudroom-cabinets": "Save this storage idea for your laundry room or mudroom remodel and view the complete Cabinets Plus project.",
    "home-bar-cabinet-ideas": "Save this home bar idea for your entertaining space and view the complete Cabinets Plus project.",
    "custom-built-ins": "Save this custom built-in idea for your home and explore the complete Cabinets Plus project in Spokane, Washington.",
    "glass-shower-enclosures": "Save this shower enclosure idea for your bathroom remodel and explore more custom glass work from Cabinets Plus.",
    "countertop-design-ideas": "Save this countertop idea for your remodel and view the complete Cabinets Plus project in Spokane, Washington.",
    "spokane-remodeling": "Explore the complete local remodeling project from Cabinets Plus in Spokane, Washington.",
  };
  return callsToAction[feedId] || callsToAction["custom-built-ins"];
}

function buildPinterestDescription(feedId, title, media) {
  const baseTitle = title.replace(/\s*\|\s*Spokane, WA\s*$/i, "");
  const mediaLabel = copySafeMediaLabel(media);
  const labelSentence =
    mediaLabel && !baseTitle.toLowerCase().includes(mediaLabel.toLowerCase())
      ? ` This view highlights ${mediaLabel.toLowerCase()}.`
      : "";
  const details = featureDetails(media);
  const detailsSentence = details.length ? ` Design details include ${formatList(details)}.` : "";
  return truncateAtWord(
    `Explore ${baseTitle.toLowerCase()} from a completed Cabinets Plus project.${labelSentence}${detailsSentence} ${descriptionCallToAction(feedId)}`,
    MAX_DESCRIPTION_LENGTH,
  );
}

function buildKeywords(feed, media) {
  return unique([
    ...feed.keywords,
    ...asStringArray(media.cabinetPaints).map((value) => `${paintDisplayName(value)} cabinets`),
    ...asStringArray(media.cabinetStains).map((value) => `${stainDisplayName(value)} cabinets`),
    ...asStringArray(media.doorStyles).map((value) => `${doorStyleDisplayName(value)} cabinets`),
    media.countertop ? `${countertopTitle(media)} countertops` : "",
    media.room ? `${titleCase(media.room)} design` : "",
    "Cabinets Plus",
    "Spokane WA",
  ]).slice(0, 12);
}

function buildProjectUrl(siteUrl, projectSlug, feedId, digest) {
  const url = new URL(`/projects/${encodeURIComponent(projectSlug)}`, `${siteUrl}/`);
  url.searchParams.set("utm_source", "pinterest");
  url.searchParams.set("utm_medium", "organic_social");
  url.searchParams.set("utm_campaign", feedId);
  url.searchParams.set("utm_content", digest.slice(0, 16));
  return url.toString();
}

function buildFeedItem({ feed, project, media, mediaIndex, siteUrl }) {
  const identity = mediaIdentity(media.file);
  const digest = stableDigest(feed.id, project.slug, identity);
  const guid = `urn:cabinets-plus:pinterest:${feed.id}:${digest.slice(0, 32)}`;
  let title = basePinterestTitle(feed.id, media);

  if (feed.id === "spokane-remodeling") {
    const primaryFeedId = classifyPrimaryFeed(project, media);
    title = `${basePinterestTitle(primaryFeedId, media)} | Spokane, WA`;
  }

  title = truncateAtWord(title, MAX_TITLE_LENGTH);
  const description = buildPinterestDescription(feed.id, title, media);
  const projectDate = project.sourceUpdatedAt || FALLBACK_DATE;
  const pubDate = new Date(projectDate.getTime() + mediaIndex * 1000);

  return {
    feedId: feed.id,
    projectSlug: project.slug,
    imageUrl: media.file,
    imageIdentity: identity,
    mimeType: mimeTypeForImage(media.file),
    guid,
    title,
    description,
    link: buildProjectUrl(siteUrl, project.slug, feed.id, digest),
    pubDate,
    keywords: buildKeywords(feed, media),
  };
}

function countertopFocusScore(media, mediaIndex, primaryPicture) {
  if (!normalizeSpace(media.countertop)) return 0;

  const label = normalizeSpace(media.label).toLowerCase();
  const material = normalizeSpace(media.countertop).toLowerCase();
  let score = 0;

  if (media.countertopPriority === true) score += 100;
  if (label.includes(material)) score += 8;
  if (/\b(countertop|counter top|worktop|surface|slab)\b/.test(label)) score += 8;
  if (/\bwaterfall\b/.test(label)) score += 7;
  if (/\b(island|vanity)\b/.test(label)) score += 3;
  if (media.file === primaryPicture || mediaIndex === 0) score += 2;

  return score;
}

function selectCountertopMedia(project) {
  return project.media
    .map((media, mediaIndex) => ({
      media,
      mediaIndex,
      score: countertopFocusScore(media, mediaIndex, project.primaryPicture),
    }))
    .filter((entry) => entry.score >= 8)
    .sort((left, right) => right.score - left.score || left.mediaIndex - right.mediaIndex)
    .slice(0, 3);
}

function selectProjectCover(project) {
  const mediaIndex = project.media.findIndex((media) => media.file === project.primaryPicture);
  const resolvedIndex = mediaIndex >= 0 ? mediaIndex : 0;
  const media = project.media[resolvedIndex];
  return media ? { media, mediaIndex: resolvedIndex } : null;
}

export async function loadPublishedPinterestProjects(projectRoot) {
  const projectsDir = path.join(projectRoot, ...PROJECTS_PATH);
  const filenames = (await fs.readdir(projectsDir)).filter((filename) => /\.md$/i.test(filename)).sort();
  const projects = [];

  for (const filename of filenames) {
    const raw = await fs.readFile(path.join(projectsDir, filename), "utf8");
    const data = matter(raw).data || {};
    if (data.published !== true) continue;

    const slug = normalizeSlug(data.slug || filename);
    const media = (Array.isArray(data.media) ? data.media : [])
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({ ...entry, file: normalizeSpace(entry.file) }))
      .filter((entry) => /^https?:\/\//i.test(entry.file));

    if (!slug || !media.length) continue;

    projects.push({
      filename,
      slug,
      title: normalizeSpace(data.title),
      description: normalizeSpace(data.description),
      primaryPicture: normalizeSpace(data.primaryPicture),
      sourceUpdatedAt: parseDate(data.sourceUpdatedAt),
      media,
    });
  }

  return projects.sort((left, right) => {
    const leftTime = (left.sourceUpdatedAt || FALLBACK_DATE).getTime();
    const rightTime = (right.sourceUpdatedAt || FALLBACK_DATE).getTime();
    return leftTime - rightTime || left.slug.localeCompare(right.slug);
  });
}

function renderRssItem(item) {
  const categories = item.keywords.map((keyword) => `      <category>${xmlEscape(keyword)}</category>`).join("\n");

  return [
    "    <item>",
    `      <title>${xmlEscape(item.title)}</title>`,
    `      <link>${xmlEscape(item.link)}</link>`,
    `      <guid isPermaLink="false">${xmlEscape(item.guid)}</guid>`,
    `      <pubDate>${item.pubDate.toUTCString()}</pubDate>`,
    `      <description>${xmlEscape(item.description)}</description>`,
    categories,
    `      <media:content url="${xmlEscape(item.imageUrl)}" type="${item.mimeType}" medium="image" />`,
    `      <media:title>${xmlEscape(item.title)}</media:title>`,
    `      <media:description>${xmlEscape(item.description)}</media:description>`,
    "    </item>",
  ].join("\n");
}

function renderRssFeed(feed, items, siteUrl) {
  const feedUrl = new URL(`/pinterest/${feed.id}.xml`, `${siteUrl}/`).toString();
  const channelUrl = new URL(feed.channelPath, `${siteUrl}/`).toString();
  const lastBuildDate = items.reduce(
    (latest, item) => (item.pubDate > latest ? item.pubDate : latest),
    FALLBACK_DATE,
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
    "  <channel>",
    `    <title>${xmlEscape(feed.boardName)}</title>`,
    `    <link>${xmlEscape(channelUrl)}</link>`,
    `    <description>${xmlEscape(feed.boardDescription)}</description>`,
    "    <language>en-us</language>",
    `    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
    "    <generator>Cabinets Plus Pinterest RSS Generator</generator>",
    "    <ttl>1440</ttl>",
    `    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items.map(renderRssItem).join("\n"),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export async function buildPinterestFeeds({ projectRoot, siteUrl = DEFAULT_SITE_URL }) {
  const projects = await loadPublishedPinterestProjects(projectRoot);
  const itemsByFeed = new Map(PINTEREST_FEEDS.map((feed) => [feed.id, []]));
  const primaryImageAssignments = new Map();

  for (const project of projects) {
    const pinterestProject = {
      ...project,
      media: project.media.map((media) => applyPinterestMediaOverrides(project, media)),
    };

    pinterestProject.media.forEach((media, mediaIndex) => {
      const feedId = classifyPrimaryFeed(pinterestProject, media);
      const feed = FEED_BY_ID.get(feedId);
      const item = buildFeedItem({ feed, project: pinterestProject, media, mediaIndex, siteUrl });
      itemsByFeed.get(feedId).push(item);
      primaryImageAssignments.set(item.imageIdentity, feedId);
    });

    const countertopFeed = FEED_BY_ID.get("countertop-design-ideas");
    for (const { media, mediaIndex } of selectCountertopMedia(pinterestProject)) {
      itemsByFeed
        .get(countertopFeed.id)
        .push(buildFeedItem({ feed: countertopFeed, project: pinterestProject, media, mediaIndex, siteUrl }));
    }

    const cover = selectProjectCover(pinterestProject);
    if (cover) {
      const localFeed = FEED_BY_ID.get("spokane-remodeling");
      itemsByFeed
        .get(localFeed.id)
        .push(buildFeedItem({ feed: localFeed, project: pinterestProject, ...cover, siteUrl }));
    }
  }

  const feeds = PINTEREST_FEEDS.map((feed) => {
    const items = itemsByFeed
      .get(feed.id)
      .sort((left, right) => right.pubDate - left.pubDate || left.guid.localeCompare(right.guid));

    return {
      ...feed,
      fileName: `${feed.id}.xml`,
      url: new URL(`/pinterest/${feed.id}.xml`, `${siteUrl}/`).toString(),
      items,
      xml: renderRssFeed(feed, items, siteUrl),
    };
  });

  const totalMedia = projects.reduce((total, project) => total + project.media.length, 0);
  validatePinterestFeeds({ feeds, projects, totalMedia, primaryImageAssignments, siteUrl });

  return {
    siteUrl,
    projects,
    feeds,
    summary: {
      publishedProjects: projects.length,
      sourceImages: totalMedia,
      primaryItems: feeds
        .filter((feed) => PRIMARY_FEED_IDS.has(feed.id))
        .reduce((total, feed) => total + feed.items.length, 0),
      curatedItems: feeds
        .filter((feed) => !PRIMARY_FEED_IDS.has(feed.id))
        .reduce((total, feed) => total + feed.items.length, 0),
      feedCounts: Object.fromEntries(feeds.map((feed) => [feed.id, feed.items.length])),
    },
  };
}

export function validatePinterestFeeds({ feeds, projects, totalMedia, primaryImageAssignments, siteUrl }) {
  const errors = [];
  const allGuids = new Set();
  const expectedHost = new URL(siteUrl).hostname;

  if (primaryImageAssignments.size !== totalMedia) {
    errors.push(`Primary image assignment count ${primaryImageAssignments.size} does not match source image count ${totalMedia}.`);
  }

  for (const feed of feeds) {
    if (!feed.items.length) errors.push(`Feed ${feed.id} has no items.`);

    for (const item of feed.items) {
      if (item.title.length > MAX_TITLE_LENGTH) {
        errors.push(`${item.guid} title is ${item.title.length} characters.`);
      }
      if (item.description.length > MAX_DESCRIPTION_LENGTH) {
        errors.push(`${item.guid} description is ${item.description.length} characters.`);
      }
      if (/\bother (?:top|countertops?)\b/i.test(item.title)) {
        errors.push(`${item.guid} contains an unhelpful countertop label in its title.`);
      }
      if (/\b(?:dsc|img|project[- ]?example)[-_ ]?\d+/i.test(item.title)) {
        errors.push(`${item.guid} contains a source filename in its title.`);
      }
      if (allGuids.has(item.guid)) errors.push(`Duplicate GUID: ${item.guid}`);
      allGuids.add(item.guid);

      try {
        const link = new URL(item.link);
        if (link.hostname !== expectedHost) errors.push(`${item.guid} links to ${link.hostname}.`);
      } catch {
        errors.push(`${item.guid} has an invalid project link.`);
      }

      try {
        const image = new URL(item.imageUrl);
        if (!/^https?:$/.test(image.protocol)) errors.push(`${item.guid} has a non-HTTP image URL.`);
      } catch {
        errors.push(`${item.guid} has an invalid image URL.`);
      }
    }
  }

  const primaryItemCount = feeds
    .filter((feed) => PRIMARY_FEED_IDS.has(feed.id))
    .reduce((total, feed) => total + feed.items.length, 0);
  if (primaryItemCount !== totalMedia) {
    errors.push(`Primary feed item count ${primaryItemCount} does not match source image count ${totalMedia}.`);
  }

  if (projects.some((project) => !project.sourceUpdatedAt)) {
    errors.push("One or more published projects are missing a valid sourceUpdatedAt value.");
  }

  if (errors.length) {
    throw new Error(`Pinterest RSS validation failed:\n- ${errors.join("\n- ")}`);
  }
}

export function buildFeedManifest(result) {
  const newestDate = result.projects.reduce(
    (latest, project) =>
      project.sourceUpdatedAt && project.sourceUpdatedAt > latest ? project.sourceUpdatedAt : latest,
    FALLBACK_DATE,
  );

  return {
    generatedFromContentUpdatedThrough: newestDate.toISOString(),
    siteUrl: result.siteUrl,
    ...result.summary,
    feeds: result.feeds.map((feed) => ({
      id: feed.id,
      rssUrl: feed.url,
      boardName: feed.boardName,
      boardDescription: feed.boardDescription,
      kind: feed.kind,
      itemCount: feed.items.length,
    })),
  };
}
