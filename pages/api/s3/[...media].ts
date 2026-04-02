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

const GENERATED_VARIANT_PATTERN = new RegExp(
  `\\.(${Object.values(presets)
    .map((preset) => preset.suffix)
    .join("|")})\\.webp$`,
  "i",
);

const baseHandler = createTinaS3MediaHandler(
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
  {
    ...(cdnUrl ? { cdnUrl } : {}),
    filterItem: (item) => item.type !== "file" || !GENERATED_VARIANT_PATTERN.test(item.filename),
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return baseHandler(req, res);
}
