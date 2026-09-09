#!/bin/sh
# electron-builder com releaseType: release (ver electron-builder.yml) exige
# que a tag já exista de verdade no GitHub antes de publicar — só bumpar a
# versão no package.json não é suficiente. Esse script cria e envia a tag
# correspondente automaticamente, sem precisar de um passo manual.
set -e

VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"
OWNER="oseasmoreto"
REPO="sofa.os"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG já existe, pulando criação (retry após falha anterior?)."
else
  git tag "$TAG"
  git push origin "$TAG"
  echo "Tag $TAG criada e enviada."
fi

if [ -z "$GH_TOKEN" ]; then
  echo "GH_TOKEN não definido — não é possível pré-criar a release no GitHub." >&2
  exit 1
fi

EXISTING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG")

if [ "$EXISTING_STATUS" = "200" ]; then
  echo "Release $TAG já existe no GitHub, pulando criação."
else
  # Pré-cria a release vazia ANTES do electron-builder rodar. Sem isso, ao
  # buildar dois formatos pro mac (zip + dmg), cada um checa "existe release
  # pra essa tag?" em paralelo — os dois veem que não existe ainda e cada um
  # cria a sua própria, resultando em DUAS releases duplicadas pra mesma tag
  # (bug conhecido do electron-builder). Criando de antemão, os dois
  # encontram a mesma release já existente e só sobem os arquivos nela.
  HTTP_STATUS=$(curl -s -o /tmp/sofa-release-create.json -w "%{http_code}" -X POST \
    -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$OWNER/$REPO/releases" \
    -d "{\"tag_name\":\"$TAG\",\"name\":\"$TAG\"}")

  if [ "$HTTP_STATUS" != "201" ]; then
    echo "Falha ao pré-criar a release $TAG (HTTP $HTTP_STATUS):" >&2
    cat /tmp/sofa-release-create.json >&2
    exit 1
  fi
  echo "Release $TAG pré-criada no GitHub."
fi
