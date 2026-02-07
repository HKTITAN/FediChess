# Releases

How to cut a FediChess release and publish it on GitHub.

## Checklist

1. **Update CHANGELOG** — Move items from `[Unreleased]` into a new version section (e.g. `[0.4.0] - YYYY-MM-DD`). Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
2. **Bump version** — Set the new version in `package.json` (`version` field).
3. **Docs-sync** — Ensure [protocol.md](protocol.md), [architecture.md](architecture.md), and [sdk-guide.md](sdk-guide.md) match the code (see [CONTRIBUTING](../CONTRIBUTING.md#docs-sync-checklist-when-changing-protocol-or-p2p)).
4. **Commit and tag** — Commit the version bump and CHANGELOG, then create an annotated tag:
   ```bash
   git add CHANGELOG.md package.json
   git commit -m "chore: release v0.4.0"
   git tag -a v0.4.0 -m "Release v0.4.0"
   git push origin main --tags
   ```
5. **GitHub Release** — Either create the release manually or let the workflow do it:
   - **Manual:** GitHub → Releases → Draft a new release → choose tag `v0.4.0` → paste the version section from CHANGELOG as the description → Publish.
   - **Automated:** Pushing the tag triggers the [release workflow](../.github/workflows/release.yml), which builds the app and creates a GitHub Release with notes from CHANGELOG.

## Tag-triggered workflow

When you push a tag matching `v*` (e.g. `v0.3.0`, `v0.4.0`), the workflow:

1. Checks out the repo and sets up Node.
2. Installs dependencies and runs `npm run build` to verify the build.
3. Creates a GitHub Release for that tag with the release notes taken from the corresponding section of CHANGELOG.md.

Ensure the tag points to the commit that contains the CHANGELOG and version bump for that release.
