import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class BackendBaseLambdaRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.role = new iam.Role(this, 'BaseLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Shared Lambda execution role with logs + RDS + Secrets Manager access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'RdsConnectivity',
      effect: iam.Effect.ALLOW,
      actions: ['rds-db:connect', 'rds-data:*'],
      resources: ['*'],
    }));

    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'ReadAppSecrets',
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resources: ['*'],
    }));

    this.role.addToPolicy(new iam.PolicyStatement({
      sid: 'ConnectToRdsInstance',
      effect: iam.Effect.ALLOW,
      actions: ['rds-db:connect'],
      resources: [
        `arn:${cdk.Aws.PARTITION}:rds-db:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:dbuser:*/*`,
      ],
    }));
  }
}
