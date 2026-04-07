export interface VerificationEmailTemplateProps {
  /**
   * Subject line for the verification email.
   * Use {{code}} as the placeholder for the OTP.
   * @example 'Your TapLive verification code is {{code}}'
   */
  readonly subject: string;

  /**
   * HTML body of the verification email.
   * Use {{name}} and {{code}} as placeholders.
   */
  readonly htmlBody: string;

  /**
   * Plain-text fallback body (shown by email clients that block HTML).
   * Use {{name}} and {{code}} as placeholders.
   */
  readonly textBody: string;
}

export interface SesEmailSenderProps {
  /**
   * Domain the email is sent from, e.g. 'taplive.tv'.
   */
  readonly domainName: string;

  /**
   * Display name in the From header, e.g. 'TapLive'.
   */
  readonly fromName: string;

  /**
   * Local part of the sender address, e.g. 'noreply-verify'
   * → results in  TapLive <noreply-verify@taplive.tv>
   */
  readonly fromLocalPart: string;

  /**
   * HTML/text template for verification code emails.
   * Placeholders: {{name}} (recipient name), {{code}} (OTP).
   */
  readonly verificationTemplate: VerificationEmailTemplateProps;
}
