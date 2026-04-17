#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dump as toYaml } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const sourceRoot = path.join(projectRoot, "flooring images");
const publicRoot = path.join(projectRoot, "public", "library", "flooring");
const contentRoot = path.join(projectRoot, "content", "flooring");

const SOURCE_URLS = [
  "https://www.primafloors.com/products/pdt_1.html",
  "https://www.primafloors.com/products/pdt_1/id-63.html",
  "https://www.primafloors.com/products/pdt_1/id-61.html",
  "https://www.primafloors.com/products/pdt_1/id-60.html",
  "https://www.primafloors.com/products/pdt_1/id-48.html",
  "https://www.primafloors.com/products/pdt_1/id-47.html",
  "https://www.primafloors.com/products/pdt_1/id-46.html",
  "https://www.primafloors.com/products/pdt_1/id-30.html",
  "https://www.primafloors.com/products/pdt_1/id-29.html",
  "https://www.primafloors.com/products/pdt_1/id-28.html",
  "https://www.mozaiksc.com/shop/category/lyrus-lyrus-stone-composite-37",
  "https://www.mozaiksc.com/shop/waterwise-waterwise-flooring-41/waterwise-premium-94359?attribute_values=63670%2C63550",
  "https://www.mozaiksc.com/shop/waterwise-waterwise-flooring-41/waterwise-select-pad-attached-94805?attribute_values=64057%2C64198",
  "https://www.mozaiksc.com/shop/lyrus-lyrus-stone-composite-37/lyrus-stone-composite-elite-94334?attribute_values=60160%2C63476",
  "https://www.lionsfloor.com/laminate-floorings/lions-floor-comfort-heights-cliff-cottage-li-ch03/",
  "https://www.lionsfloor.com/spc-floorings/lions-floor-indoor-delight-country-breeze-li-id01/",
  "https://flooring2.com/products/6-broadloom-carpet/collection/388-ND?variant=7088-ND-2",
  "https://flooring2.com/products/6-broadloom-carpet/collection/322-ENII?variant=4768-ENII-7",
  "https://flooring2.com/products/6-broadloom-carpet/collection/341-HM?variant=5552-HM-5",
  "https://flooring2.com/products/6-broadloom-carpet/collection/358-AP?variant=6093-AP-4",
  "https://flooring2.com/products/6-broadloom-carpet/collection/321-ATII?variant=4763-ATII-8",
  "https://flooring2.com/products/6-broadloom-carpet/collection/509-BB?variant=7217-BB-6",
  "https://flooring2.com/products/6-broadloom-carpet/collection/334-NT?variant=5272-NT-6",
  "https://flooring2.com/products/6-broadloom-carpet/collection/315-RF?variant=4709-RF-7",
];

