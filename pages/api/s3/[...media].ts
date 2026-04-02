import { isAuthorized } from "@tinacms/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import presets from "@/lib/image-variant-presets.json";
import { createTinaS3MediaHandler } from "@/lib/tina-s3-media-handler";

export const config = {
  api: {
    bodyParser: false,
  },
};

const cdnUrl = process.env.S3_CDN_URL;

type RuntimeS3Config =
  | {
      ok: true;
      handler: ReturnType<typeof createTinaS3MediaHandler>;
    }
  | {
      ok: false;
      message: string;
    };

let cachedRuntimeConfig: RuntimeS3Config | null = null;

function parseBucketAndRegionFromCdnUrl(url?: string) {
  if (!url) {
    return {};
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    const regionalVirtualHostMatch = host.match(/^(.+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i);

    if (regionalVirtualHostMatch) {
      return {
        bucket: regionalVirtualHostMatch[1],
        region: regionalVirtualHostMatch[2],
      };
    }

    const globalVirtualHostMatch = host.match(/^(.+)\.s3\.amazonaws\.com$/i);

    if (globalVirtualHostMatch) {
      return {
        bucket: globalVirtualHostMatch[1],
      };
    }
  } catch (error) {
    console.warn("Failed to parse S3_CDN_URL for bucket/region fallback", error);
  }

  return {};
}

function getRuntimeConfig(): RuntimeS3Config {
  if (cachedRuntimeConfig) {
    return cachedRuntimeConfig;
  }

  const derived = parseBucketAndRegionFromCdnUrl(cdnUrl);
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
  const region = process.env.S3_REGION || process.env.AWS_REGION || derived.region || "";
  const bucket = process.env.S3_BUCKET || derived.bucket || "";
  const missing: string[] = [];

  if (!bucket) {
    missing.push("S3_BUCKET (or derivable S3_CDN_URL)");
  }

  if (!region) {
    missing.push("S3_REGION (or AWS_REGION / derivable S3_CDN_URL)");
  }

  if (!accessKeyId) {
    missing.push("S3_ACCESS_KEY (or AWS_ACCESS_KEY_ID)");
  }

  if (!secretAccessKey) {
    missing.push("S3_SECRET_KEY (or AWS_SECRET_ACCESS_KEY)");
  }

  if (missing.length > 0) {
    cachedRuntimeConfig = {
      ok: false,
      message: `Missing S3 media configuration: ${missing.join(", ")}`,
    };
    return cachedRuntimeConfig;
  }

  cachedRuntimeConfig = {
    ok: true,
    handler: createTinaS3MediaHandler(
      {
        config: {
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          region,
        },
        bucket,
        // Keep full bucket visible in Media Manager by default (shows legacy uploads/cabinets/* folders too).
        // Generated sharp variants are hidden from the listing so editors only pick source assets.
        mediaRoot: process.env.S3_MEDIA_ROOT || undefined,
        authorized: async (req) => {
          if (process.env.NODE_ENV === "development") {
            return true;
          }

          try {
            const user = await isAuthorized(req);
            return Boolean(user?.verified);
          } catch (error) {
            console.error(error);
            return false;
          }
        },
      },
      {
        ...(cdnUrl ? { cdnUrl } : {}),
        filterItem: (item) => item.type !== "file" || !GENERATED_VARIANT_PATTERN.test(item.filename),
      },
    ),
  };

  return cachedRuntimeConfig;
}

const GENERATED_VARIANT_PATTERN = new RegExp(
  `\\.(${Object.values(presets)
    .map((preset) => preset.suffix)
    .join("|")})\\.webp$`,
  "i",
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const runtimeConfig = getRuntimeConfig();

  if (!runtimeConfig.ok) {
    console.error(runtimeConfig.message);
    res.status(500).json({ e: runtimeConfig.message });
    return;
  }

  return runtimeConfig.handler(req, res);
}
