export interface CognitoUserAuthProps {
  /**
   * User pool name shown in Cognito.
   * @default TapliveUsers
   */
  readonly userPoolName?: string;

  /**
   * User pool app client name.
   * @default TapliveWebClient
   */
  readonly userPoolClientName?: string;

  /**
   * Verification email subject sent by Cognito.
   * @default Verify your TapLive account
   */
  readonly verificationEmailSubject?: string;

  /**
   * Email message body for sign-up verification.
   * Must include the Cognito placeholder {####}.
   */
  readonly verificationEmailBody?: string;
}
