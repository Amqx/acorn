#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/.."

SCHEME="Acorn"
CONFIGURATION="${CONFIGURATION:-Release}"
DERIVED_DATA="${DERIVED_DATA:-build/unsigned}"
OUTPUT_DIR="${OUTPUT_DIR:-build}"
IPA_PATH="$OUTPUT_DIR/$SCHEME-unsigned.ipa"
REACT_NATIVE_PATH="$(pwd)/node_modules/react-native"

if [[ "${SKIP_PREBUILD:-0}" != "1" ]]; then
  npx expo prebuild -p ios --clean
fi

COMPILER_SETTINGS=()

write_ccache_wrapper() {
  local wrapper="$1" compiler="$2" name
  {
    echo '#!/bin/bash'
    printf 'export %s=%q\n' \
      CCACHE_CONFIGPATH "$REACT_NATIVE_PATH/scripts/xcode/ccache.conf" \
      CCACHE_DIR "$(ccache -k cache_dir)"
    for name in $(compgen -e CCACHE_); do
      [[ "$name" == CCACHE_CONFIGPATH || "$name" == CCACHE_DIR ]] && continue
      printf 'export %s=%q\n' "$name" "${!name}"
    done
    printf 'exec %q %q "$@"\n' "$(command -v ccache)" "$compiler"
  } > "$wrapper"
  chmod +x "$wrapper"
}

if [[ "${USE_CCACHE:-0}" == "1" ]] && command -v ccache > /dev/null 2>&1; then
  mkdir -p "$OUTPUT_DIR/ccache"
  CCACHE_WRAPPERS="$(cd "$OUTPUT_DIR/ccache" && pwd)"
  write_ccache_wrapper "$CCACHE_WRAPPERS/clang" clang
  write_ccache_wrapper "$CCACHE_WRAPPERS/clang++" clang++
  COMPILER_SETTINGS=(
    CC="$CCACHE_WRAPPERS/clang"
    CXX="$CCACHE_WRAPPERS/clang++"
    LD="$CCACHE_WRAPPERS/clang"
    LDPLUSPLUS="$CCACHE_WRAPPERS/clang++"
  )
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
    REACT_NATIVE_PATH="$REACT_NATIVE_PATH" \
    ${COMPILER_SETTINGS[@]+"${COMPILER_SETTINGS[@]}"} \
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