const COLLECTION_METADATA = {
  "primafloors|engineered-hardwood": {
    vendor: "Prima Floors",
    collection: "Engineered Hardwood",
    flooringType: "Hardwood",
    sourceUrl: "https://www.primafloors.com/products/pdt_1.html",
    description: ({ color }) =>
      `${color} from Prima Floors' engineered hardwood offering brings authentic wood character, natural grain movement, and warm tonal variation to kitchens, living areas, and whole-home installations. It is a strong fit when you want the upscale look of real wood with a refined, showroom-ready finish.`,
    technicalDetails: [
      ["Brand", "Prima Floors"],
      ["Collection", "Engineered Hardwood"],
      ["Flooring Type", "Hardwood"],
      ["Construction", "Engineered Hardwood"],
      ["Category", "Real wood flooring"],
    ],
  },
  "mozaik|lyrus-stone-composite-elite": {
    vendor: "Mozaik",
    collection: "Lyrus Stone Composite Elite",
    flooringType: "LVP",
    sourceUrl: "https://www.mozaiksc.com/shop/lyrus-lyrus-stone-composite-37/lyrus-stone-composite-elite-94334?attribute_values=60160%2C63476",
    description: ({ color }) =>
      `${color} in Mozaik's Lyrus Stone Composite Elite collection delivers a waterproof resilient floor with contemporary wood-inspired styling and specifier-focused performance. This line is positioned as a durable, design-forward option for spaces that need practical upkeep and dependable day-to-day wear resistance.`,
    technicalDetails: [
      ["Brand", "Mozaik"],
      ["Collection", "Lyrus Stone Composite Elite"],
      ["Flooring Type", "LVP"],
      ["Construction", "Stone Composite"],
      ["Category", "Specifier-focused resilient flooring"],
    ],
  },
  "mozaik|waterwise-premium": {
    vendor: "Mozaik",
    collection: "Waterwise Premium",
    flooringType: "LVP",
    sourceUrl: "https://www.mozaiksc.com/shop/waterwise-waterwise-flooring-41/waterwise-premium-94359?attribute_values=63670%2C63550",
    description: ({ color }) =>
      `${color} in Mozaik's Waterwise Premium collection is a waterproof resilient flooring option built for practical performance and clean, adaptable wood-look styling. It works especially well for projects that need low-maintenance durability while still keeping a polished residential finish.`,
    technicalDetails: [
      ["Brand", "Mozaik"],
      ["Collection", "Waterwise Premium"],
      ["Flooring Type", "LVP"],
      ["Construction", "Waterproof resilient flooring"],
      ["Boxes Per Pallet", "56"],
    ],
  },
  "mozaik|waterwise-select-pad-attached": {
    vendor: "Mozaik",
    collection: "Waterwise Select Pad Attached",
    flooringType: "LVP",
    sourceUrl: "https://www.mozaiksc.com/shop/waterwise-waterwise-flooring-41/waterwise-select-pad-attached-94805?attribute_values=64057%2C64198",
    description: ({ color }) =>
      `${color} in Mozaik's Waterwise Select Pad Attached collection combines waterproof resilient flooring performance with the added convenience of an attached pad. It is a practical choice for projects that want streamlined installation, everyday durability, and a versatile wood-look finish.`,
    technicalDetails: [
      ["Brand", "Mozaik"],
      ["Collection", "Waterwise Select Pad Attached"],
      ["Flooring Type", "LVP"],
      ["Construction", "Waterproof resilient flooring"],
      ["Attached Pad", "Yes"],
    ],
  },
  "lionsfloor|comfort-heights": {
    vendor: "Lions Floor",
    collection: "Comfort Heights",
    flooringType: "Laminate",
    sourceUrl: "https://www.lionsfloor.com/laminate-floorings/lions-floor-comfort-heights-cliff-cottage-li-ch03/",
    description: ({ color }) =>
      `${color} in Lions Floor's Comfort Heights collection pairs a large-format hardwood look with waterproof laminate performance. The line is built with embossed-in-register texture, a matte finish, painted bevel edges, and AC4 scratch resistance for spaces that want a durable surface with an elevated wood-floor visual.`,
    technicalDetails: [
      ["Brand", "Lions Floor"],
      ["Collection", "Comfort Heights"],
      ["Flooring Type", "Laminate"],
      ["Material Type", "Laminate"],
      ["Wear Layer Thickness", "AC4"],
      ["Species of Wood", "Oak"],
      ["Surface Type", "Embossed in Register"],
      ["Edge", "Painted bevel"],
      ["Application", "Residential, Commercial"],
      ["Size", '9 1/4" x 60"'],
      ["Thickness", "12mm"],
      ["Finish Coating", "UV Aluminum Oxide"],
      ["Installation Method", "Uniclic/Floating"],
      ["Warranty", "Residential: 50 Years Limited / Commercial: 10 Years Limited"],
    ],
  },
  "lionsfloor|indoor-delight": {
    vendor: "Lions Floor",
    collection: "Indoor Delight",
    flooringType: "LVP",
    sourceUrl: "https://www.lionsfloor.com/spc-floorings/lions-floor-indoor-delight-country-breeze-li-id01/",
    description: ({ color }) =>
      `${color} in Lions Floor's Indoor Delight collection brings the look of European oak together with modern SPC construction and premium acoustic padding. It is designed for busy residential and light commercial spaces that want waterproof durability, realistic embossed texture, and a quieter underfoot feel.`,
    technicalDetails: [
      ["Brand", "Lions Floor"],
      ["Collection", "Indoor Delight"],
      ["Flooring Type", "LVP"],
      ["Material Type", "SPC"],
      ["Wear Layer Thickness", "20 mil"],
      ["Attached Pad", "Yes"],
      ["Species of Wood", "Oak"],
      ["Surface Type", "Embossed in Register"],
      ["Edge", "Painted Bevel"],
      ["Application", "Residential, Commercial"],
      ["Size", '9" x 72"'],
      ["Thickness", "6.5mm"],
      ["Finish Coating", "UV Acrylic"],
      ["Installation Method", "Floating"],
      ["Warranty", "Residential: 50 Years Limited / Commercial: 10 Years Limited"],
    ],
  },
  "flooring2|nomad": {
    vendor: "Flooring2",
    collection: "Nomad",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/388-ND?variant=7088-ND-2",
    descriptor: "broadloom carpet",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Nomad"],
      ["Flooring Type", "Carpet"],
      ["Type", "12' 0\" Roll"],
    ],
  },
  "flooring2|enduring-ii": {
    vendor: "Flooring2",
    collection: "Enduring II",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/322-ENII?variant=4768-ENII-7",
    descriptor: "broadloom carpet",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Enduring II"],
      ["Flooring Type", "Carpet"],
      ["Type", "12' 0\" Roll"],
    ],
  },
  "flooring2|homage": {
    vendor: "Flooring2",
    collection: "Homage",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/341-HM?variant=5552-HM-5",
    descriptor: "Soft Tonal Texture",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Homage"],
      ["Flooring Type", "Carpet"],
      ["Face Weight", "45 oz/sy"],
      ["Fiber Content", "BCF Solution Dyed Polyester"],
      ["PAR Rating", "4.5"],
      ["Twist", "5.0"],
      ["Type", "12' 0\" Roll"],
      ["Weight", "4.14 lbs per Square Yard"],
      ["Warranty", "10 Year"],
    ],
  },
  "flooring2|alpine": {
    vendor: "Flooring2",
    collection: "Alpine",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/358-AP?variant=6093-AP-4",
    descriptor: "Soft Tonal Texture",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Alpine"],
      ["Flooring Type", "Carpet"],
      ["Face Weight", "40 oz/sy"],
      ["Fiber Content", "BCF Solution Dyed Polyester"],
      ["PAR Rating", "4.5"],
      ["Twist", "4.25"],
      ["Density", "2995"],
      ["Type", "12' 0\" Roll"],
      ["Weight", "4.97 lbs per Square Yard"],
      ["Warranty", "10 Year"],
    ],
  },
  "flooring2|artisan-ii": {
    vendor: "Flooring2",
    collection: "Artisan II",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/321-ATII?variant=4763-ATII-8",
    descriptor: "Graphic Level Loop",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Artisan II"],
      ["Flooring Type", "Carpet"],
      ["Face Weight", "20 oz/sy"],
      ["Fiber Content", "BCF Solution Dyed Polyester"],
      ["PAR Rating", "2.5"],
      ["Density", "5020"],
      ['Pattern Repeat', '0.4" W x 0.5" L'],
      ["Type", "12' 0\" Roll"],
      ["Weight", "3.18 lbs per Square Yard"],
      ["Warranty", "10 Year"],
    ],
  },
  "flooring2|bora-bora": {
    vendor: "Flooring2",
    collection: "Bora Bora",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/509-BB?variant=7217-BB-6",
    descriptor: "Patterned broadloom carpet",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Bora Bora"],
      ["Flooring Type", "Carpet"],
      ["Face Weight", "25 oz/sy"],
      ["Fiber Content", "BCF Solution Dyed Polyester"],
      ["Twist", "6"],
      ['Pattern Repeat', '2"H x 1.4"W'],
      ["Type", "12' 0\" Roll"],
      ["Weight", "3.32 lbs per Square Yard"],
      ["Warranty", "25 Year"],
    ],
  },
  "flooring2|natures-touch": {
    vendor: "Flooring2",
    collection: "Natures Touch",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/334-NT?variant=5272-NT-6",
    descriptor: "Pattern broadloom carpet",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Natures Touch"],
      ["Flooring Type", "Carpet"],
      ["Face Weight", "31 oz/sy"],
      ["Fiber Content", "BCF Continuous Dyed Polyester"],
      ["PAR Rating", "3.0"],
      ["Twist", "5.25"],
      ["Density", "3149"],
      ['Pattern Repeat', '18" W x 19" L'],
      ["Type", "12' 0\" Roll"],
      ["Weight", "3.93 lbs per Square Yard"],
      ["Warranty", "15 Year"],
    ],
  },
  "flooring2|refined": {
    vendor: "Flooring2",
    collection: "Refined",
    flooringType: "Carpet",
    sourceUrl: "https://flooring2.com/products/6-broadloom-carpet/collection/315-RF?variant=4709-RF-7",
    descriptor: "Pattern broadloom carpet",
    technicalDetails: [
      ["Brand", "Flooring2"],
      ["Collection", "Refined"],
      ["Flooring Type", "Carpet"],
      ["Face Weight", "25 oz/yd"],
      ["Fiber Content", "BCF Solution Dyed Polyester"],
      ["PAR Rating", "3.5"],
      ["Twist", "5.2"],
      ["Density", "2813"],
      ['Pattern Repeat', '3" W X 1.75" L'],
      ["Type", "12' 0\" Roll"],
      ["Weight", "3.81 lbs per Square Yard"],
      ["Warranty", "10 Year"],
    ],
  },
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCase(value) {
  return normalizeText(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extToMime(ext) {
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
  };
  return map[ext.toLowerCase()] || "image/jpeg";
}

function withUnits(list) {
  return list.map(([key, value], index) => ({
    key,
    value,
    unit: "",
    order: index + 1,
  }));
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanObject(item))
      .filter((item) => item !== undefined);
  }

  if (!value || typeof value !== "object") {
    return value === undefined ? undefined : value;
  }

  const entries = Object.entries(value)
    .map(([key, entry]) => [key, cleanObject(entry)])
    .filter(([, entry]) => entry !== undefined);

  return Object.fromEntries(entries);
}

