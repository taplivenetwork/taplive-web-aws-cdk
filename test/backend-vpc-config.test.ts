import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { createBackendVpcConfig } from '../lib/backend/backend-vpc-config';

function makeVpcConfig() {
  const stack = new cdk.Stack(new cdk.App(), 'TestStack');
  // Match production path: TapliveBackendApiFoundation/Database/*
  const database = new Construct(stack, 'Database');
  createBackendVpcConfig(database);
  return Template.fromStack(stack);
}

describe('BackendVpcConfig', () => {
  test('creates a VPC with public and isolated subnets plus dedicated Lambda egress subnets', () => {
    const template = makeVpcConfig();
    template.resourceCountIs('AWS::EC2::VPC', 1);
    // 4 from Vpc (public + db-isolated) + 2 Lambda egress subnets at 10.0.128/160
    template.resourceCountIs('AWS::EC2::Subnet', 6);
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.128.0/19',
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.160.0/19',
    });
  });

  test('creates one NAT gateway for Lambda outbound internet access', () => {
    const template = makeVpcConfig();
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('creates database and Lambda security groups', () => {
    const template = makeVpcConfig();
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for backend PostgreSQL database',
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for backend Lambda functions',
    });
  });

  test('allows Lambda security group ingress to PostgreSQL on port 5432', () => {
    const template = makeVpcConfig();
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 5432,
      ToPort: 5432,
      Description: 'Allow Lambda functions to access PostgreSQL',
    });
  });

  test('routes private subnet internet traffic through the NAT gateway', () => {
    const template = makeVpcConfig();
    template.hasResourceProperties('AWS::EC2::Route', Match.objectLike({
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: Match.anyValue(),
    }));
  });
});
