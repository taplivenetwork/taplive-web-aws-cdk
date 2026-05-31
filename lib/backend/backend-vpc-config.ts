import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/** VPC, subnets, NAT, and security groups for the backend. */
export interface BackendVpcConfig {
  readonly vpc: ec2.Vpc;
  readonly databaseSecurityGroup: ec2.SecurityGroup;
  readonly lambdaSecurityGroup: ec2.SecurityGroup;
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
        name: 'backend-lambda-private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      {
        name: 'backend-db-isolated',
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    ],
  });

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

  return { vpc, databaseSecurityGroup, lambdaSecurityGroup };
}
