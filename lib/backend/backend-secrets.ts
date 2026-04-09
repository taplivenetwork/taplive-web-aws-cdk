import * as cdk from 'aws-cdk-lib/core';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface BackendSecretsProps {
  readonly stackName: string;
}

export class BackendSecrets extends Construct {
  public readonly appSecrets: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: BackendSecretsProps) {
    super(scope, id);

    this.appSecrets = new secretsmanager.Secret(this, 'BackendAppSecrets', {
      secretName: `${props.stackName}/backend/app-secrets`,
      description: 'Placeholder secret for DB credentials and third-party API keys',
      secretObjectValue: {
        DB_HOST: cdk.SecretValue.unsafePlainText('placeholder'),
        DB_PORT: cdk.SecretValue.unsafePlainText('5432'),
        DB_NAME: cdk.SecretValue.unsafePlainText('placeholder'),
        DB_USERNAME: cdk.SecretValue.unsafePlainText('placeholder'),
        DB_PASSWORD: cdk.SecretValue.unsafePlainText('placeholder'),
        THIRD_PARTY_API_KEY: cdk.SecretValue.unsafePlainText('placeholder'),
      },
    });
  }
}
