import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { targetGroup } from "./load-balancer";
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

// const lambdaPermission = lambda.apply(x => {
//   return new aws.lambda.Permission('permission', {
//     action: 'lambda:InvokeFunction',
//     function: x.name,
//     principal: 'elasticloadbalancing.amazonaws.com'
//   })
// });

// const whatever = awsx.elasticloadbalancingv2.TargetGroupAttachment;

// const test = targetGroup.attachTarget();

const targetGroupAttachmentName = named("target-group-attachment");
const lambdaGroupAttachment = lambda.apply(x => {
  const attachment = targetGroup.attachTarget(targetGroupAttachmentName, x);
  return attachment;
});

// {
//   "Version": "2012-10-17",
//   "Id": "default",
//   "Statement": [
//     {
//       "Sid": "lambda-5e00643d-9ab0-44df-8d90-0f12be404e90",
//       "Effect": "Allow",
//       "Principal": {
//         "Service": "elasticloadbalancing.amazonaws.com"
//       },
//       "Action": "lambda:InvokeFunction",
//       "Resource": "arn:aws:lambda:us-east-1:505708630706:function:lambda-dotnet-lambda-poc",
//       "Condition": {
//         "ArnLike": {
//           "AWS:SourceArn": "arn:aws:elasticloadbalancing:us-east-1:505708630706:targetgroup/lambda-YniUL3Aln1G6c8fssFoc/4fa2128ea3b8e7fc"
//         }
//       }
//     }
//   ]
// }
