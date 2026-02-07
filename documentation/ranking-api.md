# Voluntary ranking API

This document describes a minimal API for a **voluntary** central ranking service. Clients can submit game results (with user consent) to participate in a global leaderboard. The service is optional; the app works fully without it.

## Purpose

- **Local ELO** remains the source of truth on device. The ranking API is an optional way to aggregate results across clients and display a public leaderboard (by ELO, games played, etc.).
- Anyone can run a compatible ranking server (open source). The app can be configured to point to a specific ranking URL or to disable submission.

## Submit result (POST)

**Endpoint**: `POST /api/rank` (or similar; server-defined base URL)

**Request body** (JSON):

```json
{
  "gameId": "uuid",
  "whiteUsername": "string",
  "blackUsername": "string",
  "whiteEloBefore": 1200,
  "blackEloBefore": 1200,
  "result": "1-0",
  "pgn": "optional PGN string",
  "timestamp": 1234567890123
}
```

- `result`: `"1-0"` (white wins), `"0-1"` (black wins), `"1/2-1/2"` (draw).
- `timestamp`: Unix ms when the game ended (for deduplication / ordering).

**Response**: `200 OK` with optional body (e.g. `{ "ok": true }`) or `4xx/5xx` on error.

**Privacy**: Servers should not log or store more than needed for the leaderboard (e.g. usernames and ELO). PGN is optional and may be omitted for privacy.

## Leaderboard (GET)

**Endpoint**: `GET /api/leaderboard` (or similar)

**Query params** (optional): `limit`, `offset`, `sort=elo|games`.

**Response**: JSON array of entries, e.g.:

```json
[
  { "username": "HKTITAN", "elo": 1450, "gamesPlayed": 42, "wins": 22, "losses": 12, "draws": 8 },
  ...
]
```

## Implementation notes

- **Reference server**: A minimal open-source implementation (e.g. Next.js API routes or serverless functions) can accept POST and serve GET leaderboard from a database or in-memory store. Can be in-repo or a separate repo.
- **Federated ranking**: The same payload format can be used so multiple instances report to one service, or so instances exchange anonymized results for a federated ELO. Implementation is up to the server.
- **App integration**: The web app can have an optional "Submit to global ranking" checkbox (or setting) and a "View leaderboard" link that opens the ranking server’s leaderboard URL. If no ranking URL is configured, the feature is hidden.
