# GTA-2 Lite

Lightweight top-down GTA-2-style browser clone. Single-page HTML5 canvas game with optional nostr-login multiplayer (up to 16 players, shown by their PFP + handle).

## Run

```sh
npm i
node server.js            # http://localhost:8080
PORT=8090 node server.js  # custom port
```

Server serves the game and relays player positions over WebSocket. Play single-player by opening it, or open two tabs to see multiplayer.

## Controls

- WASD walk / drive, Space handbrake
- E enter/exit nearest car (steal any of them)
- Run over pedestrians for score; causes mayhem to build a wanted level; cops chase you
- WASTED at 0 health → respawn

## Nostr login

- With a browser nostr extension (NIP-07, e.g. nos2x / Alby): signs you in, your PFP + handle resolve from kind-0 metadata on a relay and float above you in a badge.
- Without an extension: joins as an anonymous `guest-####`.
- Cap: 16 players; the 17th connection is rejected as `SERVER FULL`.

## Files

- `index.html` — canvas game + client networking + nostr login
- `server.js` — node static server + WebSocket relay + 16-player cap

## Notes / current limits

- Server trusts whatever pubkey/pfp/handle the client claims (NIP-07 proves key ownership in your browser, but there's no server-side signature check yet).
- Positions are client-authored echoes — no server-authoritative collision arbitration between players.
