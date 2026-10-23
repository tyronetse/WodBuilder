#!/bin/bash
# Deploy WodBuilder to BOTH repos and their GitHub Pages sites.
# Run from ~/development/Muse/WodBuilder :  ./deploy-both.sh
set -e
cd "$(dirname "$0")"

echo "==> Pulling latest code (tyronetse/WodBuilder)"
git pull origin main

# Add the public repo as a remote, if it isn't there yet (one-time setup)
if ! git remote get-url vibecode >/dev/null 2>&1; then
  echo "==> Adding vibecode remote"
  git remote add vibecode https://github.com/vibecode-app/WodBuilder.git
fi

echo "==> Pushing code to vibecode-app/WodBuilder"
git push vibecode main

echo "==> Building the web app"
npm run predeploy

echo "==> Publishing site: tyronetse.github.io/WodBuilder"
npx gh-pages --nojekyll -d dist

echo "==> Publishing site: vibecode-app.github.io/WodBuilder"
npx gh-pages --nojekyll -d dist -r https://github.com/vibecode-app/WodBuilder.git

echo ""
echo "Done - both sites updated (give Pages a minute or two):"
echo "  https://tyronetse.github.io/WodBuilder/"
echo "  https://vibecode-app.github.io/WodBuilder/"
