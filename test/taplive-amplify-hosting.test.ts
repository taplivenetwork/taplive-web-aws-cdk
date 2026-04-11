import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapliveAmplifyHosting } from '../lib/taplive-amplify-hosting';
import type { TapliveAmplifyHostingProps } from '../props/taplive-amplify-hosting-props';

function makeHosting(overrides: Partial<TapliveAmplifyHostingProps> = {}) {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'AmplifyHostingTestStack', {
    env: { account: '123456789012', region: 'eu-central-1' },
  });

  const userPool = new cognito.UserPool(stack, 'TestUserPool', {
    userPoolName: 'AmplifyTestPool',
  });
  const userPoolClient = userPool.addClient('TestClient', {
    userPoolClientName: 'AmplifyTestClient',
  });

  const hosting = new TapliveAmplifyHosting(stack, 'Hosting', {
    domainName: 'taplive.tv',
    userPool,
    userPoolClient,
    backendApiUrl: 'https://abc123.execute-api.eu-central-1.amazonaws.com/prod/',
    ...overrides,
  });

  return { stack, hosting, template: Template.fromStack(stack) };
}

describe('TapliveAmplifyHosting', () => {
  test('creates Amplify app, branch, and domain with Next.js defaults', () => {
    const { template } = makeHosting();

    template.resourceCountIs('AWS::Amplify::App', 1);
    template.resourceCountIs('AWS::Amplify::Branch', 1);
    template.resourceCountIs('AWS::Amplify::Domain', 1);

    template.hasResourceProperties('AWS::Amplify::App', {
      Name: 'TapliveWeb',
      Platform: 'WEB_COMPUTE',
      BuildSpec: Match.stringLikeRegexp('baseDirectory: \\.next'),
    });

    template.hasResourceProperties('AWS::Amplify::Branch', {
      BranchName: 'main',
      EnableAutoBuild: true,
      Stage: 'PRODUCTION',
      Framework: 'Next.js - SSR',
    });

    template.hasResourceProperties('AWS::Amplify::Domain', {
      DomainName: 'taplive.tv',
      SubDomainSettings: [
        { BranchName: 'main', Prefix: '' },
        { BranchName: 'main', Prefix: 'www' },
      ],
    });
  });

  test('embeds build spec with npm ci, next build, and .next cache path', () => {
    const { template } = makeHosting();
    template.hasResourceProperties('AWS::Amplify::App', {
      BuildSpec: Match.stringLikeRegexp('npm ci'),
    });
    template.hasResourceProperties('AWS::Amplify::App', {
      BuildSpec: Match.stringLikeRegexp('npm run build'),
    });
    template.hasResourceProperties('AWS::Amplify::App', {
      BuildSpec: Match.stringLikeRegexp('\\.next/cache'),
    });
  });

  test('passes TAPLIVE_PUBLIC_* env vars to the branch', () => {
    const { template } = makeHosting();

    template.hasResourceProperties('AWS::Amplify::Branch', {
      EnvironmentVariables: Match.arrayWith([
        { Name: 'TAPLIVE_PUBLIC_AWS_REGION', Value: 'eu-central-1' },
        { Name: 'TAPLIVE_PUBLIC_COGNITO_USER_POOL_ID', Value: Match.anyValue() },
        { Name: 'TAPLIVE_PUBLIC_COGNITO_USER_POOL_CLIENT_ID', Value: Match.anyValue() },
        {
          Name: 'TAPLIVE_PUBLIC_API_BASE_URL',
          Value: Match.stringLikeRegexp('execute-api'),
        },
      ]),
    });
  });

  test('omits domain when enableCustomDomainAssociation is false', () => {
    const { template } = makeHosting({ enableCustomDomainAssociation: false });

    template.resourceCountIs('AWS::Amplify::Domain', 0);
  });

  test('throws when repositoryUrl is set without githubAccessTokenSecret', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'ThrowTestStack', {
      env: { account: '123456789012', region: 'eu-central-1' },
    });
    const userPool = new cognito.UserPool(stack, 'Pool');
    const client = userPool.addClient('Cli');

    expect(() => {
      new TapliveAmplifyHosting(stack, 'Hosting', {
        domainName: 'taplive.tv',
        userPool,
        userPoolClient: client,
        backendApiUrl: 'https://x.example.com/',
        repositoryUrl: 'https://github.com/org/taplive-web.git',
      });
    }).toThrow(/githubAccessTokenSecret is required/);
  });

  test('sets repository and access token on app when GitHub is configured', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'GitTestStack', {
      env: { account: '123456789012', region: 'eu-central-1' },
    });
    const userPool = new cognito.UserPool(stack, 'Pool');
    const client = userPool.addClient('Cli');
    const githubSecret = secretsmanager.Secret.fromSecretNameV2(stack, 'GitHubPat', 'amplify/github-pat');

    new TapliveAmplifyHosting(stack, 'Hosting', {
      domainName: 'taplive.tv',
      userPool,
      userPoolClient: client,
      backendApiUrl: 'https://x.example.com/',
      repositoryUrl: 'https://github.com/org/taplive-web.git',
      githubAccessTokenSecret: githubSecret,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Amplify::App', {
      Repository: 'https://github.com/org/taplive-web.git',
      AccessToken: Match.anyValue(),
    });
  });

  test('honors appName, productionBranchName, and artifactBaseDirectory overrides', () => {
    const { template } = makeHosting({
      appName: 'CustomApp',
      productionBranchName: 'develop',
      artifactBaseDirectory: 'out',
    });

    template.hasResourceProperties('AWS::Amplify::App', {
      Name: 'CustomApp',
      BuildSpec: Match.stringLikeRegexp('baseDirectory: out'),
    });

    template.hasResourceProperties('AWS::Amplify::Branch', {
      BranchName: 'develop',
    });

    template.hasResourceProperties('AWS::Amplify::Domain', {
      SubDomainSettings: [
        { BranchName: 'develop', Prefix: '' },
        { BranchName: 'develop', Prefix: 'www' },
      ],
    });
  });

  test('emits hosting outputs', () => {
    const { template } = makeHosting();

    expect(Object.keys(template.findOutputs('*', {
      Description: 'Amplify app ID (hosting)',
    })).length).toBe(1);
    expect(Object.keys(template.findOutputs('*', {
      Description: 'Default Amplify URL for the production branch',
    })).length).toBe(1);
    expect(Object.keys(template.findOutputs('*', {
      Description: Match.stringLikeRegexp('Custom domain association status'),
    })).length).toBe(1);
  });

  test('does not emit custom domain output when domain association is disabled', () => {
    const { template } = makeHosting({ enableCustomDomainAssociation: false });

    expect(Object.keys(template.findOutputs('*', {
      Description: Match.stringLikeRegexp('Custom domain association status'),
    })).length).toBe(0);
  });
});
