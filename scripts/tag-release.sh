#!/bin/sh
# electron-builder com releaseType: release (ver electron-builder.yml) exige
# que a tag já exista de verdade no GitHub antes de publicar — só bumpar a
# versão no package.json não é suficiente. Esse script cria e envia a tag
# correspondente automaticamente, sem precisar de um passo manual.
set -e

VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG já existe, pulando criação (retry após falha anterior?)."
else
  git tag "$TAG"
  git push origin "$TAG"
  echo "Tag $TAG criada e enviada."
fi