async function listImageFiles(root) {
  const results = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!/\.(jpe?g|png|webp|avif)$/i.test(entry.name)) continue;
      results.push(fullPath);
    }
  }

  await walk(root);
  return results.sort((left, right) => left.localeCompare(right));
}

function parsePrimaFloors(relativePath) {
  const vendor = "primafloors";
  const filename = normalizeText(path.basename(relativePath, path.extname(relativePath)));
  const match = filename.match(/^([A-Z0-9]+)\s*:\s*(.+)$/i);
  if (!match) return null;

  const [, code, color] = match;
  return {
    vendorKey: vendor,
    vendor: "Prima Floors",
    collectionKey: "engineered-hardwood",
    code: normalizeText(code),
    color: titleCase(color),
  };
}

function parseMozaik(relativePath) {
  const vendor = "mozaik";
  const filename = normalizeText(path.basename(relativePath, path.extname(relativePath)));
  const match = filename.match(/^\[([^\]]+)\]\s*(.+?)\s*\(\s*(.+?)\s*\)$/);
  if (!match) return null;

  const [, code, collectionRaw, colorRaw] = match;
  const collection = normalizeText(collectionRaw);
  const color = titleCase(colorRaw);
  const collectionKey = slugify(collection);

  return {
    vendorKey: vendor,
    vendor: "Mozaik",
    collectionKey,
    code: normalizeText(code),
    color,
  };
}

