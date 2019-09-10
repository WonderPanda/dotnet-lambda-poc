import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { named } from "./utilities";
import { vpc } from "./vpc";

const sgName = named("alb-sg");
const albSg = new aws.ec2.SecurityGroup(sgName, {
  vpcId: vpc.id,
  egress: [
    {
      fromPort: 0,
      toPort: 0,
      protocol: "-1", // all
      cidrBlocks: ["0.0.0.0/0"]
    }
  ]
});

const loadBalancerName = named("ALB");
export const loadBalancer = new awsx.elasticloadbalancingv2.ApplicationLoadBalancer(
  loadBalancerName,
  {
    vpc,
    name: loadBalancerName,
    subnets: vpc.publicSubnetIds,
    securityGroups: [albSg.id],
    idleTimeout: 120,
    external: true
  }
);

const targetGroupName = named("target-group");
export const targetGroup = loadBalancer.createTargetGroup(targetGroupName, {
  name: targetGroupName,
  port: 80,
  protocol: "HTTP",
  targetType: "lambda"
});

// const targetGroupAttachment = new aws.elasticloadbalancingv2.TargetGroupAttachment(targetGroupAttachmentName, {
//   targetGroupArn: targetGroup.targetGroup.arn
// });

const listenerName = named("ALB-listener");
const listener = targetGroup.createListener(listenerName, {
  name: listenerName,
  external: true,
  port: 80,
  protocol: "HTTP"
});
