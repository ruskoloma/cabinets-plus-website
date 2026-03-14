#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(projectRoot, 'content', 'projects');
const CACHE_FILE = path.join(CONTENT_DIR, '_vision-cache.json');
const STRAPI_BASE_URL = 'https://strapi.spokanecabinetsplus.com';
const MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-5.4';
const CONCURRENCY = Number(process.env.FLOORING_VISION_CONCURRENCY || 8);
const SAVE_EVERY = 50;

function parseArg(name) {
  const pref = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(pref));
  return hit ? hit.slice(pref.length) : undefined;
}

async function loadEnvFile(filePath) {
  let raw;
  try { raw = await fs.readFile(filePath, 'utf8'); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = line.slice(idx + 1).trim();
  }
}

function stripCodeFence(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function safeJsonParse(text) {
  try { return JSON.parse(stripCodeFence(text)); } catch { return null; }
}

async function callOpenRouter({ apiKey, model, imageUrl }) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://local.codex.app',
          'X-Title': 'Cabinets Plus Flooring Enrichment',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 120,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Return strict JSON only: {"flooring":true|false,"confidence":0-1}. Set flooring true only if the floor is clearly visible, occupies a significant portion of the image, and is close enough to judge flooring material or style. Otherwise false.',
                },
                { type: 'image_url', image_url: { url: imageUrl } },
              ],
            },
          ],
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`OpenRouter request failed (${response.status}): ${text.slice(0, 800)}`);
      return safeJsonParse(text.includes('choices') ? JSON.parse(text)?.choices?.[0]?.message?.content || '' : text) || {};
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

function collectMedia(attributes) {
  const all = [];
  const seen = new Set();
  const add = (entity) => {
    if (!entity || !entity.id || !entity.attributes) return;
    const key = String(entity.id);
    if (seen.has(key)) return;
    seen.add(key);
    const url = entity.attributes?.url;
    const formats = entity.attributes?.formats || {};
    const mediumUrl = formats?.medium?.url || formats?.small?.url || formats?.thumbnail?.url || url;
    all.push({
      id: entity.id,
      analysisUrl: mediumUrl?.startsWith('http') ? mediumUrl : `${STRAPI_BASE_URL}${mediumUrl}`,
    });
  };
  if (attributes?.Cover?.data) add(attributes.Cover.data);
  if (Array.isArray(attributes?.Media?.data)) for (const item of attributes.Media.data) add(item);
  return all;
}

await loadEnvFile(path.join(projectRoot, '.env'));
const token = parseArg('token') || process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;
const apiKey = parseArg('openrouter-key') || process.env.OPENROUTER_API_KEY;
if (!token) throw new Error('Missing Strapi token');
if (!apiKey) throw new Error('Missing OpenRouter key');

const cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'));
const response = await fetch(`${STRAPI_BASE_URL}/api/projects?pagination[pageSize]=100&populate=*`, { headers: { Authorization: `Bearer ${token}` } });
if (!response.ok) throw new Error(await response.text());
const payload = await response.json();
const queue = [];
for (const item of payload.data || []) {
  for (const file of collectMedia(item.attributes || {})) {
    const current = cache.imageClassifications?.[String(file.id)] || {};
    if (typeof current.flooring === 'boolean') continue;
    queue.push(file);
  }
}

console.log(`Need flooring analysis for ${queue.length} images`);
let cursor = 0;
let processed = 0;
async function worker() {
  while (cursor < queue.length) {
    const index = cursor;
    cursor += 1;
    const file = queue[index];
    let flooring = false;
    let confidence = 0;
    try {
      const parsed = await callOpenRouter({ apiKey, model: MODEL, imageUrl: file.analysisUrl });
      flooring = Boolean(parsed.flooring);
      confidence = Number(parsed.confidence || 0);
    } catch {}
    const current = cache.imageClassifications[String(file.id)] || {};
    cache.imageClassifications[String(file.id)] = {
      ...current,
      flooring: confidence >= 0.75 ? flooring : false,
    };
    processed += 1;
    if (processed % SAVE_EVERY === 0 || processed === queue.length) {
      await fs.writeFile(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
      console.log(`Processed ${processed}/${queue.length}`);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, () => worker()));
await fs.writeFile(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ analyzedImages: queue.length }, null, 2));
