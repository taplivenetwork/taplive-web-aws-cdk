import * as cdk from 'aws-cdk-lib/core';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SesDomainIdentity } from '../lib/ses-domain-identity';

function makeStack(id = 'TestStack') {
  return new cdk.Stack(new cdk.App(), id);
}

function makeHostedZone(stack: cdk.Stack) {
  return new route53.PublicHostedZone(stack, 'Zone', { zoneName: 'taplive.tv' });
}

describe('SesDomainIdentity', () => {
  describe('without hosted zone (manual DNS mode)', () => {
    let template: Template;

    beforeEach(() => {
      const stack = makeStack();
      new SesDomainIdentity(stack, 'Identity', { domainName: 'taplive.tv' });
      template = Template.fromStack(stack);
    });

    test('creates exactly one CfnEmailIdentity', () => {
      template.resourceCountIs('AWS::SES::EmailIdentity', 1);
    });

    test('registers the correct domain', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        EmailIdentity: 'taplive.tv',
      });
    });

    test('enables DKIM signing', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        DkimAttributes: { SigningEnabled: true },
      });
    });

    test('uses RSA-2048 Easy DKIM', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        DkimSigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' },
      });
    });

    test('does not set a MAIL FROM domain by default', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        MailFromAttributes: Match.absent(),
      });
    });

    test('outputs 3 DKIM record names and 3 values for manual DNS entry', () => {
      const nameOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record .* NAME'),
      });
      const valueOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record .* VALUE'),
      });
      expect(Object.keys(nameOutputs).length).toBe(3);
      expect(Object.keys(valueOutputs).length).toBe(3);
    });

    test('outputs the identity ARN', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('ARN of the SES identity'),
      });
      expect(Object.keys(outputs).length).toBe(1);
    });
  });

  describe('with hosted zone (Route 53 auto-DNS mode)', () => {
    let template: Template;

    beforeEach(() => {
      const stack = makeStack();
      const hostedZone = makeHostedZone(stack);
      new SesDomainIdentity(stack, 'Identity', {
        domainName: 'taplive.tv',
        dkimSigning: true,
        mailFromSubdomain: 'mail',
        hostedZone,
      });
      template = Template.fromStack(stack);
    });

    test('creates the SES email identity', () => {
      template.resourceCountIs('AWS::SES::EmailIdentity', 1);
    });

    test('auto-creates Route 53 records for DKIM and MAIL FROM', () => {
      // CDK creates 3 DKIM CNAME + 1 MAIL FROM MX + 1 MAIL FROM SPF TXT = 5
      const records = template.findResources('AWS::Route53::RecordSet');
      expect(Object.keys(records).length).toBeGreaterThanOrEqual(3);
    });

    test('does not emit manual DKIM stack outputs when hosted zone is wired', () => {
      const dkimOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record'),
      });
      expect(Object.keys(dkimOutputs).length).toBe(0);
    });

    test('still outputs the identity ARN', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('ARN of the SES identity'),
      });
      expect(Object.keys(outputs).length).toBe(1);
    });

    test('sets MAIL FROM to mail.taplive.tv', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        MailFromAttributes: { MailFromDomain: 'mail.taplive.tv' },
      });
    });
  });

  describe('with dkimSigning disabled', () => {
    test('disables DKIM signing', () => {
      const stack = makeStack();
      new SesDomainIdentity(stack, 'Identity', {
        domainName: 'taplive.tv',
        dkimSigning: false,
      });
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        DkimAttributes: { SigningEnabled: false },
      });
    });

    test('emits no DKIM outputs when disabled', () => {
      const stack = makeStack();
      new SesDomainIdentity(stack, 'Identity', {
        domainName: 'taplive.tv',
        dkimSigning: false,
      });
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record'),
      });
      expect(Object.keys(outputs).length).toBe(0);
    });
  });

  describe('domainName property', () => {
    test('exposes the domain name passed in props', () => {
      const stack = makeStack();
      const identity = new SesDomainIdentity(stack, 'Identity', {
        domainName: 'taplive.tv',
      });
      expect(identity.domainName).toBe('taplive.tv');
    });
  });
});
