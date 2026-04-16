import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { AmplifyHosting } from '../lib/amplify-hosting';

function makeStack(id = 'AmplifyHostingTestStack') {
  return new cdk.Stack(new cdk.App(), id);
}

describe('AmplifyHosting', () => {
  test('creates Amplify app and branch wired to repository and branch', () => {
    const stack = makeStack();
    new AmplifyHosting(stack, 'Hosting', {
      appName: 'taplive-web-new',
      repositoryUrl: 'https://github.com/taplivenetwork/taplive-web-new',
      branchName: 'main',
      githubTokenSecretName: 'taplive/github/pat',
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Amplify::App', 1);
    template.resourceCountIs('AWS::Amplify::Branch', 1);

    template.hasResourceProperties('AWS::Amplify::App', {
      Name: 'taplive-web-new',
      Repository: 'https://github.com/taplivenetwork/taplive-web-new',
      Platform: 'WEB_COMPUTE',
      EnableBranchAutoDeletion: true,
      AccessToken: '{{resolve:secretsmanager:taplive/github/pat:SecretString:::}}',
    });

    template.hasResourceProperties('AWS::Amplify::Branch', {
      BranchName: 'main',
      Stage: 'PRODUCTION',
      EnableAutoBuild: true,
      AppId: Match.anyValue(),
    });
  });

  test('emits Amplify outputs for app id and branch URL', () => {
    const stack = makeStack('AmplifyHostingOutputsStack');
    new AmplifyHosting(stack, 'Hosting', {
      appName: 'taplive-web-new',
      repositoryUrl: 'https://github.com/taplivenetwork/taplive-web-new',
      branchName: 'main',
    });

    const template = Template.fromStack(stack);
    expect(Object.keys(template.findOutputs('*', {
      Description: 'Amplify app ID (hosting)',
    })).length).toBe(1);
    expect(Object.keys(template.findOutputs('*', {
      Description: 'Amplify production URL for configured branch',
    })).length).toBe(1);
  });
});
