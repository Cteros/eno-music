<p align="center">
  <img width="128" height="128" alt="ENO-M" src="assets/128px.png">
</p>

<h1 align="center">ENO-M</h1>

<p align="center">把 bilibili 当音乐播放器 —— 深色全页体验 + 工具栏迷你控制</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln?hl=zh-CN"><strong>Chrome 应用商店</strong></a>
  ·
  <a href="https://afdian.com/a/meanc">爱发电</a>
  ·
  <a href="https://discord.gg/HPv2WDrvhq">Discord</a>
</p>

## 这是什么

ENO-M 是一个 Chrome 扩展，用 Spotify 风格的深色界面收听 bilibili 音视频：侧栏浏览、底栏播放、工具栏弹窗遥控。支持关注音乐人、自建歌单，以及把登录态一键带到桌面端。

当前版本：**5.1.5**

<p align="center">
  <img width="900" alt="ENO-M 首页 · bilibili 音乐榜" src="assets/screenshots/home.png">
</p>

<p align="center">
  <img width="440" alt="搜索" src="assets/screenshots/search.png">
  <img width="440" alt="媒体库" src="assets/screenshots/library.png">
</p>

<p align="center">
  <img width="440" alt="关注的音乐人" src="assets/screenshots/singers.png">
  <img width="440" alt="设置" src="assets/screenshots/settings.png">
</p>

## 功能

- **首页**：bilibili 音乐榜、关注歌手速览
- **搜索**：关键词或 BV 链接找歌
- **媒体库**：ENO 歌单；登录后可同步 B 站收藏夹 / 合集
- **关注的音乐人**：用 mid 或空间链接添加 UP
- **稍后播放**：临时队列
- **底栏播放器**：播放控制、循环/随机、音量、进度、播放列表抽屉；封面可切浮动视频；EQ、分享卡片
- **工具栏 Popup**：封面 / 进度 / 上一首·播放·下一首；一键打开完整播放器（音频在完整页中播放，需保持 options 页开启）
- **设置**：歌手与歌单导入导出、均衡器
- **打开客户端**：把 bilibili cookie 带到 [桌面端](https://github.com/cloudflypeng/eno-m-desktop)

## 使用

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln?hl=zh-CN) 安装
2. 建议在浏览器中登录 bilibili，以便同步收藏夹与合集
3. 点击扩展图标打开 **迷你控制**，或点「打开完整播放器」进入全页界面
4. 在完整页点歌后即可播放；关闭完整页后音频会停止

## 本地开发

```bash
pnpm install
pnpm dev
```

然后打开 `chrome://extensions` → 开启开发者模式 → 「加载已解压的扩展程序」→ 选择仓库里的 `extension/` 目录。

```bash
pnpm build   # 生产构建
pnpm pack    # 打包 zip / crx
```

## 相关链接

| | |
| --- | --- |
| Chrome 商店 | https://chromewebstore.google.com/detail/eno-m/hjcdffalgapcchmopkbnkljenlglloln |
| 桌面端 | https://github.com/cloudflypeng/eno-m-desktop |
| 爱发电 | https://afdian.com/a/meanc |
| Discord | https://discord.gg/HPv2WDrvhq |
| QQ 群 | https://qm.qq.com/q/jeLnZehRyo |

## 贡献者

<a href="https://github.com/cloudflypeng/eno-music/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=cloudflypeng/eno-music" alt="contributors" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
