# Chrome Web Store 自动发布

在 GitHub Actions 里构建扩展、打 zip，并上传到 Chrome 商店。商店侧走 [Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/using-api)（v1 将于 2026-10-15 停用）。

扩展 ID：`hjcdffalgapcchmopkbnkljenlglloln`

## 一次性凭证

### 1. 启用 API

1. 打开 [Google Cloud Console](https://console.cloud.google.com/) 并新建项目（或复用现有项目）
2. 启用 [Chrome Web Store API](https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com)

### 2. OAuth 同意屏幕

1. 打开 [Google Auth Platform](https://console.cloud.google.com/auth/overview)
2. User Type 选 **External**（个人 Gmail 不能选 Internal）
3. 填应用名、支持邮箱、开发者联系邮箱
4. Scopes 可跳过，后面用 CLI 申请 `chromewebstore`
5. 把你的 Google 账号加进 Test users
6. **把同意屏幕发布为 Production / In production**
   留在 Testing 时 refresh token 大约 7 天失效，CI 会报 `invalid_grant`

Google 账号必须已开两步验证，否则商店 API 会拒绝。

### 3. OAuth 客户端

1. [Credentials](https://console.cloud.google.com/apis/credentials) → Create Credentials → OAuth client ID
2. Application type 选 **Desktop app**
3. 记下 `CLIENT_ID` 和 `CLIENT_SECRET`

### 4. Refresh token

```sh
npx chrome-webstore-upload-keys
```

按提示填入 client id / secret，浏览器授权后会打印 `REFRESH_TOKEN`。保存好，只显示一次。

### 5. Publisher ID

打开 [Chrome Web Store 开发者后台](https://chrome.google.com/webstore/devconsole/) → Publisher → Settings，复制 Publisher ID。

## GitHub Secrets

仓库 Settings → Secrets and variables → Actions，建议建 Environment 名为 `chrome-webstore`（和工作流一致），把密钥放进去：

| Secret | 说明 |
| --- | --- |
| `CWS_CLIENT_ID` | OAuth Client ID |
| `CWS_CLIENT_SECRET` | OAuth Client Secret |
| `CWS_REFRESH_TOKEN` | 上一步拿到的 refresh token |
| `CWS_PUBLISHER_ID` | 开发者后台的 Publisher ID |

可选：`RELEASE_PAT`。若 `main` 有分支保护导致 `github-actions` 推不了 bump commit，用一个有 `contents: write`（并能绕过保护）的 PAT。

在 Environment `chrome-webstore` 上可以打开 Required reviewers：GitHub Release 打完后，商店提交会停下来等人批准。

## 怎么发版

必须在 **main** 分支上跑（release-it 要求 `requireBranch: main`）。

1. 打开 Actions → **Release** → Run workflow（Branch 选 `main`）
2. 选 `patch` / `minor` / `major`
3. Chrome 商店：
   - `publish`：上传并提交审核（默认）
   - `upload`：只上传草稿，需自己在后台点发布
   - `skip`：只打 GitHub Release

流程：升版本 → `pnpm build` → 打 `extension.zip` → GitHub Release → 上传 Chrome 商店。

`manifest.json` 的 `version` 来自 `package.json`，必须比商店上当前版本高，否则上传会失败。

## 本地发布

```sh
export CLIENT_ID='...'
export CLIENT_SECRET='...'
export REFRESH_TOKEN='...'
export PUBLISHER_ID='...'

pnpm build
pnpm pack:zip
pnpm upload:chrome    # 只上传草稿
pnpm publish:chrome   # 上传并提交审核
```

## 凭证保活

Testing 模式的 token 会过期；Production 下若 **6 个月完全不用** 也可能失效。仓库里有 `cws-token-keepalive` 工作流，每月换一次 access token。若突然出现 `invalid_grant`，按第 4 步重新签一次，更新 `CWS_REFRESH_TOKEN`。
