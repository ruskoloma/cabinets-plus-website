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

function splitFrontmatter(source) {
  if (!source.startsWith('---\n')) return null;
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) return null;
  return { data: source.slice(4, end), body: source.slice(end + 5) };
}

async function migrateFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts) return false;
  const doc = fromYaml(parts.data) || {};
  if (!Array.isArray(doc.media)) return false;

  let changed = false;
  doc.media = doc.media.map((item) => {
    if (!item || typeof item !== 'object') return item;
    if (typeof item.flooring !== 'boolean') {
      changed = true;
      return { ...item, flooring: false };
    }
    return item;
  });

  if (!changed) return false;

  const yaml = toYaml(doc, {
    lineWidth: 100,
    noRefs: true,
    quotingType: "'",
    forceQuotes: false,
    sortKeys: false,
  }).trimEnd();
  await fs.writeFile(filePath, `---\n${yaml}\n---${parts.body}`, 'utf8');
  return true;
}

let changedFiles = 0;
for (const dir of targets) {
  let files = [];
  try {
    files = (await fs.readdir(dir)).filter((name) => name.endsWith('.md')).map((name) => path.join(dir, name));
  } catch {
    continue;
  }
  for (const file of files) {
    if (await migrateFile(file)) changedFiles += 1;
  }
}
console.log(JSON.stringify({ changedFiles }, null, 2));
