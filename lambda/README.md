# Lambda Development Guide

This folder contains all feature-specific Lambda functions and shared libraries used by those Lambdas.

## Purpose

- Keep feature Lambda code isolated inside `lambda/user/<feature>`.
- Keep reusable utilities in `lambda/shared/<module>`, check [Shared Modules](./shared/README.md).
- Only share code that is truly reusable across multiple Lambda features.

## Folder structure

```
lambda/
  shared/
    aws/
    db/
  user/
    post-confirmation/
      handler.ts
      service.ts
      repository.ts
      package.json
      tsconfig.json
  <scope>/
    <feature-name>/
      handler.ts
      service.ts
      repository.ts
      package.json
      tsconfig.json

```

## How to add a new Lambda feature

1. Create a new folder under `lambda/<scope>/<feature-name>`.
2. Add a `package.json` and `tsconfig.json`.
3. Add the following minimum files:
   - `handler.ts` — Lambda event adapter and entry point.
   - `service.ts` — business workflow and orchestration.
   - `repository.ts` — persistence and data-layer logic.

### Recommended file layout

- `handler.ts`
  - Extracts event payload values.
  - Calls service functions.
  - Returns the Lambda response.
- `service.ts`
  - Contains feature-specific use case logic.
  - Handles secrets, validation, and coordination.
- `repository.ts`
  - Contains database queries or external persistence actions.
  - Uses shared helpers for database clients or other shared resources.

#### Database access guidance

- Prefer the pooled helpers in `@shared/db` rather than creating a new `pg.Client` per invocation. The shared package exposes helpers like `queryWithCredentials()` and `getDbPool()` so Lambdas reuse connections across warm containers.
- Fetch DB credentials via `@shared/aws` (Secrets Manager) and pass them to the shared DB helpers; do not inline raw credentials in code.
- Example repository pattern:

```ts
import { getSecret } from "@shared/aws";
import { queryWithCredentials } from "@shared/db";

const creds = await getSecret("/myapp/db/credentials");
await queryWithCredentials(creds, `INSERT INTO users (...) VALUES (...)`, [params]);
```

### Example `package.json`

```json
{
  "name": "<feature-name>",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@shared/db": "file:../../shared/db",
    "@shared/aws": "file:../../shared/aws"
  }
}
```

> Use the existing `file:` references to `lambda/shared/<module>` for local package linking in this repo.

## Shared module usage rules

- Use `@shared/*` only for utilities that are reused across more than one Lambda feature.
- Do not put feature-specific business logic into shared packages.
- Keep shared packages small, focused, and stable.

Examples of appropriate shared modules:

- `@shared/aws` — AWS helpers, secrets manager wrappers, client init logic.
- `@shared/db` — database client factories and common database helpers.
- `@shared/logger` — structured logging utilities.
- `@shared/notifications` — reusable notification or email helpers.
- `@shared/validation` — common validation schemas and helpers.

Examples of inappropriate shared code:

- `post-confirmation` Cognito-specific logic.
- A single Lambda feature's custom business rules.
- One-off query shapes used only by one feature.

## Best practices

- Keep `handler.ts` thin.
- Keep feature-specific state and workflow in `service.ts`.
- Keep persistence in `repository.ts`.
- Import shared modules by package name, not relative paths.
- Do not create nested shared modules under `<scope>/`.

## Building and testing

- Run `npm install` from repo root.
- Each Lambda package can be built with `npm run build` from its folder.
- Use the existing root workspace to resolve shared packages.
