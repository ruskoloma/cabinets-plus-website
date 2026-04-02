# Image Variants Lambda

This Lambda listens to both `s3:ObjectCreated:*` and `s3:ObjectRemoved:*`.

On create, it reads the original raster image and writes 4 WebP variants next to it:

- `thumb` `480px`
- `card` `960px`
- `feature` `1600px`
- `full` `2400px`

The output naming matches the frontend helper used in this repo:

- `foo.jpg` -> `foo.thumb.webp`
- `foo.jpg` -> `foo.card.webp`
- `foo.jpg` -> `foo.feature.webp`
- `foo.jpg` -> `foo.full.webp`

On delete, it removes those derived variants for the deleted source object.

## Deploy

Use an admin-capable AWS CLI profile in account `718287746286`.

```bash
cd /Users/koloma/Projects/cabinets-plus-website/lambda/image-variants
AWS_PROFILE=your-admin-profile ./deploy.sh
```

Optional environment overrides:

```bash
AWS_PROFILE=your-admin-profile \
AWS_REGION=us-west-2 \
BUCKET_NAME=cabinetsplus4630 \
FUNCTION_NAME=cabinetsplus-image-variants \
SOURCE_PREFIX=uploads/ \
./deploy.sh
```

## Notes

- If `SOURCE_PREFIX` is empty, the S3 notification is configured without a prefix filter.
- If `SOURCE_PREFIX=uploads/`, only new objects under `uploads/` invoke the Lambda.
- The function itself skips already-generated files ending in `.thumb.webp`, `.card.webp`, `.feature.webp`, and `.full.webp`.
- Deleting a generated variant directly is ignored, so variant cleanup only runs when the original source asset is deleted.
- `configure-s3-notification.mjs` preserves existing topic/queue/lambda bucket notifications and only upserts this Lambda entry by `Id`.
