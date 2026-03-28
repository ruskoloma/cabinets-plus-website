#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

AWS_REGION="${AWS_REGION:-us-west-2}"
AWS_PROFILE="${AWS_PROFILE:-}"
AWS_ACCOUNT_ID_EXPECTED="${AWS_ACCOUNT_ID_EXPECTED:-718287746286}"
FUNCTION_NAME="${FUNCTION_NAME:-cabinetsplus-image-variants}"
ROLE_NAME="${ROLE_NAME:-${FUNCTION_NAME}-role}"
POLICY_NAME="${POLICY_NAME:-${FUNCTION_NAME}-policy}"
REPO_NAME="${REPO_NAME:-${FUNCTION_NAME}}"
BUCKET_NAME="${BUCKET_NAME:-cabinetsplus4630}"
SOURCE_PREFIX="${SOURCE_PREFIX:-}"
CACHE_CONTROL="${CACHE_CONTROL:-public, max-age=31536000, immutable}"
MEMORY_SIZE="${MEMORY_SIZE:-1536}"
TIMEOUT="${TIMEOUT:-60}"
STATEMENT_ID="${STATEMENT_ID:-${FUNCTION_NAME}-s3-invoke}"

AWS_ARGS=(--region "$AWS_REGION")
if [[ -n "$AWS_PROFILE" ]]; then
  AWS_ARGS+=(--profile "$AWS_PROFILE")
fi

NOTIFICATION_ARGS=(
  --bucket="${BUCKET_NAME}"
  --function-arn=""
  --id="${FUNCTION_NAME}"
)

ACCOUNT_ID="$(aws "${AWS_ARGS[@]}" sts get-caller-identity --query Account --output text)"
if [[ "$ACCOUNT_ID" != "$AWS_ACCOUNT_ID_EXPECTED" ]]; then
  echo "Expected AWS account ${AWS_ACCOUNT_ID_EXPECTED}, got ${ACCOUNT_ID}. Aborting." >&2
  exit 1
fi

IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:latest"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cat > "${TMP_DIR}/trust-policy.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
JSON

cat > "${TMP_DIR}/permissions-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Logs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3ReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
JSON

echo "Ensuring ECR repository ${REPO_NAME}"
aws "${AWS_ARGS[@]}" ecr describe-repositories --repository-names "${REPO_NAME}" >/dev/null 2>&1 || \
  aws "${AWS_ARGS[@]}" ecr create-repository --repository-name "${REPO_NAME}" >/dev/null

echo "Logging Docker into ECR"
aws "${AWS_ARGS[@]}" ecr get-login-password | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Building Lambda image"
docker buildx build --platform linux/amd64 --provenance=false --load -t "${REPO_NAME}:latest" "${ROOT_DIR}"

echo "Pushing Lambda image"
docker tag "${REPO_NAME}:latest" "${IMAGE_URI}"
docker push "${IMAGE_URI}"

echo "Ensuring IAM role ${ROLE_NAME}"
aws "${AWS_ARGS[@]}" iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1 || \
  aws "${AWS_ARGS[@]}" iam create-role --role-name "${ROLE_NAME}" --assume-role-policy-document "file://${TMP_DIR}/trust-policy.json" >/dev/null

aws "${AWS_ARGS[@]}" iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "${POLICY_NAME}" \
  --policy-document "file://${TMP_DIR}/permissions-policy.json" >/dev/null

ROLE_ARN="$(aws "${AWS_ARGS[@]}" iam get-role --role-name "${ROLE_NAME}" --query 'Role.Arn' --output text)"

# IAM is eventually consistent; give the role and inline policy a moment to propagate
# before Lambda tries to assume the role during create/update.
sleep 10

ENV_JSON="$(cat <<JSON
{"Variables":{"SOURCE_PREFIX":"${SOURCE_PREFIX}","CACHE_CONTROL":"${CACHE_CONTROL}"}}
JSON
)"

if aws "${AWS_ARGS[@]}" lambda get-function --function-name "${FUNCTION_NAME}" >/dev/null 2>&1; then
  echo "Updating Lambda ${FUNCTION_NAME}"
  aws "${AWS_ARGS[@]}" lambda update-function-code \
    --function-name "${FUNCTION_NAME}" \
    --image-uri "${IMAGE_URI}" >/dev/null

  aws "${AWS_ARGS[@]}" lambda wait function-updated \
    --function-name "${FUNCTION_NAME}"

  aws "${AWS_ARGS[@]}" lambda update-function-configuration \
    --function-name "${FUNCTION_NAME}" \
    --role "${ROLE_ARN}" \
    --timeout "${TIMEOUT}" \
    --memory-size "${MEMORY_SIZE}" \
    --environment "${ENV_JSON}" >/dev/null
else
  echo "Creating Lambda ${FUNCTION_NAME}"
  CREATE_ATTEMPT=1
  CREATE_MAX_ATTEMPTS=6

  while true; do
    if aws "${AWS_ARGS[@]}" lambda create-function \
      --function-name "${FUNCTION_NAME}" \
      --package-type Image \
      --code "ImageUri=${IMAGE_URI}" \
      --role "${ROLE_ARN}" \
      --timeout "${TIMEOUT}" \
      --memory-size "${MEMORY_SIZE}" \
      --environment "${ENV_JSON}" >/dev/null; then
      break
    fi

    if (( CREATE_ATTEMPT >= CREATE_MAX_ATTEMPTS )); then
      echo "Failed to create Lambda ${FUNCTION_NAME} after ${CREATE_MAX_ATTEMPTS} attempts" >&2
      exit 1
    fi

    echo "Lambda create attempt ${CREATE_ATTEMPT} failed; waiting for IAM propagation before retrying"
    CREATE_ATTEMPT=$((CREATE_ATTEMPT + 1))
    sleep 10
  done
fi

aws "${AWS_ARGS[@]}" lambda wait function-active-v2 \
  --function-name "${FUNCTION_NAME}"

FUNCTION_ARN="$(aws "${AWS_ARGS[@]}" lambda get-function --function-name "${FUNCTION_NAME}" --query 'Configuration.FunctionArn' --output text)"
NOTIFICATION_ARGS[1]="--function-arn=${FUNCTION_ARN}"

if [[ -n "${SOURCE_PREFIX}" ]]; then
  NOTIFICATION_ARGS+=("--prefix=${SOURCE_PREFIX}")
fi

echo "Ensuring S3 invoke permission"
aws "${AWS_ARGS[@]}" lambda add-permission \
  --function-name "${FUNCTION_NAME}" \
  --statement-id "${STATEMENT_ID}" \
  --action "lambda:InvokeFunction" \
  --principal "s3.amazonaws.com" \
  --source-arn "arn:aws:s3:::${BUCKET_NAME}" >/dev/null 2>&1 || true

echo "Configuring S3 bucket notification"
AWS_REGION="${AWS_REGION}" AWS_PROFILE="${AWS_PROFILE}" \
  node "${ROOT_DIR}/configure-s3-notification.mjs" \
  "${NOTIFICATION_ARGS[@]}"

echo "Done"
echo "Function: ${FUNCTION_NAME}"
echo "Function ARN: ${FUNCTION_ARN}"
echo "Bucket: ${BUCKET_NAME}"
echo "Prefix filter: ${SOURCE_PREFIX:-<none>}"
