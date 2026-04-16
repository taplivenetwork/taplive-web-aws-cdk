export interface AmplifyHostingProps {
  /**
   * Friendly Amplify app name shown in AWS Console.
   * @example 'taplive-web-new'
   */
  readonly appName: string;

  /**
   * Git repository URL used by Amplify to fetch source.
   * @example 'https://github.com/taplivenetwork/taplive-web-new'
   */
  readonly repositoryUrl: string;

  /**
   * Source branch to connect and auto-build.
   * @example 'main'
   */
  readonly branchName: string;

  /**
   * Secrets Manager secret name containing GitHub PAT as a plain string.
   * @default 'taplive/github/pat'
   */
  readonly githubTokenSecretName?: string;
}
