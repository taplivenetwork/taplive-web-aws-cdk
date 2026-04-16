import * as cdk from 'aws-cdk-lib/core';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { BackendApiFoundationProps } from '../props/backend-api-foundation-props';
import { BackendBaseLambdaRole } from './backend/backend-base-lambda-role';
import { BackendDatabase } from './backend/backend-database';
import { BackendHealthCheck } from './backend/backend-health-check';
import { BackendRestApi } from './backend/backend-rest-api';
import { BackendSecrets } from './backend/backend-secrets';
import { CognitoPostConfirmation } from './backend/cognito-post-confirmation';

export { BackendApiFoundationProps };

/**
 * Shared backend foundation for API Gateway + reusable Lambda infrastructure.
 */
export class BackendApiFoundation extends Construct {
  public readonly restApi: apigateway.RestApi;
  public readonly baseLambdaRole: iam.Role;
  public readonly appSecrets: secretsmanager.Secret;
  public readonly healthFunction: lambda.Function;
  public readonly postConfirmationFunction: lambda.Function;
  public readonly database: rds.DatabaseInstance;
  public readonly databaseCredentialsSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: BackendApiFoundationProps = {}) {
    super(scope, id);

    const stackName = cdk.Stack.of(this).stackName;
    const corsAllowedOrigins = props.corsAllowedOrigins ?? ['*'];

    const iamRole = new BackendBaseLambdaRole(this, 'Iam');
    this.baseLambdaRole = iamRole.role;

    const secrets = new BackendSecrets(this, 'Secrets', { stackName });
    this.appSecrets = secrets.appSecrets;

    const database = new BackendDatabase(this, 'Database', { stackName });
    this.database = database.database;
    this.databaseCredentialsSecret = database.databaseCredentialsSecret;

    const health = new BackendHealthCheck(this, 'HealthCheck', {
      stackName,
      role: this.baseLambdaRole,
      appSecrets: this.appSecrets,
    });
    this.healthFunction = health.healthFunction;

    const postConfirmation = new CognitoPostConfirmation(this, 'CognitoPostConfirmation', {
      // database: this.database,
      databaseCredentialsSecret: this.databaseCredentialsSecret,
      vpc: database.vpc,
      securityGroup: database.securityGroup,
      stackName,
    });
    this.postConfirmationFunction = postConfirmation.function;

    const restApi = new BackendRestApi(this, 'Api', {
      apiName: props.apiName ?? 'TapliveBackendApi',
      corsAllowedOrigins,
      healthFunction: this.healthFunction,
    });
    this.restApi = restApi.restApi;

    new cdk.CfnOutput(this, 'BackendApiUrl', {
      description: 'Base invoke URL for backend API stage',
      value: this.restApi.url,
      exportName: `${stackName}-BackendApiUrl`,
    });

    new cdk.CfnOutput(this, 'BackendHealthCheckUrl', {
      description: 'Health check endpoint URL',
      value: `${this.restApi.url}health`,
      exportName: `${stackName}-BackendHealthCheckUrl`,
    });

    new cdk.CfnOutput(this, 'BaseLambdaRoleArn', {
      description: 'Base Lambda execution role ARN for backend functions',
      value: this.baseLambdaRole.roleArn,
      exportName: `${stackName}-BaseLambdaRoleArn`,
    });

    new cdk.CfnOutput(this, 'BackendSecretsArn', {
      description: 'Secrets Manager ARN for backend credentials storage',
      value: this.appSecrets.secretArn,
      exportName: `${stackName}-BackendSecretsArn`,
    });

    new cdk.CfnOutput(this, 'BackendRdsEndpoint', {
      description: 'RDS PostgreSQL endpoint address for backend',
      value: this.database.instanceEndpoint.hostname,
      exportName: `${stackName}-BackendRdsEndpoint`,
    });

    new cdk.CfnOutput(this, 'BackendRdsCredentialsSecretArn', {
      description: 'Secrets Manager ARN for generated RDS credentials',
      value: this.databaseCredentialsSecret.secretArn,
      exportName: `${stackName}-BackendRdsCredentialsSecretArn`,
    });
  }
}
