import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface BackendHealthCheckProps {
  readonly stackName: string;
  readonly role: iam.IRole;
  readonly appSecrets: secretsmanager.ISecret;
}

export class BackendHealthCheck extends Construct {
  public readonly healthFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: BackendHealthCheckProps) {
    super(scope, id);

    this.healthFunction = new lambda.Function(this, 'HealthCheckFunction', {
      functionName: `${props.stackName}-health-check`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: props.role,
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          const body = JSON.stringify({
            status: 'ok',
            service: 'taplive-backend',
            timestamp: new Date().toISOString()
          });

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
              'Access-Control-Allow-Methods': 'GET,OPTIONS',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'Referrer-Policy': 'no-referrer'
            },
            body
          };
        };
      `),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        APP_SECRETS_ARN: props.appSecrets.secretArn,
      },
    });
  }
}
