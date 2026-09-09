#!/bin/sh
# Roda depois do "npm version patch" (que já bumpou o package.json e criou
# o commit + a tag local — é isso que o comando faz por padrão) e antes do
# electron-builder. Esse script só sobe esse commit/tag pro GitHub e
# pré-cria a release lá.
#
# Por quê pré-criar a release: electron-builder com releaseType: release
# (ver electron-builder.yml) precisa que a tag já exista de verdade no
# GitHub antes de publicar. Além disso, ao buildar dois formatos pro mac
# (zip + dmg), cada um checa "existe release pra essa tag?" em paralelo —
# se nenhuma existir ainda, os dois criam a sua própria, duplicando a
# release (bug conhecido do electron-builder). Criando de antemão, os dois
# encontram a mesma já existente e só sobem os arquivos nela.
set -e

VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"
OWNER="oseasmoreto"
REPO="sofa.os"

git push origin main
git push origin "$TAG"

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
