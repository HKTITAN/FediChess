---
name: docs-sync
description: Check that documentation matches the code and suggest updates.
---

Given the list of files that changed (or the whole repo if not specified), identify docs that might be stale: especially `documentation/protocol.md` (message types, payloads), `documentation/architecture.md` (data flow, stack), `documentation/sdk-guide.md` (API or usage). For each, list what in the doc might need updating and where in the code the truth lives. Return a short checklist; do not edit files unless the user asked for it.
