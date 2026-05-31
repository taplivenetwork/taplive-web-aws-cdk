import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/** VPC, subnets, NAT, and security groups for the backend. */
export interface BackendVpcConfig {
  readonly vpc: ec2.Vpc;
  readonly lambdaSubnets: ec2.ISubnet[];
  readonly databaseSecurityGroup: ec2.SecurityGroup;
  readonly lambdaSecurityGroup: ec2.SecurityGroup;
}

/** Secondary VPC CIDR — primary 10.0.0.0/16 is fully allocated by four /18 subnets in prod. */
const LAMBDA_VPC_SECONDARY_CIDR = '10.1.0.0/16';
const LAMBDA_EGRESS_SUBNET_CIDRS = ['10.1.0.0/24', '10.1.1.0/24'] as const;

function findNatGateway(vpc: ec2.Vpc): ec2.CfnNatGateway {
  const natGateways = vpc.node
    .findAll()
    .filter((child): child is ec2.CfnNatGateway => child instanceof ec2.CfnNatGateway);

  if (natGateways.length !== 1) {
    throw new Error(`Expected exactly one NAT gateway in VPC, found ${natGateways.length}`);
  }

  return natGateways[0]!;
}

function createLambdaEgressSubnets(
  scope: Construct,
  vpc: ec2.Vpc,
  natGateway: ec2.CfnNatGateway,
  secondaryCidr: ec2.CfnVPCCidrBlock,
): ec2.ISubnet[] {
  return vpc.availabilityZones.map((az, index) => {
    const subnet = new ec2.PrivateSubnet(scope, `LambdaPrivateSubnet${index + 1}`, {
      vpcId: vpc.vpcId,
      availabilityZone: az,
      cidrBlock: LAMBDA_EGRESS_SUBNET_CIDRS[index]!,
      mapPublicIpOnLaunch: false,
    });

    subnet.node.addDependency(secondaryCidr);
    subnet.addRoute('DefaultRoute', {
      routerType: ec2.RouterType.NAT_GATEWAY,
      routerId: natGateway.attrNatGatewayId,
      enablesInternetConnectivity: true,
    });

    return subnet;
  });
}

/**
 * Creates VPC networking as direct children of `scope` (e.g. `BackendDatabase`)
 * so CloudFormation logical IDs stay stable across refactors
 * (`Database/BackendVpc`, not `Vpc/BackendVpc`).
 */
export function createBackendVpcConfig(scope: Construct): BackendVpcConfig {
  const vpc = new ec2.Vpc(scope, 'BackendVpc', {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      {
        name: 'backend-public',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        name: 'backend-db-isolated',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    ],
  });

  const secondaryCidr = new ec2.CfnVPCCidrBlock(scope, 'BackendVpcSecondaryCidr', {
    vpcId: vpc.vpcId,
    cidrBlock: LAMBDA_VPC_SECONDARY_CIDR,
  });

  const natGateway = findNatGateway(vpc);
  const lambdaSubnets = createLambdaEgressSubnets(scope, vpc, natGateway, secondaryCidr);

  const databaseSecurityGroup = new ec2.SecurityGroup(scope, 'DatabaseSecurityGroup', {
    vpc,
    description: 'Security group for backend PostgreSQL database',
    allowAllOutbound: false,
  });

  const lambdaSecurityGroup = new ec2.SecurityGroup(scope, 'LambdaSecurityGroup', {
    vpc,
    description: 'Security group for backend Lambda functions',
    allowAllOutbound: true,
  });

  databaseSecurityGroup.addIngressRule(
    lambdaSecurityGroup,
    ec2.Port.tcp(5432),
    'Allow Lambda functions to access PostgreSQL',
  );

  return { vpc, lambdaSubnets, databaseSecurityGroup, lambdaSecurityGroup };
}
