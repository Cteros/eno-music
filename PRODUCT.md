# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

B 站登录用户（中文）：在 Bilibili 听歌、看 MV、追音乐人 UP 主的人。他们登录 B 站账号以同步收藏夹、合集与关注的音乐人，长期、反复地使用；把「刷 B 站」变成「听音乐」是他们的日常动作。

## Product Purpose

ENO-M 是一个 Chrome 扩展，把 Bilibili 当成音乐播放器。完整页用来逛和点歌，工具栏弹窗用来遥控；声音走后台（offscreen），关掉完整页也能继续听。成功意味着用户可以在浏览器里把 B 站内容当音乐消费——找歌、攒歌、听歌的完整闭环都在扩展内完成。

## Positioning

「把 Bilibili 当成音乐播放器」：以听觉为中心重新组织 B 站视频内容——音乐榜、BV 链接、收藏夹/合集、关注人直播全部变成可播放的曲目；配合关页续播与工具栏遥控，让浏览器里的听歌不占用一个标签页的注意力。相邻产品（B 站网页、通用音乐 App）做不到「关掉页面继续听 + 弹窗遥控 + B 站账号体系原生同步」的组合。

## Operating Context

- Chrome 浏览器内使用；`chrome://extensions` 加载 `extension/` 目录本地开发。
- 两层界面：完整页（options 页，开在标签页里逛与点歌）与工具栏 popup（迷你遥控：切歌、音量）。
- 建议在浏览器里登录 Bilibili，收藏夹、合集、关注才会同步；未登录时用搜索与 BV 链接也能点歌。
- 声音由后台 service worker + offscreen 文档承载，完整页可随时关闭。
- 存在桌面端（eno-m-desktop），与扩展共用登录态。

## Capabilities and Constraints

- 听：B 站音乐榜、关键词搜索、直接贴 BV 链接、关注人直播。
- 攒：ENO 歌单、B 站收藏夹 / 合集、稍后播放、最近播放。
- 播：底栏控制、歌词、EQ、全屏画面、循环 / 倍速 / 睡眠定时、弹幕、分享卡。
- 完整页导航：首页、搜索、直播、关注人更新、媒体库、稍后播放、最近播放、关注的音乐人、设置、关于。
- Chrome 扩展（Manifest V3）；Vue 3 + UnoCSS + Vite；深色为默认（color-scheme: dark）。
- 语言仅中文；文案与排版按中文优化，暂不做国际化。
- 弹窗 popup 是固定的小尺寸遥控面，完整页是可驻留的全页面——两种物理形态、两种任务密度。
- 明确未定：应用图标是否随新视觉世界更新尚未决定（允许更换，但非本次目标）。

## Brand Commitments

- 名称 **ENO-M**（及 ENO 系列叫法，如 ENO 歌单）必须保留。
- 图标、定位语（「把 Bilibili 当成音乐播放器」的措辞）、全部 UI 文案不设绑定约束：用户已确认可随新视觉世界重塑。产品承诺（关页续播、B 站同步、工具栏遥控）保留，表达方式不限。

## Evidence on Hand

- 真实产品截图：`assets/screenshots/`（home / search / library / singers / settings / later）。
- Chrome Web Store 已上架（eno-m，扩展 id hjcdffalgapcchmopkbnkljenlglloln），有真实用户量。
- 运行时全部内容来自真实 B 站数据（音乐榜、搜索、收藏夹、直播）。
- 无自造的用户评价、基准数据或营收证据；未来工作不得虚构。

## Product Principles

1. 听觉优先：一切界面为「正在听」与「下一首听什么」服务，视觉为声音让路。
2. 两层形态各司其职：popup 是秒开秒用的遥控器，完整页是可驻留的听歌空间；不互相模仿。
3. B 站即内容库：以账号同步（收藏夹 / 合集 / 关注）为数据底座，重度登录用户的路径优先。
4. 关页续播是产品脊柱：任何界面决策都不能破坏后台播放的连续性。
5. 中文语境里说人话：文案短、动词开头、不装腔。
