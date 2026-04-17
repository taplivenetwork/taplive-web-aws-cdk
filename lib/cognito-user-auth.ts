import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { CognitoUserAuthProps } from '../props/cognito-user-auth-props';

export { CognitoUserAuthProps };

/**
 * Cognito user authentication foundation for email verification sign-up.
 */
export class CognitoUserAuth extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoUserAuthProps = {}) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: props.userPoolName ?? 'TapliveUsers',
      // Keep Cognito default email sending while SES production access is pending.
      // email: cognito.UserPoolEmail.withSES({
      //   fromEmail: props.verificationFromEmail ?? 'noreply-verify@taplive.tv',
      //   fromName: 'TapLive',
      //   sesRegion: cdk.Stack.of(this).region,
      // }),
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailSubject: props.verificationEmailSubject ?? 'Verify your TapLive account',
        emailBody:
          props.verificationEmailBody ??
          'Your TapLive verification code is {####}. It expires shortly.',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    /**
     * If the postConfirmation function is provided, invoke it when a user confirms sign up.
     */
    if (props.postConfirmationFunction) {
      this.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, props.postConfirmationFunction);
    }

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: props.userPoolClientName ?? 'TapliveWebClient',
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    const stackName = cdk.Stack.of(this).stackName;

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      description: 'Cognito User Pool ID for app sign-up/sign-in',
      value: this.userPool.userPoolId,
      exportName: `${stackName}-CognitoUserPoolId`,
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      description: 'Cognito User Pool App Client ID for web app',
      value: this.userPoolClient.userPoolClientId,
      exportName: `${stackName}-CognitoUserPoolClientId`,
    });
  }
}
