# Debug P2P

When connection or messaging issues are reported:

1. Check `lib/p2p.ts` and how the game/lobby use it (rooms, peer id, send/receive).
2. Check `documentation/protocol.md` for the expected flow (discovery, challenge, game messages, event log).
3. Suggest where to add logs or what to verify (e.g. room id, peer id, message ordering, histSync on join).

Return concrete debugging steps and, if helpful, example log points or assertions.
