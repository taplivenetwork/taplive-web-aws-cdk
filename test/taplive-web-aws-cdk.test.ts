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

  describe('SES domain identity', () => {
    test('creates exactly one SES email identity', () => {
      template.resourceCountIs('AWS::SES::EmailIdentity', 1);
    });

    test('registers taplive.tv as the identity domain', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        EmailIdentity: 'taplive.tv',
      });
    });

    test('enables DKIM signing', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        DkimAttributes: { SigningEnabled: true },
      });
    });

    test('sets MAIL FROM to mail.taplive.tv', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        MailFromAttributes: { MailFromDomain: 'mail.taplive.tv' },
      });
    });
  });

  describe('stack outputs', () => {
    test('outputs the verification sender From address', () => {
      const outputs = template.findOutputs('*', {
        Description: 'From address to use when sending verification emails',
      });
      expect(Object.keys(outputs).length).toBe(1);
      const value = Object.values(outputs)[0].Value as string;
      expect(value).toBe('TapLive <noreply-verify@taplive.tv>');
    });

    test('outputs 3 DKIM record names and 3 DKIM record values', () => {
      const names = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record .* NAME'),
      });
      const values = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record .* VALUE'),
      });
      expect(Object.keys(names).length).toBe(3);
      expect(Object.keys(values).length).toBe(3);
    });

    test('outputs the SES identity ARN', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('ARN of the SES identity'),
      });
      expect(Object.keys(outputs).length).toBe(1);
    });
  });

  describe('SES email template', () => {
    test('creates exactly one AWS::SES::Template', () => {
      template.resourceCountIs('AWS::SES::Template', 1);
    });

    test('template subject contains the {{code}} placeholder', () => {
      template.hasResourceProperties('AWS::SES::Template', {
        Template: { SubjectPart: Match.stringLikeRegexp('\\{\\{code\\}\\}') },
      });
    });

    test('outputs the template name', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('SES template name'),
      });
      expect(Object.keys(outputs).length).toBe(1);
    });
  });

  describe('excluded resources', () => {
    test('creates no SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 0);
    });
  });
});
