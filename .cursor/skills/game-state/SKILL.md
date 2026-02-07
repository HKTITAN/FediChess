---
name: game-state
description: Use when changing how game or lobby state is stored, updated, or derived.
---

# Game state

State lives in `lib/store.ts` (Zustand). Game state is synced via the P2P event log; see `documentation/architecture.md` for data flow.

## When changing state shape or events

1. **Store slice**: Update the relevant slice in `lib/store.ts` (user, lobby, game, UI). Keep selectors and actions consistent.
2. **Event log**: Game state (FEN, move history, result) is derived from the shared event log. When changing events: update the types (e.g. in `lib/p2p.ts`), the code that emits events, and the code that applies them (replay) so all peers stay in sync.
3. **Call sites**: Update any components or hooks that read or write the changed state. Ensure lobby and game pages still get the data they need.

Keep FEN and move history derivable from the event log where applicable so spectators and late joiners see the same state.

## When to use

Use this skill when the user asks to change how game or lobby state is stored, updated, or derived (e.g. new fields, new events, different replay logic).
