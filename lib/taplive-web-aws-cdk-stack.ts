import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { SesDomainIdentity } from './ses-domain-identity';
import { SesEmailSender } from './ses-email-sender';

export class TapliveWebAwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SesDomainIdentity(this, 'TapliveSesIdentity', {
      domainName: 'taplive.tv',
      dkimSigning: true,
      mailFromSubdomain: 'mail',
    });

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
