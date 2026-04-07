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
}
