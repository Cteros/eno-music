<p align="center">
  <img src="assets/128px.png" width="88" height="88" alt="ENO-M">
</p>

<h1 align="center" style="letter-spacing:-0.04em">ENO-M</h1>

<p align="center">
  把 Bilibili 当成音乐播放器<br>
  <sub>深色全页 · 工具栏遥控 · 关页续播</sub>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln?hl=zh-CN"><img src="https://img.shields.io/chrome-web-store/v/hjcdffalgapcchmopkbnkljenlglloln?label=Chrome%20Web%20Store&color=1ed760&labelColor=121212" alt="Chrome Web Store"></a>
  <a href="https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln?hl=zh-CN"><img src="https://img.shields.io/chrome-web-store/users/hjcdffalgapcchmopkbnkljenlglloln?label=users&color=1ed760&labelColor=121212" alt="users"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-7c7c7c?labelColor=121212" alt="GPL-3.0"></a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln?hl=zh-CN"><img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/tbyBjqiMGyGTARQ7sDIu.png" alt="前往 Chrome 应用商店" height="56"></a>
</p>

<p align="center">
  <img src="assets/screenshots/home.png" width="920" alt="ENO-M 首页 · Bilibili 音乐榜">
</p>

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/screenshots/search.png" alt="搜索">
      <p align="center"><sub>搜索关键词，或直接贴 BV 链接</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/screenshots/library.png" alt="媒体库">
      <p align="center"><sub>ENO 歌单，同步 B 站收藏夹与合集</sub></p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="assets/screenshots/singers.png" alt="关注的音乐人">
      <p align="center"><sub>关注音乐人，看更新、听直播</sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="assets/screenshots/settings.png" alt="设置">
      <p align="center"><sub>备份、均衡器、打开桌面端</sub></p>
    </td>
  </tr>
</table>

## 能做什么

ENO-M 是 Chrome 扩展。完整页用来逛和点歌，工具栏弹窗用来遥控。声音走后台，关掉完整页也能继续听。

建议在浏览器里登录 Bilibili，收藏夹、合集和关注才会同步过来。

| | |
| --- | --- |
| 听 | 音乐榜、搜索、BV 链接、关注人直播 |
| 攒 | ENO 歌单、B 站收藏夹 / 合集、稍后播放、最近播放 |
| 播 | 底栏控制、歌词、EQ、全屏画面、循环 / 倍速 / 睡眠 |
| 带出门 | 工具栏 Popup、关页续播、[桌面端](https://github.com/cloudflypeng/eno-m-desktop) 共用登录态 |

## 怎么用

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln?hl=zh-CN) 安装
2. 登录 Bilibili（可选，但强烈建议）
3. 点扩展图标打开迷你控制，或进入完整播放器
4. 点歌即可。关掉完整页后，用工具栏继续切歌、调音量

## 本地开发

```bash
pnpm install
pnpm dev
```

`chrome://extensions` → 开发者模式 → 加载已解压的扩展程序 → 选仓库里的 `extension/`。

```bash
pnpm build    # 生产构建
pnpm pack     # zip / crx
pnpm test     # 单测
```

## 链接

[Chrome 商店](https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln) · [桌面端](https://github.com/cloudflypeng/eno-m-desktop) · [爱发电](https://afdian.com/a/meanc) · [Discord](https://discord.gg/HPv2WDrvhq) · [QQ 群](https://qm.qq.com/q/jeLnZehRyo)

<p align="center">
  <a href="https://github.com/cloudflypeng/eno-music/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=cloudflypeng/eno-music" alt="contributors">
  </a>
</p>
