---
name: cabinets-plus-project-import
description: Import a Cabinets Plus project from a ZIP file or image folder into TinaCMS project Markdown. Use when adding new project photography, generating image-recognition metadata and descriptions, uploading optimized S3 image variants, choosing a cover image, validating Pinterest RSS classification, or preparing a scoped project-import pull request in this repository.
---

# Cabinets Plus Project Import

Import one project at a time with `scripts/import-projects-from-zips.mjs`. Treat the supplied ZIP or folder as photography for a normal `content/projects/*.md` entry. Do not infer collection, featured-project, page-ordering, or other special-project edits.

## 1. Preflight

1. Confirm the working tree and current branch. Preserve unrelated user changes and stage explicit paths only.
2. Resolve the exact ZIP or image folder supplied by the user. Never process neighboring ZIPs implicitly.
3. Count supported source images recursively: JPEG, PNG, WebP, HEIC/HEIF, or TIFF. Ignore macOS metadata and non-image files.
4. Read `content/global/catalog-settings.json` before importing. Treat its current `rooms`, `paintOptions`, `stainTypes`, `doorStyles`, and `countertopTypes` values as authoritative.
5. Check whether the intended project slug already exists. Stop on a collision and ask whether the user intends an update; never silently create a `-2` project.
6. Confirm the repository is linked to the intended Vercel project. Never print secret values.

## 2. Inject credentials safely

Use Vercel Development environment variables so the workflow works after cloning on another computer:

```sh
npx vercel env run -e development -- node scripts/import-projects-from-zips.mjs --source="/absolute/path/to/project.zip"
```

The source may also be an image folder. Require `OPENROUTER_API_KEY`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`; allow `S3_CDN_URL`, `OPENROUTER_PROJECT_MODEL`, `OPENROUTER_IMAGE_MODEL`, and `OPENROUTER_MANAGEMENT_API_KEY`. Never pass secrets as command arguments, commit them, copy them into the skill, or expose them in logs. If `.vercel/project.json` is absent, pause for the user to authenticate/link the clone rather than guessing the Vercel project.

Keep `OPENROUTER_MANAGEMENT_API_KEY` optional and administrative-only. The importer must calculate the exact cost of the current job by summing `usage.cost` from its inference responses. When the management key is present, also compare account usage before and after the run and print remaining credits; label the account delta as a cross-check that may include concurrent OpenRouter activity. Print the cost summary on success and after a failed run that may already have incurred charges.

Do not use `--skip-image-meta` for a real import.

## 3. Import contract

Let the importer:

- normalize orientation and create a maximum-2400px JPEG;
- create the static frontend variants defined by `lib/image-variant-presets.json` (`thumb`, `card`, `feature`, `full`);
- analyze every image, not only the project-level sample;
- produce only Tina-configured metadata values;
- set `flooring: false` on every newly imported media item; do not infer this field from the image;
- leave an uncertain `room` empty instead of forcing `Kitchen`;
- recognize `doorStyles` as well as room, paint, stain, and countertop;
- generate a factual label and description for every image;
- choose the cover by composition, sharpness, lighting, subject coverage, obstructions, and metadata confidence without favoring a room type;
- set exactly one `roomPriority: true` and use that image as `primaryPicture`;
- write a stable import timestamp to required `sourceUpdatedAt`;
- omit `cabinetProducts`, `countertopProducts`, `flooringProducts`, and `relatedProjects` unless the user explicitly requests them.

The resumable state lives under `.cache/project-import/` and is gitignored. On a retry, reuse completed uploads and AI results for the same source fingerprint. Do not delete a manifest merely to bypass a collision. OpenRouter or validation failures must stop before producing incomplete Markdown.

## 4. Inspect the result

Open the generated `content/projects/<slug>.md` and verify:

- source image count equals `media` count;
- every item has `file`, `label`, `description`, `roomPriority`, and boolean `flooring`;
- metadata values belong to the current catalog settings;
- every newly imported media item has `flooring: false`;
- the selected cover is visually strong and `primaryPicture` equals its file;
- no filename-like captions, unsupported countertop values, product links, related projects, or special-page edits were introduced.

Do not add Pinterest GUID fields to Tina objects. RSS GUIDs are generated deterministically from feed ID, project slug, and image path.

## 5. Validate and hand off

Run:

```sh
npm run project-import:test
npm run pinterest:validate
npx tinacms build --datalayer-port 9100
```

Confirm the final importer output includes the total OpenRouter cost for the job, the project/image cost breakdown, token counts in the JSON summary, and the Management API account cross-check when configured. Treat the per-response job total as authoritative for this import.

Use port `9100` to avoid interfering with another Tina dev process. Review `git diff --check`, the complete diff, and changed-file scope. For a requested PR, use a dedicated `codex/` branch, stage only the skill/importer files plus the explicitly imported project Markdown, commit, push, create the PR, and verify its file list.

Keep legacy metadata reindexing in a separate PR from importer/skill changes unless the user explicitly combines the scopes. Preserve existing projects' `flooring` values during any metadata reindex; do not recalculate or normalize them unless the user explicitly requests a flooring migration.
