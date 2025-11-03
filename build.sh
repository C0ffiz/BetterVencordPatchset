#!/bin/bash
set -euo pipefail

command -v pnpm >/dev/null 2>&1 || { echo "pnpm not installed"; exit 1; }

echo "Warning, this script removes existing dist. If you have local modifications that aren't part of the base, they'll get lost. You have 5 seconds to cancel."
sleep 5

BUILDER_HASH=$(git rev-parse --short HEAD)
rm -rf dist && mkdir dist

rsync -a --exclude='.git' base/Vencord/ dist/Vencord/

cd base/Vencord
BASE_HASH=$(git rev-parse --short HEAD)
cd ../..

patch dist/Vencord/src/webpack/patchWebpack.ts src/patch-webpack.patch || { echo "Webpack Patch failed"; exit 1; }
patch dist/Vencord/src/main/csp/index.ts src/patch-csp.patch || { echo "CSP Patch failed"; exit 1; }

cp -r src/bdCompatLayer dist/Vencord/src/plugins/bdCompatLayer
cd dist/Vencord
git init
git remote add origin https://github.com/Vendicated/Vencord
pnpm i
export VENCORD_HASH="$BASE_HASH (BetterVencord patchset built by $BUILDER_HASH)"
pnpm build --standalone
pnpm buildWeb
cd ../..

echo "Build complete."
echo "Base: $BASE_HASH"
echo "Patchset: $BUILDER_HASH"
