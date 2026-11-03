#!/bin/sh
# Write SHA256SUMS for UpdateGuard next to an IconPicker.zip.
# GNU sha256sum format: "<64 hex>  IconPicker.zip"
set -eu

zip=${1:-IconPicker.zip}

if [ ! -f "$zip" ]; then
  echo "File not found: $zip" >&2
  exit 1
fi

name=$(basename "$zip")
if [ "$name" != "IconPicker.zip" ]; then
  echo "SHA256SUMS must list IconPicker.zip, not $name" >&2
  exit 1
fi

dir=$(CDPATH= cd -- "$(dirname "$zip")" && pwd)
(
  cd "$dir"
  sha256sum "$name"
) > "$dir/SHA256SUMS"

grep -Eq '^[a-f0-9]{64}  IconPicker\.zip$' "$dir/SHA256SUMS"
cat "$dir/SHA256SUMS"
