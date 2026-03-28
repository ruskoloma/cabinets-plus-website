import { isAuthorized } from "@tinacms/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMediaHandler } from "next-tinacms-s3/dist/handlers";
import presets from "@/lib/image-variant-presets.json";

export const config = {
  api: {
    bodyParser: false,
  },
};

const cdnUrl = process.env.S3_CDN_URL;

const GENERATED_VARIANT_PATTERN = new RegExp(
  `\\.(${Object.values(presets)
    .map((preset) => preset.suffix)
    .join("|")})\\.webp$`,
  "i",
);

const baseHandler = createMediaHandler(
  {
    config: {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
      region: process.env.S3_REGION,
    },
    bucket: process.env.S3_BUCKET || "",
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
  cdnUrl ? { cdnUrl } : undefined
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isMediaListingRequest = req.method === "GET" && !req.query.key;

  if (isMediaListingRequest) {
    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      if (
        body &&
        typeof body === "object" &&
        "items" in body &&
        Array.isArray((body as { items?: unknown[] }).items)
      ) {
        const response = body as { items: Array<{ type?: string; filename?: string }> };

        return originalJson({
          ...response,
          items: response.items.filter((item) => {
            if (item?.type !== "file" || !item.filename) return true;
            return !GENERATED_VARIANT_PATTERN.test(item.filename);
          }),
        });
      }

      return originalJson(body);
    }) as NextApiResponse["json"];
  }

  return baseHandler(req, res);
}
