import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  loadCatalogOptions,
  normalizeImageAnalysis,
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
