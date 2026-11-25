#!/bin/sh
set -eu

PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PNPM_BIN="${PNPM_BIN:-pnpm}"

cd "$PROJECT_ROOT"
"$PNPM_BIN" install
"$PNPM_BIN" build

ENCRYPTED_TARGET="$PROJECT_ROOT/ios/OiVox/vocalAtlasPhrasePairPulseEarthDialectSync.bundle"
sh "$PROJECT_ROOT/scripts/package-webapp.sh" "$PROJECT_ROOT/dist" "$ENCRYPTED_TARGET"

SHOWING_SOURCE="$PROJECT_ROOT/ios/OiVox/VivoxsoundKeep"
SHOWING_ARCHIVE="$PROJECT_ROOT/ios/OiVox/OivoxShowing/meadow-resources.bundle"
if [ -d "$SHOWING_SOURCE" ]; then
  sh "$PROJECT_ROOT/scripts/package-webapp.sh" "$SHOWING_SOURCE" "$SHOWING_ARCHIVE" vivox
elif [ ! -f "$SHOWING_ARCHIVE" ]; then
  printf '%s\n' 'Missing meadow-resources.bundle. Package VivoxsoundKeep before building.' >&2
  exit 1
fi
