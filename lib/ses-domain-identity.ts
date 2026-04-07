import * as cdk from 'aws-cdk-lib/core';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';
import { SesDomainIdentityProps } from '../props/ses-domain-identity-props';

export { SesDomainIdentityProps };

/**
 * Creates an Amazon SES domain identity with Easy DKIM (RSA-2048) enabled.
 *
 * When a Route 53 hostedZone is provided, CDK automatically creates all
 * required DNS records (DKIM CNAMEs, MAIL FROM MX, MAIL FROM SPF).
 *
 * Without a hosted zone, the DKIM record values are emitted as stack outputs
 * for manual entry in your DNS provider.
 */
export class SesDomainIdentity extends Construct {
  /** The underlying CDK EmailIdentity resource. */
  public readonly emailIdentity: ses.EmailIdentity;

  /** The verified domain name (mirrors props.domainName for convenience). */
  public readonly domainName: string;

  constructor(scope: Construct, id: string, props: SesDomainIdentityProps) {
    super(scope, id);

    this.domainName = props.domainName;
    const dkimSigning = props.dkimSigning ?? true;

    const mailFromDomain = props.mailFromSubdomain
      ? `${props.mailFromSubdomain}.${props.domainName}`
      : undefined;

    // ── SES identity — use publicHostedZone when available so CDK auto-creates
    // all DNS records; fall back to plain domain for manual DNS setup. ─────────
    const identity = props.hostedZone
      ? ses.Identity.publicHostedZone(props.hostedZone)
      : ses.Identity.domain(props.domainName);

    this.emailIdentity = new ses.EmailIdentity(this, 'Identity', {
      identity,
      dkimSigning,
      dkimIdentity: dkimSigning
        ? ses.DkimIdentity.easyDkim(ses.EasyDkimSigningKeyLength.RSA_2048_BIT)
        : undefined,
      mailFromDomain,
      mailFromBehaviorOnMxFailure: mailFromDomain
        ? ses.MailFromBehaviorOnMxFailure.USE_DEFAULT_VALUE
        : undefined,
    });

    // ── Manual DNS outputs (only needed when Route 53 is not wired in) ────────
    if (dkimSigning && !props.hostedZone) {
      [0, 1, 2].forEach((i) => {
        new cdk.CfnOutput(this, `DkimRecord${i + 1}Name`, {
          description: `DKIM CNAME record ${i + 1} – NAME (add to DNS)`,
          value: this.emailIdentity.dkimRecords[i].name,
          exportName: `${cdk.Stack.of(this).stackName}-DkimRecord${i + 1}Name`,
        });

        new cdk.CfnOutput(this, `DkimRecord${i + 1}Value`, {
          description: `DKIM CNAME record ${i + 1} – VALUE (add to DNS)`,
          value: this.emailIdentity.dkimRecords[i].value,
          exportName: `${cdk.Stack.of(this).stackName}-DkimRecord${i + 1}Value`,
        });
      });
    }

    // ── Identity ARN — always output for cross-stack reference ────────────────
    new cdk.CfnOutput(this, 'IdentityArn', {
      description: `ARN of the SES identity for ${props.domainName}`,
      value: this.emailIdentity.emailIdentityArn,
      exportName: `${cdk.Stack.of(this).stackName}-SesIdentityArn`,
    });
  }
}
