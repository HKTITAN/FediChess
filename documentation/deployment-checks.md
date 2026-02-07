# Deployment checks

FediChess uses **GitHub Actions** to run CI (lint + build) on every push and pull request. You can require this check to pass before Vercel promotes a deployment to **Production**, so only green builds go live.

## What runs in CI

The workflow [.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on:

- **Push** to `main` or `master`
- **Pull request** targeting `main` or `master`

Steps:

1. Checkout the repository
2. Set up Node.js 20 (with npm cache)
3. `npm ci` — install dependencies
4. `npm run lint` — ESLint (Next.js config)
5. `npm run build` — production Next.js build (static export)

If any step fails, the workflow fails. Fix the branch and push again.

## Enabling deployment checks in Vercel

1. Open your Vercel project (e.g. [Vercel Dashboard](https://vercel.com/dashboard) → your FediChess project).
2. Go to **Settings** → **Git** → **Deployment Checks** (or [Build & Deployment](https://vercel.com/khemani/fedichess/settings/build-and-deployment#deployment-checks) for this project).
3. Under **Deployment Checks**, enable **Require checks to pass before deploying** (or equivalent).
4. Add the check named **CI** (or the exact workflow name: **Build and lint**).  
   Vercel lists available checks from your GitHub repo; select the one that corresponds to `.github/workflows/ci.yml`.
5. Save.

After this, when you push to the production branch (e.g. `main`), Vercel will:

- Start a deployment.
- Wait for the **CI** workflow to complete.
- Promote to Production only if CI succeeds. If CI fails, the deployment stays in a non-production state (e.g. preview or blocked).

## Verifying locally before push

To avoid failing CI after a push, run the same steps locally:

```bash
npm ci
npm run lint
npm run build
```

Use the same Node version as CI (20) if possible (e.g. `nvm use` with `.nvmrc`).

## Troubleshooting

- **Check not appearing in Vercel:** Ensure the workflow file is on the default branch and has run at least once (e.g. push a commit or open a PR).
- **CI passes but Vercel build fails:** Vercel runs its own build; CI only mirrors it. Check Vercel build logs and environment (e.g. Node version, env vars).
- **Branch name:** If your default branch is `master` instead of `main`, the workflow already runs on both; no change needed.
