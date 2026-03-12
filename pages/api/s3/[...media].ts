import { isAuthorized } from "@tinacms/auth";
import { createMediaHandler } from "next-tinacms-s3/dist/handlers";

export const config = {
  api: {
    bodyParser: false,
  },
};

const cdnUrl = process.env.S3_CDN_URL;

export default createMediaHandler(
  {
    config: {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
      region: process.env.S3_REGION,
    },
    bucket: process.env.S3_BUCKET || "",
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
