import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface BackendDatabaseProps {
  readonly stackName: string;
  readonly vpc: ec2.IVpc;
  readonly databaseSecurityGroup: ec2.ISecurityGroup;
}

export class BackendDatabase extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly databaseCredentialsSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: BackendDatabaseProps) {
    super(scope, id);

    this.database = new rds.DatabaseInstance(this, 'BackendPostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_10,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      multiAz: false,
      publiclyAccessible: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      databaseName: 'taplive',
      credentials: rds.Credentials.fromGeneratedSecret('taplive_admin', {
        secretName: `${props.stackName}/backend/rds-credentials`,
      }),
      // Keep retention minimal to avoid free-tier/account-plan limits.
      backupRetention: cdk.Duration.days(1),
      cloudwatchLogsExports: ['postgresql'],
      monitoringInterval: cdk.Duration.seconds(60),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    this.databaseCredentialsSecret = this.database.secret!;
  }
}
