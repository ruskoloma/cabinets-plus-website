import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "node:path";

type TinaMediaItem =
  | {
      id: string;
      type: "dir";
      filename: string;
      directory: string;
    }
  | {
      id: string;
      type: "file";
      filename: string;
      directory: string;
      src: string;
      thumbnails: {
        "75x75": string;
        "400x400": string;
        "1000x1000": string;
      };
    };

type CreateMediaHandlerConfig = {
  config: S3ClientConfig;
  bucket: string;
  mediaRoot?: string;
  authorized: (req: NextApiRequest, res: NextApiResponse) => Promise<boolean> | boolean;
};

type CreateMediaHandlerOptions = {
  cdnUrl?: string;
  filterItem?: (item: TinaMediaItem) => boolean;
};

function normalizeMediaRoot(mediaRoot?: string) {
  if (!mediaRoot) {
    return "";
  }

  let normalized = mediaRoot;

  if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }

  if (normalized.startsWith("/")) {
    normalized = normalized.substring(1);
  }

  return normalized;
}

function stripMediaRoot(mediaRoot: string, key: string) {
  if (!mediaRoot) {
    return key;
  }

  const mediaRootParts = mediaRoot.split("/").filter(Boolean);

  if (!mediaRootParts[0]) {
    return key;
  }

  const keyParts = key.split("/").filter(Boolean);

  for (let index = 0; index < mediaRootParts.length; index += 1) {
    if (keyParts[0] === mediaRootParts[index]) {
      keyParts.shift();
    }
  }

  return keyParts.join("/");
}

function findErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if (
      "error" in error &&
      error.error &&
      typeof error.error === "object" &&
      "message" in error.error &&
      typeof error.error.message === "string"
    ) {
      return error.error.message;
    }
  }

  return "an error occurred";
}

function safelyDecodeKeySegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function sanitizeKeyPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .toLowerCase();
}

export function sanitizeS3ObjectKey(key: string) {
  const segments = key
    .split("/")
    .map((segment, index, allSegments) => {
      const decodedSegment = safelyDecodeKeySegment(segment);
      const extension = path.extname(decodedSegment);
      const name = extension ? decodedSegment.slice(0, -extension.length) : decodedSegment;
      const safeName = sanitizeKeyPart(name) || (index === allSegments.length - 1 ? "upload" : "");
      const safeExtension = sanitizeKeyPart(extension.replace(/^\./, ""));

      if (!safeName && !safeExtension) return "";
      return safeExtension ? `${safeName || "upload"}.${safeExtension}` : safeName;
    })
    .filter(Boolean);

  return segments.join("/");
}

async function keyExists(client: S3Client, bucket: string, key: string) {
  try {
    const output = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return output.$metadata.httpStatusCode === 200;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "$metadata" in error &&
      error.$metadata &&
      typeof error.$metadata === "object" &&
      "httpStatusCode" in error.$metadata
    ) {
      const { httpStatusCode } = error.$metadata as { httpStatusCode?: number };

      if (httpStatusCode === 403 || httpStatusCode === 404) {
        return false;
      }
    }

    throw new Error("unexpected error checking if key exists");
  }
}

function getS3ToTinaItem(fileKey: string, cdnUrl: string, mediaRoot: string): TinaMediaItem {
  const strippedKey = stripMediaRoot(mediaRoot, fileKey);
  const filename = path.basename(strippedKey);
  const directory = `${path.dirname(strippedKey)}/`;
  const src = `${cdnUrl}${fileKey}`;

  return {
    id: fileKey,
    filename,
    directory,
    src,
    thumbnails: {
      "75x75": src,
      "400x400": src,
      "1000x1000": src,
    },
    type: "file",
  };
}

