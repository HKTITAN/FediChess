---
name: protocol-sync
description: Use when adding or changing P2P message types, payloads, or wire protocol behavior.
---

# Protocol sync

When adding or changing P2P message types, payloads, or wire protocol behavior, follow these steps.

## Steps

1. **Types**: Define or update types in `lib/p2p.ts` (or shared types used by P2P and stores). Ensure message payloads are clearly typed.
2. **Docs**: Update `documentation/protocol.md` to match: message names, fields, when sent, who sends. Keep the doc as the single source of truth for the wire protocol.
3. **Handlers**: Update any handlers in the store or components that send or receive the message (e.g. lobby challenge flow, game event log).
4. **Call sites**: If adding a new message, list all send/recv call sites so the user can verify nothing is missed.

## Backward compatibility

Ask the user if the change should be backward-compatible with existing clients. If so, consider version fields or optional fields and document in `documentation/protocol.md`.

## When to use

Use this skill when the user adds or changes P2P messages, wire protocol behavior, or asks to keep protocol and docs in sync.
