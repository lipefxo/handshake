# GitHub CI/CD Rollout

GitHub Actions is the merge gate for this repo. Vercel remains the canonical deploy builder for preview and production artifacts.

## Required Secrets

No real Supabase secrets are required for CI, Playwright smoke tests, or Lighthouse. Workflows use placeholder values:

- `VITE_SUPABASE_URL=https://placeholder.supabase.co`
- `VITE_SUPABASE_ANON_KEY=placeholder-key`
- `VITE_AGENTATION_ALLOWED_EMAIL=ci@example.test`

## Stage 1: Land Workflows

Merge the workflow files after a PR run is green:

- `CI / Lint, Test, And Build`
- `Security / Dependency Review Advisory`
- `Security / Direct Dependency Audit`
- `Security / CodeQL`
- `Security / Supabase Edge Functions`
- `Performance / Lighthouse CI`

Do not require the checks before the first green run exists on GitHub.

## Stage 2: Enable Repository Settings

After the first green run:

- Enable Dependency graph at `Settings > Code security and analysis > Dependency graph`.
- Enable branch protection on `main`.
- Require the CI, direct audit, CodeQL, Supabase function, and performance checks listed above.
- After Dependency graph is enabled and `Dependency Review Advisory` succeeds, remove `continue-on-error` from that workflow step and make dependency review required.
- Require branches to be up to date before merging.
- Enable Dependabot alerts and Dependabot security updates.
- Enable secret scanning and push protection where available.

Vercel checks may stay enabled as deploy validation, but the production artifact continues to come from Vercel, not GitHub Actions.