function parseLionsFloor(relativePath) {
  const vendor = "lionsfloor";
  const parts = relativePath.split(path.sep).map((part) => normalizeText(part));
  const collectionFolder = parts[1] || "";
  const filename = normalizeText(path.basename(relativePath, path.extname(relativePath)));

  let collectionKey = "";
  if (/comfort heights/i.test(collectionFolder)) collectionKey = "comfort-heights";
  if (/indoor delight/i.test(collectionFolder)) collectionKey = "indoor-delight";
  if (!collectionKey) return null;

  const skuMatch = filename.match(/^(.*?)\s*SKU\s*-\s*([A-Z0-9-]+)$/i);
  if (skuMatch) {
    const [, colorRaw, code] = skuMatch;
    return {
      vendorKey: vendor,
      vendor: "Lions Floor",
      collectionKey,
      code: normalizeText(code),
      color: titleCase(colorRaw),
    };
  }

  const codeOnlyMatch = filename.match(/^([A-Z0-9-]+)$/i);
  if (!codeOnlyMatch) return null;

  return {
    vendorKey: vendor,
    vendor: "Lions Floor",
    collectionKey,
    code: normalizeText(codeOnlyMatch[1]),
    color: titleCase(codeOnlyMatch[1]),
  };
}

function parseFlooring2(relativePath) {
  const vendor = "flooring2";
  const filename = normalizeText(path.basename(relativePath, path.extname(relativePath)));
  const match = filename.match(/^(.*?)\s*-\s*(.*?)\s*#([A-Z0-9-]+)$/i);
  if (!match) return null;

  const [, collectionRaw, colorRaw, code] = match;
  return {
    vendorKey: vendor,
    vendor: "Flooring2",
    collectionKey: slugify(collectionRaw),
    code: normalizeText(code),
    color: titleCase(colorRaw),
  };
}

function parseProduct(relativePath) {
  if (relativePath.startsWith(`primafloors${path.sep}`)) return parsePrimaFloors(relativePath);
  if (relativePath.startsWith(`mozaik${path.sep}`)) return parseMozaik(relativePath);
  if (relativePath.startsWith(`lionsfloor${path.sep}`)) return parseLionsFloor(relativePath);
  if (relativePath.startsWith(`flooring2${path.sep}`)) return parseFlooring2(relativePath);
  return null;
}

function buildDescription({ color, metadata }) {
  if (typeof metadata.description === "function") {
    return metadata.description({ color });
  }

  const descriptor = metadata.descriptor ? `${metadata.descriptor.toLowerCase()} ` : "";
  return `${color} in the ${metadata.collection} collection offers a ${descriptor}that balances approachable style with practical everyday comfort. It is a strong option for projects that want dependable performance, a polished showroom presentation, and a coordinated finish within the broader ${metadata.collection} color line.`;
}

async function main() {
  const sourceFiles = await listImageFiles(sourceRoot);
  await fs.rm(publicRoot, { recursive: true, force: true });
  await fs.rm(contentRoot, { recursive: true, force: true });
  await fs.mkdir(publicRoot, { recursive: true });
  await fs.mkdir(contentRoot, { recursive: true });

  const products = [];
  const candidateMap = new Map();

  for (const filePath of sourceFiles) {
    const relativePath = path.relative(sourceRoot, filePath);
    const parsed = parseProduct(relativePath);
    if (!parsed) continue;

    const metadataKey = `${parsed.vendorKey}|${parsed.collectionKey}`;
    const metadata = COLLECTION_METADATA[metadataKey];
    if (!metadata) continue;

    const dedupeKey = `${parsed.vendorKey}|${parsed.collectionKey}|${parsed.code}`;
    const current = candidateMap.get(dedupeKey);
    const nextCandidate = { filePath, relativePath, parsed, metadata };

    if (!current) {
      candidateMap.set(dedupeKey, nextCandidate);
      continue;
    }

    const currentHasNamedColor = slugify(current.parsed.color) !== slugify(current.parsed.code);
    const nextHasNamedColor = slugify(parsed.color) !== slugify(parsed.code);

    if (!currentHasNamedColor && nextHasNamedColor) {
      candidateMap.set(dedupeKey, nextCandidate);
    }
  }

  for (const { filePath, relativePath, parsed, metadata } of candidateMap.values()) {
    const relativePublicSourcePath = relativePath;

    const ext = path.extname(filePath).toLowerCase();
    const publicFileName = `${slugify(`${parsed.collectionKey}-${parsed.color}-${parsed.code}`)}${ext}`;
    const publicDir = path.join(publicRoot, parsed.vendorKey);
    await fs.mkdir(publicDir, { recursive: true });
    const publicPath = path.join(publicDir, publicFileName);
    await fs.copyFile(filePath, publicPath);

    const publicUrl = `/library/flooring/${parsed.vendorKey}/${publicFileName}`;
    const slug = slugify(`${metadata.collection}-${parsed.color}-${parsed.code}`);
    const name = `${metadata.collection} ${parsed.color}`;

    products.push({
      vendor: metadata.vendor,
      vendorKey: parsed.vendorKey,
      collection: metadata.collection,
      collectionKey: parsed.collectionKey,
      flooringType: metadata.flooringType,
      code: parsed.code,
      color: parsed.color,
      slug,
      description: buildDescription({ color: parsed.color, metadata }),
      technicalDetails: withUnits(metadata.technicalDetails),
      picture: publicUrl,
      media: [
        {
          file: publicUrl,
          kind: "image",
          mimeType: extToMime(ext),
          isPrimary: true,
          label: path.basename(filePath),
          altText: name,
          description: "",
        },
      ],
      relatedProjects: [],
      relatedProducts: [],
      sourceUrl: metadata.sourceUrl,
      filePath: relativePublicSourcePath,
      outputName: name,
    });
  }

  const groupedByCollection = new Map();
  for (const product of products) {
    const key = `${product.vendorKey}|${product.collectionKey}`;
    const current = groupedByCollection.get(key) || [];
    current.push(product);
    groupedByCollection.set(key, current);
  }

  for (const group of groupedByCollection.values()) {
    group.sort((left, right) => left.outputName.localeCompare(right.outputName));
    group.forEach((product, index) => {
      const neighbors = [];
      for (let offset = 1; offset < group.length && neighbors.length < 4; offset += 1) {
        const left = group[index - offset];
        const right = group[index + offset];
        if (left) neighbors.push(left);
        if (right && neighbors.length < 4) neighbors.push(right);
      }

      product.relatedProducts = neighbors.slice(0, 4).map((item) => ({
        product: `content/flooring/${item.slug}.md`,
      }));
    });
  }

  for (const product of products) {
    const frontmatter = cleanObject({
      published: true,
      name: product.outputName,
      code: product.code,
      slug: product.slug,
      flooringType: product.flooringType,
      description: product.description,
      picture: product.picture,
      relatedProjects: product.relatedProjects,
      relatedProducts: product.relatedProducts,
      technicalDetails: product.technicalDetails,
      media: product.media,
    });

    const raw = `---\n${toYaml(frontmatter, { lineWidth: 0, noRefs: true }).trimEnd()}\n---\n`;
    await fs.writeFile(path.join(contentRoot, `${product.slug}.md`), raw, "utf8");
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceImageCount: sourceFiles.length,
    productCount: products.length,
    sourceUrlsReviewed: SOURCE_URLS,
    countsByType: products.reduce((acc, product) => {
      acc[product.flooringType] = (acc[product.flooringType] || 0) + 1;
      return acc;
    }, {}),
    countsByVendor: products.reduce((acc, product) => {
      acc[product.vendor] = (acc[product.vendor] || 0) + 1;
      return acc;
    }, {}),
  };

  await fs.writeFile(path.join(contentRoot, "_import-summary.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log(`Generated ${products.length} flooring products from ${sourceFiles.length} source images.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
