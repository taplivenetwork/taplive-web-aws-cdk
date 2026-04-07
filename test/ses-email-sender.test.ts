import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SesEmailSender } from '../lib/ses-email-sender';

const DEFAULT_TEMPLATE_PROPS = {
  subject: 'Your TapLive verification code is {{code}}',
  htmlBody: '<p>Hi {{name}}, your code is <b>{{code}}</b></p>',
  textBody: 'Hi {{name}}, your code is {{code}}',
};

function makeSender(overrides: Partial<{
  domainName: string;
  fromName: string;
  fromLocalPart: string;
  verificationTemplate: typeof DEFAULT_TEMPLATE_PROPS;
}> = {}) {
  const stack = new cdk.Stack(new cdk.App(), 'TestStack');
  const sender = new SesEmailSender(stack, 'Sender', {
    domainName: 'taplive.tv',
    fromName: 'TapLive',
    fromLocalPart: 'noreply-verify',
    verificationTemplate: DEFAULT_TEMPLATE_PROPS,
    ...overrides,
  });
  return { stack, sender, template: Template.fromStack(stack) };
}

describe('SesEmailSender', () => {
  describe('fromAddress composition', () => {
    test('builds the correct RFC 5322 From address', () => {
      const { sender } = makeSender();
      expect(sender.fromAddress).toBe('TapLive <noreply-verify@taplive.tv>');
    });

    test('reflects a custom fromName', () => {
      const { sender } = makeSender({ fromName: 'MyApp' });
      expect(sender.fromAddress).toContain('MyApp');
    });

    test('reflects a custom fromLocalPart', () => {
      const { sender } = makeSender({ fromLocalPart: 'hello' });
      expect(sender.fromAddress).toContain('hello@taplive.tv');
    });

    test('reflects a custom domainName', () => {
      const { sender } = makeSender({ domainName: 'example.com' });
      expect(sender.fromAddress).toContain('@example.com');
    });
  });

  describe('SES template resource', () => {
    test('creates exactly one AWS::SES::Template', () => {
      const { template } = makeSender();
      template.resourceCountIs('AWS::SES::Template', 1);
    });

    test('template subject matches the prop', () => {
      const { template } = makeSender();
      template.hasResourceProperties('AWS::SES::Template', {
        Template: { SubjectPart: DEFAULT_TEMPLATE_PROPS.subject },
      });
    });

    test('template HTML body matches the prop', () => {
      const { template } = makeSender();
      template.hasResourceProperties('AWS::SES::Template', {
        Template: { HtmlPart: DEFAULT_TEMPLATE_PROPS.htmlBody },
      });
    });

    test('template text body matches the prop', () => {
      const { template } = makeSender();
      template.hasResourceProperties('AWS::SES::Template', {
        Template: { TextPart: DEFAULT_TEMPLATE_PROPS.textBody },
      });
    });

    test('template name includes the stack name', () => {
      const { sender } = makeSender();
      expect(sender.templateName).toContain('VerificationEmail');
    });
  });

  describe('stack outputs', () => {
    test('emits a FromAddress output', () => {
      const { template } = makeSender();
      const outputs = template.findOutputs('*', {
        Description: 'From address to use when sending verification emails',
      });
      expect(Object.keys(outputs).length).toBe(1);
    });

    test('FromAddress output value matches the fromAddress property', () => {
      const { sender, template } = makeSender();
      const outputs = template.findOutputs('*', {
        Description: 'From address to use when sending verification emails',
      });
      expect(Object.values(outputs)[0].Value).toBe(sender.fromAddress);
    });

    test('emits a TemplateName output', () => {
      const { template } = makeSender();
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('SES template name'),
      });
      expect(Object.keys(outputs).length).toBe(1);
    });
  });
});
