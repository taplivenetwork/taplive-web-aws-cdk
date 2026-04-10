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

  // Keep Cognito default email sending while SES production access is pending.
  // /**
  //  * From email address used by Cognito via SES.
  //  * @default noreply-verify@taplive.tv
  //  */
  // readonly verificationFromEmail?: string;

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
