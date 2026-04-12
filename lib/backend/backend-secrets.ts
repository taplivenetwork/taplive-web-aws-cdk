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

    // Without `secretStringValue`, CDK defaults to GenerateSecretString (random gibberish). Use `{}`
    // so the value is an empty JSON object you can extend in the console (e.g. third-party API keys).
    this.appSecrets = new secretsmanager.Secret(this, 'BackendAppSecrets', {
      secretName: `${props.stackName}/backend/app-secrets`,
      description: 'Placeholder secret for DB credentials and third-party API keys',
      secretStringValue: cdk.SecretValue.unsafePlainText('{}'),
    });
  }
}
