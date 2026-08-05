#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  buildFeedManifest,
  buildPinterestFeeds,
} from "./pinterest-rss-lib.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "public", "pinterest");
const checkOnly = process.argv.includes("--check");

async function verifyFile(filePath, expected) {
  let actual = "";

  try {
    actual = await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`Missing generated Pinterest file: ${path.relative(projectRoot, filePath)}`);
  }

  if (actual !== expected) {
    throw new Error(
      `Generated Pinterest file is stale: ${path.relative(projectRoot, filePath)}. Run npm run pinterest:generate.`,
    );
  }
}

async function main() {
  const result = await buildPinterestFeeds({ projectRoot });
  const manifest = `${JSON.stringify(buildFeedManifest(result), null, 2)}\n`;
  const generatedFiles = [
    ...result.feeds.map((feed) => ({ fileName: feed.fileName, content: feed.xml })),
    { fileName: "feeds.json", content: manifest },
  ];

  if (checkOnly) {
    await Promise.all(
      generatedFiles.map(({ fileName, content }) => verifyFile(path.join(outputDir, fileName), content)),
    );
  } else {
    await fs.mkdir(outputDir, { recursive: true });
    await Promise.all(
      generatedFiles.map(({ fileName, content }) => fs.writeFile(path.join(outputDir, fileName), content, "utf8")),
    );
  }

  console.log(
    JSON.stringify(
      {
        mode: checkOnly ? "validated" : "generated",
        outputDirectory: path.relative(projectRoot, outputDir),
        ...result.summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
