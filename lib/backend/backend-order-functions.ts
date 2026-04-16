import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { aws_secretsmanager } from "aws-cdk-lib";

export interface OrderFunctionsProps {
  readonly stackName: string;
  readonly role: lambda.IFunction["role"]; // Typing to iam role for lambdas
  readonly appSecrets: aws_secretsmanager.ISecret;
}

/**
 * Construct that defines all Lambda functions related to order processing in the backend.
 */
export class OrderFunctions extends Construct {
  public readonly createOrderFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: OrderFunctionsProps) {
    super(scope, id);

    /**
     * Lambda function for creating orders
     * - Service isn't implemented entirely due to dependency on #1.2
     */
    this.createOrderFunction = new NodejsFunction(this, "CreateOrderFunction", {
      functionName: `${props.stackName}-create-order`,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "lib/backend/lambda/orders/create-order.handler.ts",
      handler: "handler",
      role: props.role,
      environment: {
        APP_SECRETS_ARN: props.appSecrets.secretArn,
      },
    });
  }
}
