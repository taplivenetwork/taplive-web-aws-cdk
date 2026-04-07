import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Route53HostedZone } from '../lib/route53-hosted-zone';

function makeZone(zoneName = 'taplive.tv') {
  const stack = new cdk.Stack(new cdk.App(), 'TestStack');
  const construct = new Route53HostedZone(stack, 'Zone', { zoneName });
  return { stack, construct, template: Template.fromStack(stack) };
}

describe('Route53HostedZone', () => {
  describe('hosted zone resource', () => {
    test('creates exactly one AWS::Route53::HostedZone', () => {
      const { template } = makeZone();
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
    });

    test('sets the correct zone name', () => {
      const { template } = makeZone();
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'taplive.tv.',
      });
    });

    test('exposes the hostedZone property', () => {
      const { construct } = makeZone();
      expect(construct.hostedZone).toBeDefined();
    });
  });

  describe('name server outputs', () => {
    test('emits exactly 4 NS stack outputs', () => {
      const { template } = makeZone();
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('Name server .* of 4'),
      });
      expect(Object.keys(outputs).length).toBe(4);
    });

    test('each NS output description mentions the registrar', () => {
      const { template } = makeZone();
      const outputs = template.findOutputs('*', {
        Description: Match.stringLikeRegexp('domain registrar'),
      });
      expect(Object.keys(outputs).length).toBe(4);
    });
  });
});
