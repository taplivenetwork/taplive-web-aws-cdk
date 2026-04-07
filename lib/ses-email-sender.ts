import * as cdk from 'aws-cdk-lib/core';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';
import { SesEmailSenderProps } from '../props/ses-email-sender-props';

export { SesEmailSenderProps };

/**
 * Defines the sender address and verification email template for
 * noreply-verify@<domain>. The domain identity (SesDomainIdentity) handles
 * all ownership verification and DKIM signing; this construct owns only the
 * From address and its SES template.
 */
export class SesEmailSender extends Construct {
  /** RFC 5322 From address, e.g. "TapLive <noreply-verify@taplive.tv>" */
  public readonly fromAddress: string;

  /** Name of the SES template to pass to SendTemplatedEmail calls. */
  public readonly templateName: string;

  constructor(scope: Construct, id: string, props: SesEmailSenderProps) {
    super(scope, id);

    this.fromAddress = `${props.fromName} <${props.fromLocalPart}@${props.domainName}>`;
    this.templateName = `${cdk.Stack.of(this).stackName}-VerificationEmail`;

    // ── SES Email Template ───────────────────────────────────────────────────
    new ses.CfnTemplate(this, 'VerificationTemplate', {
      template: {
        templateName: this.templateName,
        subjectPart: props.verificationTemplate.subject,
        htmlPart: props.verificationTemplate.htmlBody,
        textPart: props.verificationTemplate.textBody,
      },
    });

    // ── Stack outputs ────────────────────────────────────────────────────────
    const stackName = cdk.Stack.of(this).stackName;

    new cdk.CfnOutput(this, 'FromAddress', {
      description: 'From address to use when sending verification emails',
      value: this.fromAddress,
      exportName: `${stackName}-SesFromAddress`,
    });

    new cdk.CfnOutput(this, 'TemplateName', {
      description: 'SES template name to pass to SendTemplatedEmail',
      value: this.templateName,
      exportName: `${stackName}-SesVerificationTemplateName`,
    });
  }
}
