#!/usr/bin/env bash
set -euo pipefail

assets_output=$(node .github/scripts/ci.mjs validate "${BUNDLE_DIRECTORY:-bundles}")
assets=()
while IFS= read -r asset; do
  assets+=("$asset")
done <<< "$assets_output"

owner=${REPOSITORY%%/*}
repo=${REPOSITORY#*/}
state=$(gh api graphql \
  -f query='query($owner: String!, $name: String!, $tag: String!) { repository(owner: $owner, name: $name) { release(tagName: $tag) { isDraft } } }' \
  -f owner="$owner" -f name="$repo" -f tag="$TAG" \
  --jq '.data.repository | if . == null then error("Repository not found") elif .release == null then "missing" elif .release.isDraft then "draft" else "published" end')

case "$state" in
  draft) gh release upload "$TAG" "${assets[@]}" --clobber ;;
  missing) gh release create "$TAG" "${assets[@]}" --draft --verify-tag --title "Nomadic $TAG" ;;
  *) echo "Refusing to modify release in state: $state" >&2; exit 1 ;;
esac
