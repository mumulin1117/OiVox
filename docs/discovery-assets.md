# OiVox discovery fixture assets

These assets support the local review/demo dataset in `src/data/discoveryFixtures.js`.
They do not represent real OiVox members, real online activity, or live user-generated
content.

## Avatars

- Source: DiceBear HTTP API, Lorelei style
- Upstream: https://www.dicebear.com/styles/lorelei/
- License: CC0 1.0
- Files: `public/assets/discovery/avatars/*.svg`
- Notes: Generated from stable `oivox-<fixture-name>` seeds and downloaded into the
  project. The production app never depends on the remote API at runtime.

## Flags

- Source: lipis/flag-icons 7.3.2
- Upstream: https://github.com/lipis/flag-icons
- License: MIT
- Files: `public/assets/discovery/flags/*.svg`
- License copy: `public/assets/discovery/licenses/flag-icons-MIT.txt`
- Notes: Flags are secondary country visuals. Country names and ISO codes remain the
  accessible semantic labels; flags are not used as the only language indicator.

## Voice clips

- Source: locally generated with macOS system speech voices
- Files: `public/assets/discovery/audio/*.wav`
- Format: mono, 22.05 kHz, signed 16-bit PCM WAV
- Duration: approximately 3.0–6.1 seconds, never longer than seven seconds
- Notes: These clips are synthetic fixtures. They are not recordings of the people
  depicted by the avatar illustrations and must not be presented as live service data.

## Runtime paths

All runtime paths begin with `./assets/discovery/`. Vite copies the complete `public`
tree into `dist`, and `scripts/build-web.sh` then copies `dist` into
`ios/OiVox/WebApp`, so WKWebView loads every asset from the application bundle.

