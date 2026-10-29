# Review captures · provenance

日期：2026-10-29（Asia/Shanghai）
构建：`pnpm build`（生产构建，extension/）后由 `scripts/review-shots.mjs` 以 Playwright + Chromium 加载解包扩展捕获。
数据：全部为**真实 B 站公开数据**（匿名会话，先访问 bilibili.com 获取匿名 cookie）——首页为真实的「bilibili 音乐榜」第 228 期（20 首），搜索页为关键词「群青」的真实结果；未登录状态下的空态为产品真实状态。无合成/虚构内容。

| 文件 | 视口 | 用途 |
|---|---|---|
| desktop.png | 1440×900 | 完整页首页（契约 FIRST VIEWPORT 证据） |
| desktop-playing.png | 1440×900 | 在听状态：行尾圆印 + 封面同章 + hover 行操作 |
| search.png | 1440×900 | 搜索真实结果（含命中朱红高亮、时长列 m:ss） |
| library.png | 1440×900 | 媒体库空态 |
| live.png | 1440×900 | 直播页（在播列表：在播 1024 间 · 当前 30 间，真实房间） |
| follow.png | 1440×900 | 关注人更新（加载/禁用态） |
| settings.png | 1440×900 | 设置（书页附录 + EQ 铅字仪表盘） |
| state-dialog.png | 1440×900 | 新建播放列表 Dialog 实景（eno-ui 重皮验证） |
| state-toast.png | 1440×900 | MessageAPI 浮层实景（「已添加到稍后再听」） |
| state-error.png | 1440×900 | 断网后的「搜索失败」声明 + 重试恢复动作 |
| user-1280.png | 1280×800 | 桌面常用宽度收缩验证 |
| popup.png | 320×内容高 | 工具栏遥控面（出货尺寸 320 宽） |

字体资产 provenance：`src/assets/fonts/noto-serif-sc/*.woff2` 为 Noto Serif SC（SIL Open Font License 1.1，Google Fonts 官方 woff2 分片，101 片），unicode-range 与官方 CSS 一致，未改动字形。产品内位图（assets/ 图标、broken-image.png）为既有资产，本次未增删位图。

## eno-ui 共享库样式说明
`@cloudfly/eno-ui` 的自带样式表文本仍含其默认绿值（#1db954 等 6 处规则），但所有可达的绿色规则均被 `src/styles/eno.css` 中 `body .eu-*` 双类选择器（特指度 0,2,1+，高于库的 .x[data-v-hash] 0,2,0）在运行时压制；实证见 state-dialog.png（确认键朱红）与 state-toast.png。语义状态色（成功/警告）按「carry meaning」保留，info 蓝映射为世界靛蓝 #7d93bd、error 映射朱红 #d9564a。
