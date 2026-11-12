#!/bin/sh
set -eu
if ! command -v xcrun >/dev/null 2>&1; then
  echo "Safari packaging requires macOS with Xcode installed."
  exit 1
fi
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
mkdir -p "$ROOT/build"
xcrun safari-web-extension-converter "$ROOT/extension" --project-location "$ROOT/build" --app-name Tuck --bundle-identifier com.baderbbh.tuck
printf '\nOpen the generated Xcode project in build/ to run the Safari extension.\n'
