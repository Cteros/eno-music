#!/usr/bin/env bash
# 把 Chrome Web Store OAuth 凭证写入 GitHub Environment chrome-webstore。
# 用法：在仓库根目录执行  bash scripts/setup-cws-secrets.sh
set -euo pipefail

REPO="${REPO:-Cteros/eno-music}"
ENV_NAME="chrome-webstore"

if ! command -v gh >/dev/null; then
  echo "需要已安装并登录的 GitHub CLI（gh）"
  exit 1
fi

gh api --method PUT "repos/${REPO}/environments/${ENV_NAME}" >/dev/null

prompt_secret() {
  local name="$1"
  local value=""
  printf '%s: ' "$name" >&2
  read -r value
  if [ -z "$value" ]; then
    echo "未填写 ${name}" >&2
    exit 1
  fi
  printf '%s' "$value"
}

echo "将写入 ${REPO} 的 Environment ${ENV_NAME}"
echo "值不会打印到终端历史以外的文件。从 Google Cloud / 商店后台粘贴即可。"
echo

CLIENT_ID="$(prompt_secret CWS_CLIENT_ID)"
CLIENT_SECRET="$(prompt_secret CWS_CLIENT_SECRET)"
REFRESH_TOKEN="$(prompt_secret CWS_REFRESH_TOKEN)"
PUBLISHER_ID="$(prompt_secret CWS_PUBLISHER_ID)"

gh secret set CWS_CLIENT_ID --repo "$REPO" --env "$ENV_NAME" --body "$CLIENT_ID"
gh secret set CWS_CLIENT_SECRET --repo "$REPO" --env "$ENV_NAME" --body "$CLIENT_SECRET"
gh secret set CWS_REFRESH_TOKEN --repo "$REPO" --env "$ENV_NAME" --body "$REFRESH_TOKEN"
gh secret set CWS_PUBLISHER_ID --repo "$REPO" --env "$ENV_NAME" --body "$PUBLISHER_ID"

echo
echo "已写入 4 个 secrets。下一步：把发版 workflow 推到 main，然后在 Actions → Release 里 Run workflow。"