async function listMedia(
  req: NextApiRequest,
  res: NextApiResponse,
  client: S3Client,
  bucket: string,
  mediaRoot: string,
  cdnUrl: string,
  filterItem?: (item: TinaMediaItem) => boolean,
) {
  try {
    const { directory = "", limit = 500, offset } = req.query;

    let prefix = String(directory).replace(/^\//, "").replace(/\/$/, "");

    if (prefix) {
      prefix = `${prefix}/`;
    }

    const response = await client.send(
      new ListObjectsCommand({
        Bucket: bucket,
        Delimiter: "/",
        Prefix: mediaRoot ? path.join(mediaRoot, prefix) : prefix,
        Marker: offset?.toString(),
        MaxKeys: directory && !offset ? Number(limit) + 1 : Number(limit),
      }),
    );

    const items: TinaMediaItem[] = [];

    response.CommonPrefixes?.forEach(({ Prefix }) => {
      if (!Prefix) {
        return;
      }

      const strippedPrefix = stripMediaRoot(mediaRoot, Prefix);

      if (!strippedPrefix) {
        return;
      }

      items.push({
        id: Prefix,
        type: "dir",
        filename: path.basename(strippedPrefix),
        directory: path.dirname(strippedPrefix),
      });
    });

    (response.Contents || []).forEach((file) => {
      if (!file.Key) {
        return;
      }

      const strippedKey = stripMediaRoot(mediaRoot, file.Key);

      if (strippedKey === prefix) {
        return;
      }

      items.push(getS3ToTinaItem(file.Key, cdnUrl, mediaRoot));
    });

    res.json({
      items: filterItem ? items.filter(filterItem) : items,
      offset: response.NextMarker,
    });
  } catch (error) {
    console.error("Error listing media");
    console.error(error);
    res.status(500).json({ e: findErrorMessage(error) });
  }
}

async function deleteAsset(
  req: NextApiRequest,
  res: NextApiResponse,
  client: S3Client,
  bucket: string,
) {
  const { media } = req.query;
  const mediaParts = Array.isArray(media) ? media : [media];
  const [, objectKey] = mediaParts;

  if (!objectKey) {
    res.status(400).json({ message: "missing object key" });
    return;
  }

  try {
    const data = await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      }),
    );

    res.json(data);
  } catch (error) {
    console.error("Error deleting media");
    console.error(error);
    res.status(500).json({ e: findErrorMessage(error) });
  }
}

async function getUploadUrl(client: S3Client, bucket: string, key: string, expiresIn: number) {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn },
  );
}

export function createTinaS3MediaHandler(
  config: CreateMediaHandlerConfig,
  options?: CreateMediaHandlerOptions,
) {
  const client = new S3Client(config.config);
  const bucket = config.bucket;
  const region = config.config.region || "us-east-1";
  const mediaRoot = normalizeMediaRoot(config.mediaRoot);
  const endpoint = config.config.endpoint || `https://s3.${region}.amazonaws.com`;
  let cdnUrl =
    options?.cdnUrl ||
    endpoint.toString().replace(/http(s|):\/\//i, `https://${bucket}.`);

  cdnUrl = `${cdnUrl}${cdnUrl.endsWith("/") ? "" : "/"}`;

  return async function tinaS3MediaHandler(req: NextApiRequest, res: NextApiResponse) {
    const isAuthorized = await config.authorized(req, res);

    if (!isAuthorized) {
      res.status(401).json({ message: "sorry this user is unauthorized" });
      return;
    }

    switch (req.method) {
      case "GET": {
        if (req.query.key) {
          const expiresIn = req.query.expiresIn ? Number(req.query.expiresIn) : 3600;
          const rawKey = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
          const key = typeof rawKey === "string" ? sanitizeS3ObjectKey(rawKey) : "";

          if (!key) {
            res.status(400).json({ message: "key is required" });
            return;
          }

          if (await keyExists(client, bucket, key)) {
            res.status(400).json({ message: "key already exists" });
            return;
          }

          const signedUrl = await getUploadUrl(client, bucket, key, expiresIn);
          res.json({ signedUrl, src: `${cdnUrl}${key}` });
          return;
        }

        await listMedia(req, res, client, bucket, mediaRoot, cdnUrl, options?.filterItem);
        return;
      }
      case "DELETE":
        await deleteAsset(req, res, client, bucket);
        return;
      default:
        res.status(404).end();
    }
  };
}
