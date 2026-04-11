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
      description: 'Placeholder secret for DB credentials and third-party API keys'
    });
  }
}
