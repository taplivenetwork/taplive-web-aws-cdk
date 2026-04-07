import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SesDomainIdentity } from '../lib/ses-domain-identity';

function makeStack(id = 'TestStack'): cdk.Stack {
  return new cdk.Stack(new cdk.App(), id);
}

describe('SesDomainIdentity', () => {
  describe('with default props (DKIM on, no MAIL FROM)', () => {
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

    test('outputs the identity ARN', () => {
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('ARN of the SES identity'),
      });
      expect(Object.keys(outputs).length).toBe(1);
    });

    test('outputs 3 DKIM record names and 3 DKIM record values', () => {
      const nameOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record .* NAME'),
      });
      const valueOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record .* VALUE'),
      });
      expect(Object.keys(nameOutputs).length).toBe(3);
      expect(Object.keys(valueOutputs).length).toBe(3);
    });
  });

  describe('with dkimSigning disabled', () => {
    let template: Template;

    beforeEach(() => {
      const stack = makeStack();
      new SesDomainIdentity(stack, 'Identity', {
        domainName: 'taplive.tv',
        dkimSigning: false,
      });
      template = Template.fromStack(stack);
    });

    test('disables DKIM signing', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        DkimAttributes: { SigningEnabled: false },
      });
    });

    test('emits no DKIM CNAME outputs', () => {
      const dkimOutputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('DKIM CNAME record'),
      });
      expect(Object.keys(dkimOutputs).length).toBe(0);
    });
  });

  describe('with mailFromSubdomain set', () => {
    let template: Template;

    beforeEach(() => {
      const stack = makeStack();
      new SesDomainIdentity(stack, 'Identity', {
        domainName: 'taplive.tv',
        mailFromSubdomain: 'mail',
      });
      template = Template.fromStack(stack);
    });

    test('sets MAIL FROM domain to <subdomain>.<domain>', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        MailFromAttributes: { MailFromDomain: 'mail.taplive.tv' },
      });
    });

    test('sets MX failure behaviour to USE_DEFAULT_VALUE', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        MailFromAttributes: { BehaviorOnMxFailure: 'USE_DEFAULT_VALUE' },
      });
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
