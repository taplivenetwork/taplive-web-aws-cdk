import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapliveWebAwsCdkStack } from '../lib/taplive-web-aws-cdk-stack';

describe('TapliveWebAwsCdkStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TapliveWebAwsCdkStack(app, 'IntegTestStack');
    template = Template.fromStack(stack);
  });

  describe('skipAmplifyHosting', () => {
    test('omits Amplify resources and hosting outputs when context is true', () => {
      const app = new cdk.App({ context: { skipAmplifyHosting: true } });
      const stack = new TapliveWebAwsCdkStack(app, 'SkipAmplifyStack');
      const t = Template.fromStack(stack);

      t.resourceCountIs('AWS::Amplify::App', 0);
      t.resourceCountIs('AWS::Amplify::Branch', 0);
      t.resourceCountIs('AWS::Amplify::Domain', 0);
      expect(Object.keys(t.findOutputs('*', { Description: 'Amplify app ID (hosting)' })).length).toBe(
        0,
      );
    });

    test('accepts skipAmplifyHosting string true', () => {
      const app = new cdk.App({ context: { skipAmplifyHosting: 'true' } });
      const stack = new TapliveWebAwsCdkStack(app, 'SkipAmplifyStringStack');
      const t = Template.fromStack(stack);
      t.resourceCountIs('AWS::Amplify::App', 0);
    });
  });

  describe('integration wiring', () => {
    test('creates one of each major feature resource', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
      template.resourceCountIs('AWS::SES::EmailIdentity', 1);
      template.resourceCountIs('AWS::SES::Template', 1);
      template.resourceCountIs('AWS::Cognito::UserPool', 1);
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::SecretsManager::Secret', 2);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::Amplify::App', 1);
      template.resourceCountIs('AWS::Amplify::Branch', 1);
      template.resourceCountIs('AWS::Amplify::Domain', 1);
    });

    test('emits foundational outputs required by consumers', () => {
      expect(Object.keys(template.findOutputs('*', {
        Description: Match.stringLikeRegexp('Name server .* of 4'),
      })).length).toBe(4);
      expect(Object.keys(template.findOutputs('*', {
        Description: Match.stringLikeRegexp('ARN of the SES identity'),
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: 'Base invoke URL for backend API stage',
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: 'Health check endpoint URL',
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: 'Amplify app ID (hosting)',
      })).length).toBe(1);
    });

    test('keeps intentionally excluded resources absent', () => {
      template.resourceCountIs('AWS::SNS::Topic', 0);
    });
  });
});
