import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface BackendRestApiProps {
  readonly apiName: string;
  readonly corsAllowedOrigins: string[];
  readonly healthFunction: lambda.IFunction;
}

export class BackendRestApi extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: BackendRestApiProps) {
    super(scope, id);

    this.restApi = new apigateway.RestApi(this, 'BackendRestApi', {
      restApiName: props.apiName,
      description: 'Taplive backend REST API',
      deployOptions: {
        stageName: 'v1',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: props.corsAllowedOrigins,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      },
    });

    const healthResource = this.restApi.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(props.healthFunction, {
      proxy: true,
    }));

    new apigateway.GatewayResponse(this, 'Default4xxWithSecurityHeaders', {
      restApi: this.restApi,
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': `'${props.corsAllowedOrigins[0]}'`,
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Requested-With'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
        'X-Content-Type-Options': "'nosniff'",
        'X-Frame-Options': "'DENY'",
      },
    });

    new apigateway.GatewayResponse(this, 'Default5xxWithSecurityHeaders', {
      restApi: this.restApi,
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': `'${props.corsAllowedOrigins[0]}'`,
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Requested-With'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
        'X-Content-Type-Options': "'nosniff'",
        'X-Frame-Options': "'DENY'",
      },
    });

    this.restApi.addGatewayResponse('UnauthorizedWithCors', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': `'${props.corsAllowedOrigins[0]}'`,
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Requested-With'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
      },
    });
  }
}
