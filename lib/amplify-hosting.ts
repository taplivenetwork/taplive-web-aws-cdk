import * as cdk from 'aws-cdk-lib/core';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import { Construct } from 'constructs';
import { AmplifyHostingProps } from '../props/amplify-hosting-props';

export { AmplifyHostingProps };

/**
 * Provisions an Amplify app connected to a Git repository branch.
 */
export class AmplifyHosting extends Construct {
  /** Low-level Amplify app resource. */
  public readonly app: amplify.CfnApp;

  /** Low-level Amplify branch resource for production deploys. */
  public readonly branch: amplify.CfnBranch;

  constructor(scope: Construct, id: string, props: AmplifyHostingProps) {
    super(scope, id);

    const githubTokenSecretName = props.githubTokenSecretName ?? 'taplive/github/pat';
    const githubToken = cdk.SecretValue.secretsManager(githubTokenSecretName).unsafeUnwrap();

    this.app = new amplify.CfnApp(this, 'App', {
      name: props.appName,
      repository: props.repositoryUrl,
      accessToken: githubToken,
      platform: 'WEB_COMPUTE',
      enableBranchAutoDeletion: true,
    });

    this.branch = new amplify.CfnBranch(this, 'Branch', {
      appId: this.app.attrAppId,
      branchName: props.branchName,
      stage: 'PRODUCTION',
      enableAutoBuild: true,
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: this.app.attrAppId,
      description: 'Amplify app ID (hosting)',
    });
    new cdk.CfnOutput(this, 'AmplifyBranchUrl', {
      value: `https://${props.branchName}.${this.app.attrDefaultDomain}`,
      description: 'Amplify production URL for configured branch',
    });
  }
}
