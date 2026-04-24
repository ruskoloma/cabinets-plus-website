#!/usr/bin/env node
/**
 * Uploads 6 missing countertop products to S3 and creates TinaCMS content files.
 * Requires in .env: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
 * Optional: S3_CDN_URL
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { dump as toYaml } from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(projectRoot, "content", "countertops");
const SLABS_DIR = path.join(process.env.HOME, "Downloads", "slabs");
const UPLOAD_PREFIX = "uploads/countertops";
const FOOTER =
  "This sample allows you to inspect the authentic craftsmanship, durability, and finish before making your final selection.";

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(projectRoot, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      process.env[key] = value;
    }
  } catch {}
}

function buildUrl(cdnBase, bucket, region, key) {
  if (cdnBase) return `${cdnBase.replace(/\/+$/, "")}/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function objectExists(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(s3, bucket, key, filePath) {
  const exists = await objectExists(s3, bucket, key);
  if (exists) {
    console.log(`  skipped (already exists): ${key}`);
    return;
  }
  const body = await fs.readFile(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  console.log(`  uploaded: ${key}`);
}

const PRODUCTS = [
  {
    name: "Calacatta Gold",
    code: "CalacattaGold",
    slug: "calacattagold",
    countertopType: "Quartz",
    description:
      "Calacatta Gold quartz presents a crisp white background swept with broad, flowing soft-gray veins that move diagonally across the surface. Delicate gold and warm amber hairline accents trace through the veining, adding warmth and a refined metallic character. The movement is bold yet elegant, with generous soft-edged bands creating strong visual presence balanced by the luminous white field. Overall, the design character feels warm, dramatic, and luxuriously classic.\n\n" +
      FOOTER,
    images: [
      { file: "Calacatta Gold .jpg", key: "calacatta-gold.jpg", isPrimary: true, label: "Calacatta Gold.jpg" },
      { file: "Calacatta Gold Full slab .jpg", key: "calacatta-gold-full-slab.jpg", isPrimary: false, label: "Calacatta Gold full slab.jpg" },
    ],
    relatedProducts: [
      "content/countertops/calacattaibizagold.md",
      "content/countertops/calacattaelitegold.md",
      "content/countertops/calacattasimplegold.md",
      "content/countertops/goldalpine.md",
    ],
  },
  {
    name: "Calacatta Sand",
    code: "CalacattaSand",
    slug: "calacattasand",
    countertopType: "Quartz",
    description:
      "Calacatta Sand quartz offers an ultra-clean, near-white surface with the faintest warm greige undertone throughout. Veining is extremely subtle — fine, barely-visible warm sandy traces drift sparsely across the face, lending the gentlest sense of natural movement without disrupting the overall purity of the slab. The result is a surface that reads almost as a solid white yet carries quiet, organic depth. Design character is minimalist, serene, and effortlessly refined.\n\n" +
      FOOTER,
    images: [
      { file: "Calacatta Sand .jpg", key: "calacatta-sand.jpg", isPrimary: true, label: "Calacatta Sand.jpg" },
      { file: "Calacatta Sand Full slab.jpg", key: "calacatta-sand-full-slab.jpg", isPrimary: false, label: "Calacatta Sand full slab.jpg" },
    ],
    relatedProducts: [
      "content/countertops/simplewhite.md",
      "content/countertops/simplepurewhite.md",
      "content/countertops/finewhite.md",
      "content/countertops/calacattasilver.md",
    ],
  },
  {
    name: "Calacatta Royal",
    code: "CalacattaRoyal",
    slug: "calacattaroyal",
    countertopType: "Quartz",
    description:
      "Calacatta Royal quartz features a white to very light gray background dominated by large, bold, soft-edged undulating bands that flow across the full slab in an abstract, cloud-like pattern. Unlike fine-veined marbles, the movement here is broad and expansive — wide painterly forms sweep in rhythmic waves creating strong graphic presence at low color contrast. There are no metallic accents; the drama comes entirely from scale and form. Design character is modern, distinctive, and architecturally bold.\n\n" +
      FOOTER,
    images: [
      { file: "Calacatta Royal .jpg", key: "calacatta-royal.jpg", isPrimary: true, label: "Calacatta Royal.jpg" },
      { file: "Calacatta Royal Full slab .jpg", key: "calacatta-royal-full-slab.jpg", isPrimary: false, label: "Calacatta Royal full slab.jpg" },
    ],
    relatedProducts: [
      "content/countertops/calacattaplatinum.md",
      "content/countertops/calacattaemerald.md",
      "content/countertops/calacattaperfection.md",
      "content/countertops/calacattabellagio.md",
    ],
  },
  {
    name: "Calacatta Great",
    code: "CalacattaGreat",
    slug: "calacattagreat",
    countertopType: "Quartz",
    description:
      "Calacatta Great quartz presents a white to soft light-gray background layered with rich, flowing gray veins of varying thickness. Broader soft-gray bands sweep diagonally while fine dark detail lines trace alongside them, creating a multi-depth effect with genuine visual complexity. The movement is fluid and dynamic, covering the surface generously without crowding it. Design character is dramatic, marble-inspired, and classically elegant with strong decorative presence.\n\n" +
      FOOTER,
    images: [
      { file: "Calacatta Great.jpg", key: "calacatta-great.jpg", isPrimary: true, label: "Calacatta Great.jpg" },
      { file: "Calacatta Great Full slab .jpg", key: "calacatta-great-full-slab.jpg", isPrimary: false, label: "Calacatta Great full slab.jpg" },
    ],
    relatedProducts: [
      "content/countertops/calacattabellagio.md",
      "content/countertops/calacattabrezze.md",
      "content/countertops/calacattadays.md",
      "content/countertops/calacattahighlight.md",
    ],
  },
  {
    name: "Black Pearl Granite",
    code: "BlackPearlGranite",
    slug: "blackpearlgranite",
    countertopType: "Granite",
    description:
      "Black Pearl Granite presents a deep, near-black surface with fine iridescent silver and charcoal mineral crystals distributed evenly throughout the slab. In polished form, the surface achieves a high-gloss mirror finish that amplifies the subtle sparkle of the mineral flecks, producing a sense of quiet luxury and depth. The leathered finish softens the reflection into a matte, tactile surface that reads as pure, uniform black with a refined texture. Faint darker banding adds understated movement. Design character is bold, dramatic, and timelessly luxurious.\n\n" +
      FOOTER,
    images: [
      { file: "Black Pearl Granite - polished.jpg", key: "black-pearl-granite-polished.jpg", isPrimary: true, label: "Black Pearl Granite - polished.jpg" },
      { file: "Black Pearl Granite - leathered.jpg", key: "black-pearl-granite-leathered.jpg", isPrimary: false, label: "Black Pearl Granite - leathered.jpg" },
      { file: "Black Pearl Granite - full slab.jpg", key: "black-pearl-granite-full-slab.jpg", isPrimary: false, label: "Black Pearl Granite - full slab.jpg" },
    ],
    relatedProducts: [
      "content/countertops/cararrablackmistsuede.md",
      "content/countertops/simpleblacklaza.md",
      "content/countertops/simpledarkgray.md",
      "content/countertops/coastalbrown.md",
    ],
  },
  {
    name: "Taj Mahal Real",
    code: "TajMahalReal",
    slug: "tajmahalreal",
    countertopType: "Quartzite",
    description:
      "Taj Mahal Real is a natural quartzite with a warm ivory to cream background suffused with soft amber, golden-honey, and pale taupe cloud-like patches that drift organically across the surface. Gentle flowing movement carries delicate golden veining through the field, while the natural quartzite structure lends subtle translucency and tonal depth that engineered surfaces cannot replicate. The character is rich yet soft, warm without being heavy, and unmistakably natural. Design character is luxurious, organic, and warmly timeless.\n\n" +
      FOOTER,
    images: [
      { file: "Taj Mahal Real.jpg", key: "taj-mahal-real.jpg", isPrimary: true, label: "Taj Mahal Real.jpg" },
      { file: "Taj Mahal Real Full slab.jpg", key: "taj-mahal-real-full-slab.jpg", isPrimary: false, label: "Taj Mahal Real full slab.jpg" },
    ],
    relatedProducts: [
      "content/countertops/tajlight.md",
      "content/countertops/tajperfection.md",
      "content/countertops/goldalpine.md",
      "content/countertops/calacattaibizagold.md",
    ],
  },
];

async function main() {
  await loadEnv();

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const cdnBase = process.env.S3_CDN_URL || "";

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing S3 config in .env: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY");
  }

  const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

  for (const product of PRODUCTS) {
    console.log(`\nProcessing: ${product.name}`);

    const mediaEntries = [];
    let pictureUrl = "";

    for (const img of product.images) {
      const srcPath = path.join(SLABS_DIR, img.file);
      const s3Key = `${UPLOAD_PREFIX}/${product.slug}/${img.key}`;
      const url = buildUrl(cdnBase, bucket, region, s3Key);

      await uploadFile(s3, bucket, s3Key, srcPath);

      if (img.isPrimary) pictureUrl = url;

      mediaEntries.push({
        file: url,
        kind: "image",
        mimeType: "image/jpeg",
        isPrimary: img.isPrimary,
        label: img.label,
        altText: product.name,
        description: "",
      });
    }

    const frontmatter = {
      published: true,
      name: product.name,
      code: product.code,
      slug: product.slug,
      countertopType: product.countertopType,
      description: product.description,
      picture: pictureUrl,
      relatedProducts: product.relatedProducts.map((p) => ({ product: p })),
      technicalDetails: [
        { key: "Type", value: product.countertopType, unit: "", order: 2 },
        { key: "Thickness", value: "3CM", unit: "", order: 3 },
        { key: "Store Collection", value: "in-stock", unit: "", order: 6 },
      ],
      media: mediaEntries,
    };

    const markdown =
      "---\n" +
      toYaml(frontmatter, { noRefs: true, lineWidth: 120, quotingType: '"', forceQuotes: false, sortKeys: false }) +
      "---\n";

    const outPath = path.join(CONTENT_DIR, `${product.slug}.md`);
    await fs.writeFile(outPath, markdown, "utf8");
    console.log(`  created: content/countertops/${product.slug}.md`);
  }

  console.log("\nDone. All 6 countertop products uploaded and created.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
