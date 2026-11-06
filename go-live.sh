#!/bin/sh
# Run once from the repo root when the site is ready to be found by search engines.
# It removes the noindex tag from every page (including tc-help) and the X-Robots-Tag header. Then commit and push.
set -e
cd "$(dirname "$0")/site"
find . -name '*.html' | while read -r f; do
  sed -i.bak '/<meta name="robots" content="noindex, nofollow">/d' "$f" && rm -f "$f.bak"
done
if [ -f _headers ]; then
  sed -i.bak '/X-Robots-Tag/d' _headers && rm -f _headers.bak
fi
echo "Done: noindex removed. Review with 'git diff', then commit and push."
