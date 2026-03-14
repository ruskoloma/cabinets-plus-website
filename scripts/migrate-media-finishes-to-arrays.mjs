#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as fromYaml, dump as toYaml } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const targets = [
  path.join(projectRoot, 'content', 'cabinets'),
  path.join(projectRoot, 'content', 'projects'),
];

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function splitFrontmatter(source) {
  if (!source.startsWith('---\n')) return null;
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) return null;
  return {
    data: source.slice(4, end),
    body: source.slice(end + 5),
  };
}

async function migrateFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts) return { changed: false, items: 0 };

  const doc = fromYaml(parts.data) || {};
  const media = Array.isArray(doc.media) ? doc.media : null;
  if (!media) return { changed: false, items: 0 };

  let changed = false;
  let items = 0;

  doc.media = media.map((item) => {
    if (!item || typeof item !== 'object') return item;
    items += 1;
    const next = { ...item };
    const legacyPaint = typeof next.paint === 'string' ? next.paint : '';
    const legacyStain = typeof next.stain === 'string' ? next.stain : '';
    const existingPaints = Array.isArray(next.cabinetPaints) ? next.cabinetPaints : [];
    const existingStains = Array.isArray(next.cabinetStains) ? next.cabinetStains : [];

    const cabinetPaints = uniqueStrings([...existingPaints, legacyPaint]);
    const cabinetStains = uniqueStrings([...existingStains, legacyStain]);

    if (legacyPaint || !Array.isArray(next.cabinetPaints)) changed = true;
    if (legacyStain || !Array.isArray(next.cabinetStains)) changed = true;
    if ('paint' in next || 'stain' in next) changed = true;

    next.cabinetPaints = cabinetPaints;
    next.cabinetStains = cabinetStains;
    delete next.paint;
    delete next.stain;
    return next;
  });

  if (!changed) return { changed: false, items };

  const yaml = toYaml(doc, {
    lineWidth: 100,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
    sortKeys: false,
  }).trimEnd();

  await fs.writeFile(filePath, `---\n${yaml}\n---${parts.body}`, 'utf8');
  return { changed: true, items };
}

let changedFiles = 0;
let totalFiles = 0;
let totalItems = 0;

for (const dir of targets) {
  let files = [];
  try {
    files = (await fs.readdir(dir))
      .filter((name) => name.endsWith('.md'))
      .map((name) => path.join(dir, name));
  } catch {
    continue;
  }

  for (const file of files) {
    totalFiles += 1;
    const result = await migrateFile(file);
    totalItems += result.items;
    if (result.changed) changedFiles += 1;
  }
}

console.log(JSON.stringify({ totalFiles, changedFiles, totalItems }, null, 2));
