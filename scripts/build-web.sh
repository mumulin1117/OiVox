#!/bin/sh
set -eu

PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PNPM_BIN="${PNPM_BIN:-pnpm}"

cd "$PROJECT_ROOT"
"$PNPM_BIN" install
"$PNPM_BIN" build

ENCRYPTED_TARGET="$PROJECT_ROOT/ios/OiVox/vocalAtlasPhrasePairPulseEarthDialectSync.bundle"
swift "$PROJECT_ROOT/scripts/package-webapp.swift" "$PROJECT_ROOT/dist" "$ENCRYPTED_TARGET"
