import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Route53HostedZone } from './route53-hosted-zone';
import { SesDomainIdentity } from './ses-domain-identity';
import { SesEmailSender } from './ses-email-sender';

export class TapliveWebAwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Route 53 hosted zone ─────────────────────────────────────────────────
    // After first deploy, copy the 4 NS values from stack outputs and paste
    // them as name servers in your domain registrar. One-time step.
    const dns = new Route53HostedZone(this, 'TapliveHostedZone', {
      zoneName: 'taplive.tv',
    });

    // ── SES domain identity ──────────────────────────────────────────────────
    // Passing the hosted zone lets CDK auto-create all DNS records:
    // DKIM CNAMEs, MAIL FROM MX record, MAIL FROM SPF TXT record.
    new SesDomainIdentity(this, 'TapliveSesIdentity', {
      domainName: 'taplive.tv',
      dkimSigning: true,
      mailFromSubdomain: 'mail',
      hostedZone: dns.hostedZone,
    });

    // ── Verification email sender ────────────────────────────────────────────
    new SesEmailSender(this, 'TapliveVerifySender', {
      domainName: 'taplive.tv',
      fromName: 'TapLive',
      fromLocalPart: 'noreply-verify',
      verificationTemplate: {
        subject: 'Your TapLive verification code is {{code}}',
        htmlBody: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2>Verify your TapLive account</h2>
            <p>Hi {{name}},</p>
            <p>Use the code below to complete your sign-up. It expires in 10 minutes.</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">
              {{code}}
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
        textBody: 'Hi {{name}}, your TapLive verification code is {{code}}. It expires in 10 minutes.',
      },
    });
  }
}
