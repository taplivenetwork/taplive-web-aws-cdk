import * as route53 from 'aws-cdk-lib/aws-route53';

export interface SesDomainIdentityProps {
  /**
   * The domain name to register as an SES identity.
   * @example 'taplive.tv'
   */
  readonly domainName: string;

  /**
   * Whether to enable DKIM signing for outbound emails.
   * @default true
   */
  readonly dkimSigning?: boolean;

  /**
   * Optional: custom MAIL FROM subdomain (e.g. 'mail' → mail.taplive.tv).
   * Improves deliverability by aligning the envelope sender with the domain.
   */
  readonly mailFromSubdomain?: string;

  /**
   * Optional: Route 53 public hosted zone for the domain.
   * When provided, CDK automatically creates all required DNS records:
   *  - 3 DKIM CNAME records
   *  - MAIL FROM MX record
   *  - MAIL FROM SPF TXT record
   * When omitted, DNS records are emitted as stack outputs for manual entry.
   */
  readonly hostedZone?: route53.IPublicHostedZone;
}
