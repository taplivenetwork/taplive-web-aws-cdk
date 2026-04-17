import * as cdk from "aws-cdk-lib/core";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export interface CognitoPostConfirmationProps {
  // readonly database: rds.DatabaseInstance;
  readonly databaseCredentialsSecret: secretsmanager.ISecret;
  readonly vpc: ec2.Vpc;
  readonly securityGroup: ec2.SecurityGroup;
  readonly stackName: string;
}

export class CognitoPostConfirmation extends Construct {
  public readonly function: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: CognitoPostConfirmationProps,
  ) {
    super(scope, id);

    /**
     * Mainly we just need the SecretsManagerAccess policy, I'll find a more efficient way to do this in the future
     */
    const role = new iam.Role(this, "PostConfirmationRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: ["arn:aws:logs:*:*:*"],
            }),
          ],
        }),
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["secretsmanager:GetSecretValue"],
              resources: [props.databaseCredentialsSecret.secretArn],
            }),
          ],
        }),
        VPCAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    this.function = new NodejsFunction(this, "PostConfirmationFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      entry: "lambda/user/post-confirmation/handler.ts",
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      role,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      environment: {
        DB_CREDENTIALS_SECRET_ARN: props.databaseCredentialsSecret.secretArn,
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    props.securityGroup.addIngressRule(
      props.securityGroup,
      ec2.Port.tcp(5432),
      "Allow Lambda to connect to database",
    );

    new cdk.CfnOutput(this, "PostConfirmationFunctionArn", {
      description: "PostConfirmation Lambda function ARN",
      value: this.function.functionArn,
      exportName: `${props.stackName}-PostConfirmationFunctionArn`,
    });
  }
}
