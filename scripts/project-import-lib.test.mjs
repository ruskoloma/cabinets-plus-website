import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createOpenRouterUsageSummary,
  loadCatalogOptions,
  normalizeImageAnalysis,
  recordOpenRouterUsage,
  scoreCoverCandidate,
  validateProjectDocument,
} from "./project-import-lib.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogOptions = await loadCatalogOptions(projectRoot);

test("loads metadata values from Tina catalog settings", () => {
  assert.deepEqual(catalogOptions.rooms, ["Kitchen", "Bathroom", "Laundry", "Other"]);
  assert.ok(catalogOptions.doorStyles.includes("slim shaker"));
  assert.deepEqual(catalogOptions.countertopTypes, ["Quartz", "Granite", "Quartzite", "Marble"]);
});

test("normalizes vision metadata only to configured Tina values", () => {
  const result = normalizeImageAnalysis(
    {
      room: "powder room",
      cabinetPaints: ["natural wood", "navy"],
      cabinetStains: ["unknown stain"],
      doorStyles: ["narrow shaker"],
      countertop: "Porcelain",
      flooring: true,
      label: "Floating vanity detail",
      confidence: 0.9,
      visualQuality: { composition: 1.4, sharpness: 0.8, obstructions: -1 },
    },
    catalogOptions,
  );

  assert.equal(result.room, "Bathroom");
  assert.deepEqual(result.cabinetPaints, ["timber", "blue"]);
  assert.deepEqual(result.cabinetStains, []);
  assert.deepEqual(result.doorStyles, ["slim shaker"]);
  assert.equal(result.countertop, "");
  assert.equal(result.flooring, true);
  assert.equal(result.visualQuality.composition, 1);
  assert.equal(result.visualQuality.obstructions, 0);
});

test("cover scoring does not favor one room type", () => {
  const base = {
    cabinetPaints: ["white"],
    cabinetStains: [],
    doorStyles: ["shaker"],
    countertop: "Quartz",
    confidence: { label: 0.9 },
    visualQuality: {
      composition: 0.9,
      sharpness: 0.85,
      lighting: 0.8,
      subjectCoverage: 0.9,
      obstructions: 0.1,
    },
  };

  assert.equal(
    scoreCoverCandidate({ ...base, room: "Kitchen" }),
    scoreCoverCandidate({ ...base, room: "Bathroom" }),
  );
});

test("aggregates exact OpenRouter cost and token usage by job category and model", () => {
  const summary = createOpenRouterUsageSummary();

  recordOpenRouterUsage(summary, {
    category: "project",
    model: "openai/gpt-5.6-terra-pro",
    usage: {
      cost: 0.0125,
      prompt_tokens: 1200,
      completion_tokens: 180,
      total_tokens: 1380,
      completion_tokens_details: { reasoning_tokens: 40 },
    },
  });
  recordOpenRouterUsage(summary, {
    category: "image",
    model: "openai/gpt-5.6-sol-pro",
    usage: {
      cost: 0.031,
      prompt_tokens: 3600,
      completion_tokens: 260,
      total_tokens: 3860,
      completion_tokens_details: { reasoning_tokens: 75 },
    },
  });

  assert.deepEqual(summary.total, {
    calls: 2,
    costUsd: 0.0435,
    promptTokens: 4800,
    completionTokens: 440,
    reasoningTokens: 115,
    totalTokens: 5240,
    costUnavailableCalls: 0,
  });
  assert.equal(summary.categories.project.costUsd, 0.0125);
  assert.equal(summary.categories.image.costUsd, 0.031);
  assert.equal(summary.models["openai/gpt-5.6-sol-pro"].calls, 1);
});

test("validates the complete Tina project contract", () => {
  const project = {
    published: true,
    title: "Residence on Test Lane",
    slug: "residence-on-test-lane",
    description: "A concise project description.",
    primaryPicture: "https://example.com/photo.jpg",
    sourceUpdatedAt: "2026-08-13T12:00:00.000Z",
    media: [
      {
        file: "https://example.com/photo.jpg",
        roomPriority: true,
        flooring: true,
        room: "Bathroom",
        cabinetPaints: ["timber"],
        cabinetStains: [],
        doorStyles: ["slim shaker"],
        countertop: "Quartz",
        label: "Floating timber vanity",
        description: "Residence on Test Lane featuring a floating timber vanity.",
      },
    ],
  };

  assert.equal(validateProjectDocument(project, catalogOptions), project);
  assert.throws(
    () => validateProjectDocument({ ...project, media: [{ ...project.media[0], countertop: "Other" }] }, catalogOptions),
    /unsupported countertopTypes value/,
  );
});
