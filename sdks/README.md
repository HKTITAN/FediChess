# FediChess SDKs (Python, Rust, C++)

Multi-language SDKs for FediChess. Each SDK talks to a shared **Node.js bridge** that handles WebRTC and WebTorrent trackers; the bridge speaks JSON over stdio so any language can join lobby/game rooms and send or receive protocol messages.

## Prerequisites

- **Node.js** 18+ (for the bridge)
- **Python** 3.9+ (Python SDK), **Rust** (Rust SDK), or **C++14** + CMake (C++ SDK)

## Quick start

1. **Build the bridge** (required for all SDKs):

   ```bash
   cd sdks/bridge
   npm install
   npm run build
   ```

2. **Run an example**:

   | Language | Path | Example command |
   |----------|------|-----------------|
   | Python   | [sdks/python/](python/)   | `cd sdks/python && pip install -e . && python -m fedichess.examples.lobby_and_challenge` |
   | Rust     | [sdks/rust/](rust/)       | `cd sdks/rust && cargo run --example lobby_and_challenge` |
   | C++      | [sdks/cpp/](cpp/)         | `cd sdks/cpp/build && cmake .. && make && ./lobby_and_challenge` |

   See each SDK’s README for install and run details.

## Layout

| Directory | Description |
|-----------|-------------|
| [bridge/](bridge/) | Node/TypeScript stdio bridge (Trystero, same app ID and rooms as the web app). |
| [python/](python/) | Python client package + example. |
| [rust/](rust/)     | Rust crate + example. |
| [cpp/](cpp/)       | C++ client + example (CMake, nlohmann/json). |

## Protocol

The bridge and all SDKs use the same [wire protocol](../documentation/protocol.md). For building JS/TS clients without the bridge, see the [SDK guide](../documentation/sdk-guide.md).
