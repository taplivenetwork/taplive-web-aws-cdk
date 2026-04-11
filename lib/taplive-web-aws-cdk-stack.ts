import * as cdk from 'aws-cdk-lib/core';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { Route53HostedZone } from './route53-hosted-zone';
import { SesDomainIdentity } from './ses-domain-identity';
import { SesEmailSender } from './ses-email-sender';
import { BackendApiFoundation } from './backend-api-foundation';
import { CognitoUserAuth } from './cognito-user-auth';
import { TapliveAmplifyHosting } from './taplive-amplify-hosting';

/** Default frontend repo; production branch is `main` (see TapliveAmplifyHosting). */
const DEFAULT_TAPLIVE_WEB_REPOSITORY_URL = 'https://github.com/taplivenetwork/taplive-web-new.git';

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

    // ── Cognito user auth ─────────────────────────────────────────────────────
    // Sign-up flow: SignUp -> email code sent by Cognito -> ConfirmSignUp.
    const cognitoAuth = new CognitoUserAuth(this, 'TapliveCognitoAuth', {
      userPoolName: 'TapliveUsers',
      userPoolClientName: 'TapliveWebClient',
      verificationEmailSubject: 'Your TapLive verification code',
      verificationEmailBody: 'Use this code to verify your TapLive account: {####}',
    });

    // ── Backend API foundation ───────────────────────────────────────────────
    const backend = new BackendApiFoundation(this, 'TapliveBackendApiFoundation', {
      apiName: 'TapliveBackendApi',
      corsAllowedOrigins: ['*'],
    });

    // ── Amplify Hosting (frontend) ───────────────────────────────────────────
    // Default repo: taplivenetwork/taplive-web-new (branch main). Repository URL is passed to
    // Amplify only when amplifyGitHubTokenSecretArn is set (PAT in Secrets Manager); otherwise
    // connect the same repo in the Amplify console after deploy.
    //   cdk deploy -c amplifyGitHubTokenSecretArn=arn:aws:secretsmanager:...
    // Optional override: -c amplifyRepositoryUrl=https://github.com/other/repo.git
    const amplifyRepoOverride = this.node.tryGetContext('amplifyRepositoryUrl') as string | undefined;
    const amplifyTokenArn = this.node.tryGetContext('amplifyGitHubTokenSecretArn') as string | undefined;
    const amplifyGithubToken =
      amplifyTokenArn !== undefined && amplifyTokenArn !== ''
        ? secretsmanager.Secret.fromSecretCompleteArn(this, 'AmplifyGitHubToken', amplifyTokenArn)
        : undefined;

    const amplifyRepositoryUrl =
      amplifyGithubToken !== undefined
        ? (amplifyRepoOverride?.trim() || DEFAULT_TAPLIVE_WEB_REPOSITORY_URL)
        : undefined;

    const amplifyCustomDomainRaw = this.node.tryGetContext('amplifyEnableCustomDomain');
    const amplifyEnableCustomDomain =
      amplifyCustomDomainRaw !== false && amplifyCustomDomainRaw !== 'false';

    new TapliveAmplifyHosting(this, 'TapliveAmplifyHosting', {
      appName: 'TapliveWeb',
      domainName: 'taplive.tv',
      productionBranchName: 'main',
      userPool: cognitoAuth.userPool,
      userPoolClient: cognitoAuth.userPoolClient,
      backendApiUrl: backend.restApi.url,
      repositoryUrl: amplifyRepositoryUrl,
      githubAccessTokenSecret: amplifyGithubToken,
      enableCustomDomainAssociation: amplifyEnableCustomDomain,
    });
  }
}
