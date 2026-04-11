import * as cdk from 'aws-cdk-lib/core';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import { Construct } from 'constructs';
import { TapliveAmplifyHostingProps } from '../props/taplive-amplify-hosting-props';

export { TapliveAmplifyHostingProps };

function amplifyBuildSpec(artifactBaseDirectory: string): string {
  return [
    'version: 1',
    'frontend:',
    '  phases:',
    '    preBuild:',
    '      commands:',
    '        - npm ci',
    '    build:',
    '      commands:',
    '        - npm run build',
    '  artifacts:',
    `    baseDirectory: ${artifactBaseDirectory}`,
    '    files:',
    "      - '**/*'",
    '  cache:',
    '    paths:',
    '      - node_modules/**/*',
    '      - .next/cache/**/*',
  ].join('\n');
}

/**
 * Amplify Hosting (L1) for **Next.js**: `WEB_COMPUTE`, `.next` artifacts, Next build cache.
 * Public env vars use `NEXT_PUBLIC_*` (see `process.env.NEXT_PUBLIC_*` in app code).
 * No SPA rewrite rules — Next handles routing. Use `artifactBaseDirectory: 'out'` only for static export.
 */
export class TapliveAmplifyHosting extends Construct {
  public readonly app: amplify.CfnApp;
  public readonly branch: amplify.CfnBranch;
  public readonly domain?: amplify.CfnDomain;

  constructor(scope: Construct, id: string, props: TapliveAmplifyHostingProps) {
    super(scope, id);

    const branchName = props.productionBranchName ?? 'main';
    const appName = props.appName ?? 'TapliveWeb';
    const artifactDir = props.artifactBaseDirectory ?? '.next';
    const enableDomain = props.enableCustomDomainAssociation ?? true;

    const repoUrl = props.repositoryUrl?.trim();
    if (repoUrl && !props.githubAccessTokenSecret) {
      throw new Error(
        'TapliveAmplifyHosting: githubAccessTokenSecret is required when repositoryUrl is set.',
      );
    }

    const stack = cdk.Stack.of(this);
    const region = stack.region;

    const buildSpec = amplifyBuildSpec(artifactDir);

    const gitHubConnected = Boolean(repoUrl && props.githubAccessTokenSecret);

    const appProps: amplify.CfnAppProps = {
      name: appName,
      platform: 'WEB_COMPUTE',
      buildSpec,
      ...(gitHubConnected
        ? {
            repository: repoUrl,
            accessToken: props.githubAccessTokenSecret!.secretValue.unsafeUnwrap(),
          }
        : {}),
    };

    this.app = new amplify.CfnApp(this, 'AmplifyApp', appProps);

    const branchEnv: amplify.CfnBranch.EnvironmentVariableProperty[] = [
      { name: 'TAPLIVE_PUBLIC_AWS_REGION', value: region },
      { name: 'TAPLIVE_PUBLIC_COGNITO_USER_POOL_ID', value: props.userPool.userPoolId },
      { name: 'TAPLIVE_PUBLIC_COGNITO_USER_POOL_CLIENT_ID', value: props.userPoolClient.userPoolClientId },
      { name: 'TAPLIVE_PUBLIC_API_BASE_URL', value: props.backendApiUrl },
    ];

    this.branch = new amplify.CfnBranch(this, 'AmplifyBranch', {
      appId: this.app.attrAppId,
      branchName,
      enableAutoBuild: true,
      stage: 'PRODUCTION',
      buildSpec,
      framework: 'Next.js - SSR',
      environmentVariables: branchEnv,
    });

    if (enableDomain) {
      this.domain = new amplify.CfnDomain(this, 'AmplifyDomain', {
        appId: this.app.attrAppId,
        domainName: props.domainName,
        subDomainSettings: [
          { branchName, prefix: '' },
          { branchName, prefix: 'www' },
        ],
        certificateSettings: {
          certificateType: 'AMPLIFY_MANAGED',
        },
      });
      this.domain.node.addDependency(this.branch);
    }

    const stackName = stack.stackName;

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      description: 'Amplify app ID (hosting)',
      value: this.app.attrAppId,
      exportName: `${stackName}-AmplifyAppId`,
    });

    new cdk.CfnOutput(this, 'AmplifyDefaultBranchUrl', {
      description: 'Default Amplify URL for the production branch',
      value: cdk.Fn.join('', ['https://', branchName, '.', this.app.attrAppId, '.amplifyapp.com']),
      exportName: `${stackName}-AmplifyDefaultBranchUrl`,
    });

    if (this.domain) {
      new cdk.CfnOutput(this, 'AmplifyCustomDomainStatus', {
        description: 'Custom domain association status (see Amplify console for DNS if needed)',
        value: this.domain.attrDomainStatus,
        exportName: `${stackName}-AmplifyCustomDomainStatus`,
      });
    }
  }
}
