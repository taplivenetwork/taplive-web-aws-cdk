import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface TapliveAmplifyHostingProps {
  /** Display name in Amplify console (default TapliveWeb). */
  readonly appName?: string;
  /** Git branch to deploy (default main). */
  readonly productionBranchName?: string;
  /** Root domain that matches your Route 53 public zone (e.g. taplive.tv). */
  readonly domainName: string;
  readonly userPool: cognito.IUserPool;
  readonly userPoolClient: cognito.IUserPoolClient;
  /** Backend invoke URL (e.g. API Gateway stage URL). */
  readonly backendApiUrl: string;
  /**
   * HTTPS Git clone URL for the frontend repo (e.g. https://github.com/org/taplive-web-app.git).
   * Omit to connect the repository in the Amplify console after deploy.
   */
  readonly repositoryUrl?: string;
  /**
   * Secrets Manager secret whose **string value** is a GitHub personal access token with repo access.
   * Required when `repositoryUrl` is set.
   */
  readonly githubAccessTokenSecret?: secretsmanager.ISecret;
  /**
   * Amplify artifacts `baseDirectory` (default `.next` for Next.js on Amplify Hosting).
   * Use `out` if the app uses `output: 'export'` only.
   */
  readonly artifactBaseDirectory?: string;
  /**
   * When true (default), associates `domainName` with apex + www in Amplify (Amplify-managed cert).
   * Set false to add the custom domain later in the console.
   */
  readonly enableCustomDomainAssociation?: boolean;
}
