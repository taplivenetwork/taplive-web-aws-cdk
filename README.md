# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

 **Do not use this command to directly deploy to AWS. Only github workflow should be used to deploy to AWS.**

* `npx cdk deploy`  deploy this stack to your default AWS account/region

## Backend API foundations (sub-issue 0.3)

This stack now includes a reusable backend foundation construct that provisions:

- API Gateway REST API (`v1` stage) with CORS enabled
- API Gateway gateway responses for default 4xx/5xx and unauthorized errors
- Shared base Lambda execution role (CloudWatch Logs + RDS + Secrets Manager read)
- Secrets Manager secret placeholder for DB and third-party credentials
- Health check Lambda exposed at `GET /v1/health`
- CloudWatch Log Group for the health Lambda

### REST API naming conventions

- Use stage for major API versioning (for now: `/v1`)
- Use lowercase noun resources (example: `/health`, `/users`, `/sessions`)
- Use HTTP methods for action semantics (`GET`, `POST`, `PATCH`, `DELETE`)
- Keep endpoints resource-oriented and avoid verb-style paths

## Amplify hosting (frontend)

This stack provisions an Amplify app connected to:

- Repo: `https://github.com/taplivenetwork/taplive-web-new`
- Branch: `main` (auto-build enabled)

Before deploying, create a Secrets Manager secret containing a GitHub PAT with repo access:

- Default secret name expected by CDK: `taplive/github/pat`
- Optional override at deploy time: `-c amplifyGithubTokenSecretName=<your-secret-name>`
