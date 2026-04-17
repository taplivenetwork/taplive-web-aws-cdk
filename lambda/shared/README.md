# Shared Lambda Packages Guide

This folder contains shared local packages for Lambda features. Shared packages expose reusable functionality that can be imported by multiple Lambda packages.

## Purpose

- Provide a safe place for reusable helpers.
- Avoid duplicating common logic across Lambda feature folders.
- Keep shared code independent from feature-specific code.

## Current shared packages

- `lambda/shared/aws` — AWS integration helpers, such as the Secret Manager wrapper.
- `lambda/shared/db` — PostgreSQL client factory and DB connection helpers.

## Database pooling and `@shared/db`

The `@shared/db` package provides a pooled, cached PostgreSQL client factory and convenience helpers so Lambda functions reuse connections across warm invocations. This avoids creating a new `pg.Client` per request which does not scale for serverless workloads.

- Public helpers (examples):
  - `getDbPool(credentials)` — returns a cached `pg.Pool` for the given connection info.
  - `queryWithCredentials(credentials, text, params?)` — runs a single query using the pooled connections.
  - `closeAllPools()` — closes all cached pools (can be useful for shutdown).

Example usage in a repository file:

```ts
import { queryWithCredentials } from "@shared/db";

await queryWithCredentials(dbCredentials, `INSERT INTO users ...`, [params]);
```

Guidance:

- Do NOT create a new `pg.Client` per Lambda invocation (no `client.connect()` / `client.end()` inside handler code).
- Use the pooled helpers above so warm Lambda containers share a small pool of connections.
- Later if we want to make this even more scalable in production we can add an RDS proxy layer.


## Shared package structure

Each shared package should follow this structure:

```
lambda/shared/<package-name>/
  package.json
  tsconfig.json
  src/
    index.ts
    ...other implementation files...
```

### Minimal shared package content

- `package.json`
  - Must define `name` as `@shared/<package-name>`.
  - Should be `private: true`.
  - Should point `main` and `types` to `src/index.ts`.
- `tsconfig.json`
  - Should extend the repo root `tsconfig.json`.
  - Should set `rootDir` to `src` and `outDir` to `dist` (if build artifacts are used).
- `src/index.ts`
  - Should export the package public surface.

## How to create a new shared package

1. Create a new folder in `lambda/shared/<package-name>`.
2. Add a `package.json` like:

```json
{
  "name": "@shared/<package-name>",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {}
}
```

3. Create `tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"]
}
```

4. Create `src/index.ts` and any supporting modules.
5. Export shared helpers from `src/index.ts`.
6. Use the package from Lambda feature code with:

```ts
import { someHelper } from "@shared/<package-name>";
```

## Shared module guidelines

- Only add code to shared packages if it will be imported by more than one Lambda feature.
- Keep shared API stable and small.
- Avoid feature-specific imports inside `lambda/shared/*`.
- Keep shared packages independent and easy to move.

## Example shared modules

- `@shared/logger` — structured logging utilities, log context helpers.
- `@shared/validation` — reusable input validation and schema helpers.
- `@shared/notifications` — email and SMS notification helpers.
- `@shared/metrics` — telemetry, metrics counters, and tracing helpers.
- `@shared/config` — shared configuration parsing and environment helpers.

## How to use shared packages in Lambda features

1. Add the shared package to the Lambda package dependencies using local linking:

```json
"dependencies": {
  "@shared/db": "file:../../shared/db",
  "@shared/aws": "file:../../shared/aws"
}
```
When moving to single repo approach later these will be converted into an internal npm package.

2. Import from the package name:

```ts
import { getSecret } from "@shared/aws";
import { getDbClient } from "@shared/db";
```

3. Keep shared imports focused on generic utilities, not feature-specific concerns.

## When not to create a shared package

- If code is only used by one Lambda feature.
- If the code is tightly coupled to a single business flow.
- If the code is a one-off helper for a single feature.

Use feature folders for feature-specific code and shared packages only for shared reusable modules.
