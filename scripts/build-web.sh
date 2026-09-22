#!/bin/sh
set -eu

PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PNPM_BIN="${PNPM_BIN:-pnpm}"

cd "$PROJECT_ROOT"
"$PNPM_BIN" install
"$PNPM_BIN" build

TARGET="$PROJECT_ROOT/ios/OiVox/WebApp"
mkdir -p "$TARGET"
find "$TARGET" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -R "$PROJECT_ROOT/dist/." "$TARGET/"
