# Contributing to FediChess

Thanks for your interest in contributing.

## How to contribute

- **Bug reports and feature ideas**: Open a [GitHub Issue](https://github.com/HKTITAN/fedichess/issues).
- **Code changes**: Open a Pull Request. Keep PRs focused; run `npm run lint` before submitting.
- **Documentation**: Improvements to [documentation/](documentation/) and README are welcome.
- **Protocol and SDKs**: The [protocol](documentation/protocol.md) is the source of truth. SDKs for Python, Rust, and C++ live in [sdks/](sdks/) and use the shared Node bridge; new languages can follow the same pattern. Community clients can be listed in the README.

### Docs-sync checklist (when changing protocol or P2P)

After changing message types, payloads, room behavior, or transports, check that these stay in sync:

- **protocol.md** — action names, payload shapes, BLE UUIDs and message format.
- **architecture.md** — Room interface, WebRTC/BLE flow, stability and cleanup.
- **sdk-guide.md** — official JS/TS entry points, BLE flow, action list.

See `.cursor/agents/docs-sync.md` for a verification flow. When cutting a release, update CHANGELOG and tag; see [documentation/releases.md](documentation/releases.md) (if present) or the GitHub Releases section in the README.

## Development

```bash
npm install
npm run dev
```

Use two browser tabs (or share the lobby link) to test P2P flow. See [README](README.md) for test steps.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
