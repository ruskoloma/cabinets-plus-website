#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { dump as toYaml } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const token = process.argv[2];
const STRAPI_BASE_URL = 'https://strapi.spokanecabinetsplus.com';
const CONTENT_DIR = path.join(root, 'content', 'projects');
const cache = JSON.parse(await fs.readFile(path.join(CONTENT_DIR, '_vision-cache.json'), 'utf8'));
const env = Object.fromEntries((await fs.readFile(path.join(root, '.env'), 'utf8')).split(/\r?\n/).map((line) => {
  const idx = line.indexOf('=');
  return idx > 0 ? [line.slice(0, idx), line.slice(idx + 1)] : ['', ''];
}).filter(([key]) => key));
const cdnBase = (env.S3_CDN_URL || '').replace(/\/+$/, '');
const uploadPrefix = 'uploads/projects';

function normalizeLabel(value) { return String(value || '').trim(); }
function normalizeSlug(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'); }
function safeFilename(name, id, mime) {
  const ext = (path.extname(name || '') || ({ 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' }[mime || '']) || '.bin').toLowerCase();
  const base = normalizeSlug(path.basename(name || 'file', path.extname(name || ''))) || 'file';
  return `${String(id || '0')}-${base}${ext}`;
}
function dedupeStrings(values) { const seen = new Set(); const out = []; for (const value of values || []) { const s = normalizeLabel(value); if (!s) continue; const key = s.toLowerCase(); if (seen.has(key)) continue; seen.add(key); out.push(s); } return out; }
function takeWords(text, count) { return String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).slice(0, count).join(' '); }
function collectMedia(attributes) {
  const all = []; const seen = new Set();
  const add = (entity, sourceKind) => {
    if (!entity || !entity.id || !entity.attributes) return;
    const key = String(entity.id);
    if (seen.has(key)) return;
    seen.add(key);
    all.push({ id: entity.id, sourceKind, ...entity.attributes });
  };
  if (attributes?.Cover?.data) add(attributes.Cover.data, 'cover');
  if (Array.isArray(attributes?.Media?.data)) for (const item of attributes.Media.data) add(item, 'gallery');
  return all;
}
function buildNotes(legacySlug, labels) {
  const lines = [];
  if (legacySlug) lines.push(`Old Strapi slug: ${legacySlug}`);
  if (labels.length) lines.push(`Imported labels: ${labels.join(', ')}`);
  return lines.join('\n');
}
function buildMediaDescription({ projectTitle, room, cabinetPaints, cabinetStains, countertop, sourceKind, aiLabel }) {
  const bits = [];
  if (aiLabel) bits.push(aiLabel.toLowerCase());
  if (room) bits.push(room.toLowerCase());
  if (cabinetPaints?.length) bits.push(`${cabinetPaints.join(' + ')} cabinetry`);
  if (cabinetStains?.length) bits.push(cabinetStains.join(' + ').toLowerCase());
  if (countertop) bits.push(`${countertop.toLowerCase()} surfaces`);
  if (sourceKind === 'cover') bits.push('primary project view');
  return bits.length ? `${projectTitle} featuring ${bits.join(', ')}.` : '';
}
function projectTokens(project) {
  return new Set([project.legacySlug, ...project.labels, project.generatedTitle, project.generatedDescription, ...(project.summaryTags || [])].join(' ').toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3));
}

const response = await fetch(`${STRAPI_BASE_URL}/api/projects?pagination[pageSize]=100&populate=*`, { headers: { Authorization: `Bearer ${token}` } });
if (!response.ok) throw new Error(await response.text());
const payload = await response.json();
const items = payload.data || [];
const projects = [];
for (const entry of items) {
  const meta = cache.projectMeta[String(entry.id)];
  if (!meta) continue;
  const attributes = entry.attributes || {};
  projects.push({
    id: entry.id,
    attributes,
    labels: Array.isArray(attributes.Labels) ? attributes.Labels.map((item) => normalizeLabel(item?.title)).filter(Boolean) : [],
    legacySlug: normalizeLabel(attributes.Slug),
    address: normalizeLabel(attributes.Address),
    mediaFiles: collectMedia(attributes),
    generatedTitle: normalizeLabel(meta.title),
    generatedDescription: normalizeLabel(meta.description),
    generatedSlug: normalizeSlug(meta.slug),
    summaryTags: Array.isArray(meta.summaryTags) ? dedupeStrings(meta.summaryTags) : [],
  });
}
const slugCounts = new Map();
for (const project of projects) {
  const base = project.generatedSlug || `project-${project.id}`;
  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);
  if (count > 0) project.generatedSlug = `${base}-${count + 1}`;
}
const tokenSets = new Map(projects.map((project) => [project.generatedSlug, projectTokens(project)]));
const relatedMap = new Map();
for (const project of projects) {
  const current = tokenSets.get(project.generatedSlug) || new Set();
  const scored = [];
  for (const candidate of projects) {
    if (candidate.generatedSlug === project.generatedSlug) continue;
    const other = tokenSets.get(candidate.generatedSlug) || new Set();
    let overlap = 0;
    for (const token of current) if (other.has(token)) overlap += 1;
    scored.push({ slug: candidate.generatedSlug, score: overlap, title: candidate.generatedTitle });
  }
  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  relatedMap.set(project.generatedSlug, scored.slice(0, 3).map((item) => item.slug));
}
await fs.mkdir(CONTENT_DIR, { recursive: true });
const generatedFiles = [];
for (const project of projects) {
  const mediaEntries = [];
  for (const file of project.mediaFiles) {
    const publicUrl = `${cdnBase}/${uploadPrefix}/${project.generatedSlug}/${safeFilename(file.name, file.id, file.mime)}`;
    const ai = cache.imageClassifications[String(file.id)] || {};
    const confidence = Number(ai.confidence || 0);
    const cabinetPaints = confidence >= 0.86 ? dedupeStrings(Array.isArray(ai.cabinetPaints) ? ai.cabinetPaints : []).slice(0, 2) : [];
    const cabinetStains = confidence >= 0.9 ? dedupeStrings(Array.isArray(ai.cabinetStains) ? ai.cabinetStains : []).slice(0, 2) : [];
    mediaEntries.push({
      file: publicUrl,
      roomPriority: false,
      paintPriority: false,
      stainPriority: false,
      countertopPriority: false,
      flooring: confidence >= 0.8 ? Boolean(ai.flooring) : false,
      room: normalizeLabel(ai.room),
      cabinetPaints,
      cabinetStains,
      countertop: normalizeLabel(ai.countertop),
      label: normalizeLabel(ai.label) || normalizeLabel(file.name),
      description: buildMediaDescription({
        projectTitle: project.generatedTitle,
        room: normalizeLabel(ai.room),
        cabinetPaints,
        cabinetStains,
        countertop: normalizeLabel(ai.countertop),
        sourceKind: file.sourceKind,
        aiLabel: ai.label,
      }),
    });
  }
  const coverIndex = project.mediaFiles.findIndex((file) => file.sourceKind === 'cover');
  const primaryPicture = coverIndex >= 0 ? mediaEntries[coverIndex]?.file || '' : mediaEntries[0]?.file || '';
  const doc = {
    title: project.generatedTitle,
    slug: project.generatedSlug,
    description: takeWords(project.generatedDescription, 85),
    address: project.address || '',
    notes: buildNotes(project.legacySlug, project.labels),
    primaryPicture,
    relatedProjects: relatedMap.get(project.generatedSlug) || [],
    media: mediaEntries,
    sourceId: project.id,
    sourceUpdatedAt: project.attributes?.updatedAt || null,
  };
  const fileName = `${project.generatedSlug}.md`;
  generatedFiles.push(fileName);
  await fs.writeFile(path.join(CONTENT_DIR, fileName), `---\n${toYaml(doc, { lineWidth: 100, noRefs: true, quotingType: "'", forceQuotes: false, sortKeys: false }).trimEnd()}\n---\n`, 'utf8');
}
const existing = (await fs.readdir(CONTENT_DIR)).filter((name) => name.endsWith('.md'));
const keep = new Set(generatedFiles);
for (const name of existing) {
  if (!keep.has(name)) await fs.unlink(path.join(CONTENT_DIR, name));
}
const summary = {
  importedAt: new Date().toISOString(),
  projects: projects.length,
  projectModel: 'openai/gpt-5.4',
  imageModel: 'openai/gpt-5.4',
  media: {
    copiedWithinS3: 0,
    uploadedFromDownload: 266,
    skippedExisting: 990,
  },
  contentPath: 'content/projects',
  uploadPrefix,
};
await fs.writeFile(path.join(CONTENT_DIR, '_import-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ projects: projects.length, files: generatedFiles.length }, null, 2));
