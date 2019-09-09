import * as awsx from "@pulumi/awsx";
import { named } from "./utilities";

const vpcName = named("vpc");
export const vpc = new awsx.ec2.Vpc(vpcName, {
  numberOfNatGateways: 0,
  tags: {
    Name: named("vpc")
  }
});
