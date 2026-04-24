#!/usr/bin/env node
/**
 * Rebuild the `relatedProjects` array on every product document (cabinets /
 * countertops / flooring) from the inverse-lookup through project documents.
 *
 * Source of truth: `content/projects/*.md` — each project lists its
 * cabinetProducts / countertopProducts / flooringProducts (linked via the
 * reference subfield, not via customName). For every such linked reference,
 * we write the project back into that product's `relatedProjects`.
 *
 * Surgical edit: we locate the existing `relatedProjects:` block by its YAML
 * indentation and replace just that block, preserving the rest of the file
 * exactly. If the field is missing we insert it immediately before
 * `relatedProducts:` (products that lack both are extremely rare; we fall
 * back to appending to the end of the frontmatter).
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = new URL("../", import.meta.url).pathname;
const PROJECTS_DIR = path.join(ROOT, "content", "projects");
const KINDS = /** @type {const} */ ([
  { dir: "cabinets", projectField: "cabinetProducts", refKey: "cabinet" },
  { dir: "countertops", projectField: "countertopProducts", refKey: "countertop" },
  { dir: "flooring", projectField: "flooringProducts", refKey: "flooring" },
]);

function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  return { frontmatter: m[1], body: text.slice(m[0].length), raw: text };
}

function parseFrontmatter(text) {
  try {
    return yaml.load(text) || {};
  } catch (err) {
    throw new Error("yaml parse failed: " + err.message);
  }
}

/** @param {unknown} ref */
function normalizeRef(ref) {
  if (typeof ref !== "string") return null;
  const s = ref.trim();
  if (!s) return null;
  return s;
}

function buildInverseIndex() {
  const map = new Map(); // productPath -> Set<projectPath>
  const projectFiles = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of projectFiles) {
    const projectPath = "content/projects/" + file;
    const text = fs.readFileSync(path.join(PROJECTS_DIR, file), "utf8");
    const fm = splitFrontmatter(text);
    if (!fm) continue;
    const data = parseFrontmatter(fm.frontmatter);

    for (const { projectField, refKey } of KINDS) {
      const list = data[projectField];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const ref = normalizeRef(item[refKey]);
        if (!ref) continue;
        // Ignore references pointing outside expected collection paths
        if (!ref.startsWith("content/")) continue;
        if (!map.has(ref)) map.set(ref, new Set());
        map.get(ref).add(projectPath);
      }
    }
  }
  return map;
}

/**
 * Replace (or insert) the top-level `relatedProjects:` block in the given
 * frontmatter text with a new block listing `projectPaths` (or empty).
 */
function writeRelatedProjects(frontmatter, projectPaths) {
  const sortedPaths = [...projectPaths].sort();
  const newBlock = sortedPaths.length
    ? "relatedProjects:\n" + sortedPaths.map((p) => `  - project: ${p}`).join("\n")
    : "relatedProjects: []";

  // Match the existing top-level `relatedProjects:` block. It is either
  //   `relatedProjects: []`
  // or
  //   `relatedProjects:
  //     - project: ...
  //     - project: ...
  // (terminating when the next top-level key appears — i.e. a line that starts
  // with a non-whitespace character or end-of-text).
  const re = /^relatedProjects:[^\n]*(?:\n[ \t]+[^\n]*)*/m;
  if (re.test(frontmatter)) {
    return frontmatter.replace(re, newBlock);
  }

  // Field missing. Insert before `relatedProducts:` if present, else append.
  const idx = frontmatter.search(/^relatedProducts:/m);
  if (idx !== -1) {
    return frontmatter.slice(0, idx) + newBlock + "\n" + frontmatter.slice(idx);
  }
  return frontmatter.replace(/\n?$/, "\n" + newBlock + "\n");
}

function run() {
  const inverse = buildInverseIndex();
  const counts = { cabinets: 0, countertops: 0, flooring: 0 };
  let totalLinks = 0;

  for (const { dir } of KINDS) {
    const absDir = path.join(ROOT, "content", dir);
    const files = fs.readdirSync(absDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const productPath = `content/${dir}/${file}`;
      const abs = path.join(absDir, file);
      const text = fs.readFileSync(abs, "utf8");
      const fm = splitFrontmatter(text);
      if (!fm) continue;

      const projectPaths = inverse.get(productPath) || new Set();
      const newFrontmatter = writeRelatedProjects(fm.frontmatter, projectPaths);
      if (newFrontmatter === fm.frontmatter) continue;
      const next = `---\n${newFrontmatter}\n---\n${fm.body.replace(/^\n/, "")}`;
      fs.writeFileSync(abs, next, "utf8");
      counts[dir] += 1;
      totalLinks += projectPaths.size;
    }
  }

  console.log(
    `Rewrote: cabinets=${counts.cabinets}, countertops=${counts.countertops}, flooring=${counts.flooring}; total project links written=${totalLinks}`,
  );

  // Summary: products that now have projects
  const withProjects = { cabinets: 0, countertops: 0, flooring: 0 };
  for (const { dir } of KINDS) {
    const absDir = path.join(ROOT, "content", dir);
    for (const file of fs.readdirSync(absDir).filter((f) => f.endsWith(".md"))) {
      const productPath = `content/${dir}/${file}`;
      if (inverse.has(productPath)) withProjects[dir]++;
    }
  }
  console.log("Products with at least one linked project:", withProjects);
}

run();
