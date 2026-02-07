# Sync protocol docs

After protocol or message changes:

1. List all message types and payloads currently defined in `lib/p2p.ts` (or shared types).
2. Update `documentation/protocol.md` to match (message names, fields, when sent, who sends).
3. Note any call sites that need to handle new or changed messages (game/lobby store or components).

Give a short checklist so the user can verify protocol and docs are in sync.
