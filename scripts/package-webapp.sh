#!/bin/sh
set -eu
PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/oivox-package.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM
xcrun --sdk macosx swiftc -sdk "$(xcrun --sdk macosx --show-sdk-path)" \
  -swift-version 6 -module-cache-path "$WORK/modules" \
  "$PROJECT_ROOT/ios/OiVox/vocalAtlasPhrasePairPulseEarthDialectSync.swift" \
  "$PROJECT_ROOT/ios/OiVox/OivoxShowing/VivoxsoundKeep.swift" \
  "$PROJECT_ROOT/scripts/package-webapp.swift" -o "$WORK/package-webapp"
"$WORK/package-webapp" "$@"
