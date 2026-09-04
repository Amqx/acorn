#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/.."

SCHEME="Acorn"
CONFIGURATION="${CONFIGURATION:-Release}"
DERIVED_DATA="${DERIVED_DATA:-build/unsigned}"
OUTPUT_DIR="${OUTPUT_DIR:-build}"
IPA_PATH="$OUTPUT_DIR/$SCHEME-unsigned.ipa"

if [[ "${SKIP_PREBUILD:-0}" != "1" ]]; then
  npx expo prebuild -p ios --clean
fi

build() {
  xcodebuild \
    -workspace "ios/$SCHEME.xcworkspace" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination 'generic/platform=iOS' \
    -derivedDataPath "$DERIVED_DATA" \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGN_ENTITLEMENTS="" \
    DEVELOPMENT_TEAM="" \
    build
}

if command -v xcbeautify > /dev/null 2>&1; then 
  build | xcbeautify --renderer github-actions
else 
  build
fi

APP_PATH="$DERIVED_DATA/Build/Products/$CONFIGURATION-iphoneos/$SCHEME.app"
[[ -d "$APP_PATH" ]] || { echo "error: $APP_PATH not found"; exit 1; }

STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT
mkdir -p "$STAGING/Payload"
cp -R "$APP_PATH" "$STAGING/Payload/"

mkdir -p "$OUTPUT_DIR"
rm -f "$IPA_PATH"
(cd "$STAGING" && zip -qry ipa.zip Payload)
mv "$STAGING/ipa.zip" "$IPA_PATH"

echo "built $IPA_PATH ($(du -h "$IPA_PATH" | cut -f1))"
