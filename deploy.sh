#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/DailyBlog/frontend"
npm ci
npm run build
printf '%s\n' 'Built: DailyBlog/frontend/dist/index.html and vue.html. See DEPLOY.md for GitHub Pages.'
