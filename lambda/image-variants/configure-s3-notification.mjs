import { PutBucketNotificationConfigurationCommand, S3Client } from "@aws-sdk/client-s3";
import { GetBucketNotificationConfigurationCommand } from "@aws-sdk/client-s3";

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const bucket = parseArg("bucket");
const functionArn = parseArg("function-arn");
const id = parseArg("id") || "cabinetsplus-image-variants";
const prefix = parseArg("prefix");

if (!bucket || !functionArn) {
  throw new Error("Usage: node configure-s3-notification.mjs --bucket=<bucket> --function-arn=<arn> [--id=<id>] [--prefix=<prefix>]");
}

const s3 = new S3Client({});
const current = await s3.send(
  new GetBucketNotificationConfigurationCommand({
    Bucket: bucket,
  }),
);

const nextConfig = {
  EventBridgeConfiguration: current.EventBridgeConfiguration,
  QueueConfigurations: current.QueueConfigurations || [],
  TopicConfigurations: current.TopicConfigurations || [],
  LambdaFunctionConfigurations: (current.LambdaFunctionConfigurations || []).filter((entry) => entry.Id !== id),
};

const lambdaConfig = {
  Id: id,
  Events: ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"],
  LambdaFunctionArn: functionArn,
};

if (prefix) {
  lambdaConfig.Filter = {
    Key: {
      FilterRules: [{ Name: "prefix", Value: prefix }],
    },
  };
}

nextConfig.LambdaFunctionConfigurations.push(lambdaConfig);

await s3.send(
  new PutBucketNotificationConfigurationCommand({
    Bucket: bucket,
    NotificationConfiguration: nextConfig,
  }),
);

console.log(
  JSON.stringify(
    {
      bucket,
      configuredId: id,
      lambdaFunctionArn: functionArn,
      prefix: prefix || null,
      totalLambdaConfigurations: nextConfig.LambdaFunctionConfigurations.length,
    },
    null,
    2,
  ),
);
