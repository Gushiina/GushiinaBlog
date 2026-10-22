$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot 'DailyBlog/frontend')
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
  Write-Host 'Built: DailyBlog/frontend/dist/index.html and vue.html. See DEPLOY.md for GitHub Pages.'
} finally {
  Pop-Location
}
