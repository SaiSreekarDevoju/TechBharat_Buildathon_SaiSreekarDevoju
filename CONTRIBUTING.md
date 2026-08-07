# Contributing to Lumen

Thank you for contributing to Lumen!

## Development Workflow

1. Clone the repository.
2. Run `npm install` to install workspace dependencies.
3. Make changes in `packages/shared`, `apps/extension`, `apps/server`, or `apps/landing`.
4. Run `npm run typecheck` and `npm run test` before submitting pull requests.

## Architecture Guidelines

- Enforce TypeScript strict mode without using `any`.
- Keep Chrome extension MV3 permissions minimal.
- Do not log or expose API keys or captured user text in standard output logs.
