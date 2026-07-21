# Contributing to Disscount

Thanks for your interest in improving Disscount! Contributions of every kind are
welcome: bug reports, feature ideas, documentation fixes, and code.

By participating, you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** or **suggest a feature** by opening an
  [issue](https://github.com/OffCrazyFreak/Disscount/issues). Pick the matching
  template and search existing issues first to avoid duplicates.
- **Improve docs, translations, UI/UX, icons, or designs.** These are just as
  valuable as code. Open an issue or PR the same way you would for code.
- **Report a security vulnerability** privately. Do not open a public issue; see
  our [Security Policy](SECURITY.md).

For larger changes, please open an issue to discuss the approach before you
start, so we can agree on direction before you invest the time.

## Development setup

The full local setup (database, backend, frontend, env files) is documented in
the [README](../README.md#how-to-run). Follow it to get the stack running, then
come back here for the contribution workflow.

## Pull request workflow

1. **Fork** the repo and create a branch from `master`:
   - `feat/add-search-by-barcode`, `fix/shopping-list-null-pointer`,
     `docs/update-readme`.
2. **Match the existing style.** Conventions live in
   [`AGENTS.md`](../AGENTS.md): file naming, structure, and per-stack rules.
   - Frontend: TypeScript/React, formatted with Prettier and clean of lint
     errors (`pnpm exec prettier --write .`, then `pnpm exec tsc --noEmit`).
   - Backend: Java 21, existing package structure and formatting.
3. **Verify locally before opening the PR:**
   - Frontend: `cd frontend && pnpm install && pnpm lint`
   - Backend: `cd backend && mvn clean install`
4. **Write clear commits** in imperative mood and reference related issue
   numbers.
5. **Open a PR against `master`** and include:
   - A summary of what changed and why, plus any migration steps.
   - Screenshots or short recordings for UI changes.
   - A link to the related issue.

### Before you request review

- [ ] Code builds and any tests pass locally.
- [ ] Formatting and linting applied.
- [ ] No secrets, credentials, or personal data included.

## Review process

- Maintainers review PRs, may request changes, and merge when ready.
- [CodeRabbit](https://coderabbit.ai) runs automated review on every PR. Please
  address its suggestions before requesting final review, or explain in the PR
  why a suggestion does not apply.
- Please stay responsive to review comments. Small follow-ups are normal.

Thank you for helping improve Disscount. Every contribution counts!
