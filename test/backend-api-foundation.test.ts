import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { BackendApiFoundation } from '../lib/backend-api-foundation';

function makeBackend(overrides: Partial<{
  apiName: string;
  corsAllowedOrigins: string[];
}> = {}) {
  const stack = new cdk.Stack(new cdk.App(), 'TestStack');
  const backend = new BackendApiFoundation(stack, 'Backend', {
    apiName: 'TapliveBackendApi',
    corsAllowedOrigins: ['*'],
    ...overrides,
  });
  return { stack, backend, template: Template.fromStack(stack) };
}

describe('BackendApiFoundation', () => {
  describe('API Gateway', () => {
    test('creates exactly one REST API', () => {
      const { template } = makeBackend();
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('uses the configured API name', () => {
      const { template } = makeBackend();
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TapliveBackendApi',
      });
    });

    test('creates health endpoint method and integration permissions', () => {
      const { template } = makeBackend();
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
      template.resourceCountIs('AWS::Lambda::Permission', 2);
    });

    test('creates gateway responses for 4xx, 5xx, and unauthorized', () => {
      const { template } = makeBackend();
      template.resourceCountIs('AWS::ApiGateway::GatewayResponse', 3);
    });
  });

  describe('Lambda and IAM', () => {
    test('creates a Lambda function for health check', () => {
      const { template } = makeBackend();
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs20.x',
      });
    });

    test('creates IAM role assumed by Lambda', () => {
      const { template } = makeBackend();
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        },
      });
    });

    test('attaches Lambda basic execution managed policy for CloudWatch logs', () => {
      const { template } = makeBackend();
      const roles = template.findResources('AWS::IAM::Role');
      const hasLambdaBasicManagedPolicy = Object.values(roles).some((role: any) =>
        JSON.stringify(role).includes('AWSLambdaBasicExecutionRole'));
      expect(hasLambdaBasicManagedPolicy).toBe(true);
    });

    test('adds inline permissions for RDS and Secrets Manager read', () => {
      const { template } = makeBackend();
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['rds-db:connect', 'rds-data:*']),
            }),
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('Secrets, database, and outputs', () => {
    test('creates app secret and RDS credentials secret', () => {
      const { template } = makeBackend();
      template.resourceCountIs('AWS::SecretsManager::Secret', 2);
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.stringLikeRegexp('DB credentials and third-party API keys'),
      });
    });

    test('creates one PostgreSQL RDS instance', () => {
      const { template } = makeBackend();
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBName: 'taplive',
        PubliclyAccessible: false,
      });
    });

    test('emits API, health URL, role ARN, secrets ARN, and RDS outputs', () => {
      const { template } = makeBackend();
      expect(Object.keys(template.findOutputs('*', {
        Description: 'Base invoke URL for backend API stage',
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: 'Health check endpoint URL',
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: Match.stringLikeRegexp('Base Lambda execution role ARN'),
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: 'Secrets Manager ARN for backend credentials storage',
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: Match.stringLikeRegexp('RDS PostgreSQL endpoint address'),
      })).length).toBe(1);
      expect(Object.keys(template.findOutputs('*', {
        Description: Match.stringLikeRegexp('generated RDS credentials'),
      })).length).toBe(1);
    });
  });
});
