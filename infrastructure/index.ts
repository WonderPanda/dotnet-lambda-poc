import { lambda } from "./lambda";
import { loadBalancer } from "./load-balancer";

const resources = {
  lambda
};

export const ALB_ENDPOINT = loadBalancer.loadBalancer.dnsName;
