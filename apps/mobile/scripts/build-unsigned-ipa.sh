#!/usr/bin/env bash
# Builds an unsigned .ipa (no Apple account / provisioning profile needed).
# The result is NOT installable as-is: sideload it through a signer such as
# Sideloadly / AltStore / SideStore, or re-sign it with `codesign` yourself.
set -euo pipefail

cd "$(dirname "$0")/.."

SCHEME="Acorn"
CONFIGURATION="${CONFIGURATION:-Release}"
DERIVED_DATA="${DERIVED_DATA:-build/unsigned}"
OUTPUT_DIR="${OUTPUT_DIR:-build}"
IPA_PATH="$OUTPUT_DIR/$SCHEME-unsigned.ipa"

# 1. Regenerate the native project.
if [[ "${SKIP_PREBUILD:-0}" != "1" ]]; then
  npx expo prebuild -p ios --clean
fi

# 2. Compile for a generic device with all code signing switched off.
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

APP_PATH="$DERIVED_DATA/Build/Products/$CONFIGURATION-iphoneos/$SCHEME.app"
[[ -d "$APP_PATH" ]] || { echo "error: $APP_PATH not found"; exit 1; }

# 3. Wrap the .app in the Payload/ layout an .ipa expects.
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT
mkdir -p "$STAGING/Payload"
cp -R "$APP_PATH" "$STAGING/Payload/"

mkdir -p "$OUTPUT_DIR"
rm -f "$IPA_PATH"
(cd "$STAGING" && zip -qry ipa.zip Payload)
mv "$STAGING/ipa.zip" "$IPA_PATH"

echo "built $IPA_PATH ($(du -h "$IPA_PATH" | cut -f1))"
