import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CognitoUserAuth } from '../lib/cognito-user-auth';

function makeAuth(overrides: Partial<{
  userPoolName: string;
  userPoolClientName: string;
  verificationEmailSubject: string;
  verificationEmailBody: string;
}> = {}) {
  const stack = new cdk.Stack(new cdk.App(), 'AuthTestStack');
  const auth = new CognitoUserAuth(stack, 'Auth', {
    userPoolName: 'TapliveUsers',
    userPoolClientName: 'TapliveWebClient',
    verificationEmailSubject: 'Your TapLive verification code',
    verificationEmailBody: 'Use this code to verify your TapLive account: {####}',
    ...overrides,
  });
  return { stack, auth, template: Template.fromStack(stack) };
}

describe('CognitoUserAuth', () => {
  test('creates one user pool and one user pool client', () => {
    const { template } = makeAuth();
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
  });

  test('enables self sign-up and email auto verification', () => {
    const { template } = makeAuth();
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
      },
      AutoVerifiedAttributes: Match.arrayWith(['email']),
      UsernameAttributes: Match.arrayWith(['email']),
    });
  });

  test('enforces password policy including symbols', () => {
    const { template } = makeAuth();
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireUppercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
        },
      },
    });
  });

  test('uses verification code email configuration', () => {
    const { template } = makeAuth();
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE',
        EmailMessage: 'Use this code to verify your TapLive account: {####}',
        EmailSubject: 'Your TapLive verification code',
      },
    });
  });

  test('emits outputs for user pool id and client id', () => {
    const { template } = makeAuth();
    expect(Object.keys(template.findOutputs('*', {
      Description: 'Cognito User Pool ID for app sign-up/sign-in',
    })).length).toBe(1);
    expect(Object.keys(template.findOutputs('*', {
      Description: 'Cognito User Pool App Client ID for web app',
    })).length).toBe(1);
  });
});
