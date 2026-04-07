import * as cdk from 'aws-cdk-lib/core';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';
import { SesDomainIdentityProps } from '../props/ses-domain-identity-props';

export { SesDomainIdentityProps };

/**
 * Creates an Amazon SES domain identity with Easy DKIM (RSA-2048) enabled.
 *
 * After deployment the stack outputs the three DKIM CNAME records that must
 * be added to the domain's DNS zone so that SES can verify ownership and
 * activate DKIM signing.
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

    // ── Derive optional MAIL FROM domain string ──────────────────────────────
    // EmailIdentityProps.mailFromDomain is a plain string (the full subdomain),
    // and mailFromBehaviorOnMxFailure is a separate flat prop — there is no
    // MailFromDomainOptions wrapper type in the public CDK API.
    const mailFromDomain = props.mailFromSubdomain
      ? `${props.mailFromSubdomain}.${props.domainName}`
      : undefined;

    // ── Create the SES Email Identity ────────────────────────────────────────
    this.emailIdentity = new ses.EmailIdentity(this, 'Identity', {
      identity: ses.Identity.domain(props.domainName),
      dkimSigning,
      dkimIdentity: dkimSigning
        ? ses.DkimIdentity.easyDkim(ses.EasyDkimSigningKeyLength.RSA_2048_BIT)
        : undefined,
      mailFromDomain,
      // Fall back to the SES default MX record if MAIL FROM delivery fails.
      mailFromBehaviorOnMxFailure: mailFromDomain
        ? ses.MailFromBehaviorOnMxFailure.USE_DEFAULT_VALUE
        : undefined,
    });

    // ── Outputs – DKIM CNAME records to add to DNS ───────────────────────────
    if (dkimSigning) {
      // SES generates exactly 3 DKIM CNAME tokens.
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

    // ── Output the identity ARN for cross-stack reference ────────────────────
    new cdk.CfnOutput(this, 'IdentityArn', {
      description: `ARN of the SES identity for ${props.domainName}`,
      value: this.emailIdentity.emailIdentityArn,
      exportName: `${cdk.Stack.of(this).stackName}-SesIdentityArn`,
    });
  }
}
