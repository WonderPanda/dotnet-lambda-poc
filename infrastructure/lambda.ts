import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { named } from "./utilities";

const lambdaRolePolicyName = named("lambdaRolePolicy");
const lambdaRolePolicy = new aws.iam.RolePolicy(lambdaRolePolicyName, {
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: ["sqs:*", "logs:*", "events:*", "cloudwatch:*", "iam:PassRole"],
        Resource: ["*"],
        Effect: "Allow"
      }
    ]
  },
  role: new aws.iam.Role(named("lambdaRole"), {
    assumeRolePolicy: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: aws.iam.LambdaPrincipal,
          Action: "sts:AssumeRole"
        }
      ]
    }
  })
});

export const lambda = lambdaRolePolicy.role.apply(x => {
  const lambdaRole = aws.iam.Role.get(named("lambda-role"), x);

  const lambdaName = named("lambda");
  const lambda = new aws.lambda.Function(lambdaName, {
    name: lambdaName,
    runtime: aws.lambda.DotnetCore2d1Runtime,
    code: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive(
        "../lambda-source/src/dotnet-lambda/bin/Debug/netcoreapp2.1/publish"
      )
    }),
    timeout: 300,
    handler: "dotnet-lambda::dotnet_lambda.Function::FunctionHandler",
    role: lambdaRole.arn
  });
  return lambda;
});
