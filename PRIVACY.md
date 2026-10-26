# 隐私政策 / Privacy Policy

**ENO-M**(Chrome 扩展 / Chrome extension)

最后更新 / Last updated: 2026-10-26

## 中文

ENO-M 是一款把 Bilibili 当作音乐播放器的浏览器扩展。我们不运营任何服务器,不收集、不存储、不上传你的个人信息。

- **账号与登录**:如果你在浏览器里登录了 Bilibili,扩展会通过浏览器自带的 Cookie 能力读取登录状态,仅用于代替你访问 Bilibili 的公开接口(点歌、收藏夹、关注列表、直播)。这些请求由你的浏览器直接发往 Bilibili,不经过任何第三方服务器。
- **本地存储**:播放列表、音量、均衡器等偏好只保存在浏览器本地(`chrome.storage.local` / 本地存储),不上传。
- **音频与视频播放**:为实现关页续播,扩展会创建一个离屏(offscreen)文档播放你主动点击的 B 站音频/视频流;它无可见界面,不收集任何信息。
- **第三方服务**:唯一接触的第三方是 Bilibili 官方接口。我们不使用统计、广告、指纹或追踪。
- **联系我们**:如对隐私有疑问,可在 [GitHub Issues](https://github.com/Cteros/eno-music/issues) 联系。

## English

ENO-M is a Chrome extension that turns Bilibili into a music player. We run no servers and do not collect, store, or upload your personal information.

- **Account & login**: If you are signed in to Bilibili in your browser, the extension reads that login state through the browser's cookie access solely to call Bilibili's own APIs on your behalf (songs, favorites, follows, live rooms). Requests go directly from your browser to Bilibili.
- **Local storage**: Playlists, volume, EQ and other preferences stay on your device (`chrome.storage.local`).
- **Playback**: To keep playing after pages close, the extension uses a single offscreen document for audio you started. It has no visible UI and collects nothing.
- **Third parties**: The only third party is Bilibili's official API. No analytics, ads, fingerprinting, or tracking.
- **Contact**: [GitHub Issues](https://github.com/Cteros/eno-music/issues).
