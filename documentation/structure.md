# Repository structure

High-level layout of the FediChess codebase.

## Root layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router: pages (home, lobby, game, local, settings), layout, globals. |
| `components/` | React components: game (board, chat, timer, move history), landing, ui, theme-provider, error-boundary. |
| `lib/` | Core logic: P2P (p2p.ts, ble-transport.ts, transport-types.ts), chess-engine, store, elo, pgn, constants, account-backup, clipboard. |
| `documentation/` | Docs index, architecture, protocol, SDK guide, ranking API, releases, repo description. |
| `scripts/` | Build/release helpers (e.g. changelog-for-version.cjs). |
| `sdks/` | Multi-language SDKs and shared bridge (see below). |
| `.github/` | GitHub Actions (e.g. release workflow). |
| `public/` | Static assets, manifest. |
| `types/` | TypeScript declarations (e.g. Web Bluetooth). |

Config at root: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vercel.json`, `netlify.toml`, `render.yaml`, `.nvmrc`, `.eslintrc.json`, `.gitignore`.

## sdks/

| Path | Purpose |
|------|---------|
| `bridge/` | Node/TypeScript stdio bridge. Runs Trystero (same app ID and rooms as the web app); speaks JSON lines so Python, Rust, and C++ clients can join lobby/game and send/receive protocol messages. |
| `python/` | Python package (`fedichess`) and example (lobby + heartbeat + peers + optional challenge). |
| `rust/` | Rust crate (`fedichess-sdk`) and example (same flow). |
| `cpp/` | C++ client (CMake, nlohmann/json) and example (same flow). |

See [sdks/README.md](../sdks/README.md) for quick start and [sdk-guide.md](sdk-guide.md) for the protocol and JS/TS reference.

## Conventions

- **App and lib:** TypeScript; path alias `@/`; see [.cursor/rules/conventions.mdc](../.cursor/rules/conventions.mdc).
- **SDKs:** Each language follows its own norms (pyproject.toml, Cargo.toml, CMake). Protocol is the single source of truth: [protocol.md](protocol.md).
