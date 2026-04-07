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

  describe('Route 53 hosted zone', () => {
    test('creates exactly one hosted zone', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
    });

    test('hosted zone is for taplive.tv', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'taplive.tv.',
      });
    });

    test('outputs 4 name server records', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('Name server .* of 4'),
      });
      expect(Object.keys(outputs).length).toBe(4);
    });
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

    test('auto-creates Route 53 DNS records for SES (DKIM + MAIL FROM)', () => {
      const records = template.findResources('AWS::Route53::RecordSet');
      expect(Object.keys(records).length).toBeGreaterThanOrEqual(3);
    });

    test('does not emit manual DKIM outputs when Route 53 is wired', () => {
      const dkimOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record'),
      });
      expect(Object.keys(dkimOutputs).length).toBe(0);
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

  describe('stack outputs', () => {
    test('outputs the verification sender From address', () => {
      const outputs = template.findOutputs('*', {
        Description: 'From address to use when sending verification emails',
      });
      expect(Object.keys(outputs).length).toBe(1);
    });

    test('outputs the SES identity ARN', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('ARN of the SES identity'),
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
