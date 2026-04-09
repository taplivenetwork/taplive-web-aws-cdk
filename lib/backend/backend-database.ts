import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface BackendDatabaseProps {
  readonly stackName: string;
}

export class BackendDatabase extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly database: rds.DatabaseInstance;
  public readonly databaseCredentialsSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: BackendDatabaseProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'BackendVpc', {
      maxAzs: 2,
      natGateways: 0,
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

    this.securityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for backend PostgreSQL database',
      allowAllOutbound: false,
    });

    this.database = new rds.DatabaseInstance(this, 'BackendPostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_10,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.securityGroup],
      multiAz: false,
      publiclyAccessible: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      databaseName: 'taplive',
      credentials: rds.Credentials.fromGeneratedSecret('taplive_admin', {
        secretName: `${props.stackName}/backend/rds-credentials`,
      }),
      backupRetention: cdk.Duration.days(7),
      cloudwatchLogsExports: ['postgresql'],
      monitoringInterval: cdk.Duration.seconds(60),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    this.databaseCredentialsSecret = this.database.secret!;
  }
}
