---
version: 1
slug: "src-options-index-html"
primary_target: "src/options/index.html"
related_targets: ["src/popup/index.html"]
---

# Surface Brief · ENO-M 完整页（options 全页应用）

## Scope & Mode

完整页应用（options 页，含壳层/首页/搜索/直播/关注人更新/媒体库/稍后播放/最近播放/关注的音乐人/歌手/播放器/设置/关于），Mode：Operate。popup 遥控面继承同一世界（相关面：src/popup/index.html）。

## Audience · Job · Task · Proof · Constraints

中文 B 站登录用户，深夜书桌前挂着浏览器听歌；任务是找歌、点播、攒歌、切歌；证明物是真实 B 站榜单/搜索/收藏夹内容；约束：Chrome 扩展、仅中文、popup 小尺寸遥控、关页续播不可破坏、标准 web 控件不做世界戏服。

## Chosen Direction & Memorable Moment

方向：铅字印刷与朱印。记忆点：正在播放的曲目行尾盖一枚圆形「在听」朱印，播放条封面同章呼应——听歌像在书页上钤印。

## Unresolved

应用图标是否随新视觉世界更新（未定）；商店截图与 README 展示图何时换新（未定）。

## Direction contract

THESIS: 整个应用是一页铅字书：歌名即汉字内容，曲目表即内页，正在播放盖朱印；拒绝品类默认的「封面网格 + 卡片流 + 发光圆角」。

OWN-WORLD: 墨底 #16151a、纸色 #f0ebdd、朱红 #b5342a、靛蓝 #3a4a6b；宋体大标与黑体小字双声部；细栏线、双线栏头、竖排刊头条（书脊式竖排）、圆形朱印状态戳（行尾与封面同章）。

STORY: 进来先读本周在听（榜单=曲目表），点一行即播，朱印标出在听什么；攒歌即入册，界面像一本不断钤印的曲目册。

FIRST VIEWPORT: 左 220px 导航（品牌 + 方印、标准导航项、「你的音乐库」栏题）；主区内页：大字标题与竖排刊头条、双线「曲目表」栏头（期数/首数等眉题信息置于栏头右则小字——kicker 为 craft-floor 禁项，不设于标题之上）、六行曲目（编号/曲名大字/小字条，时长于数据提供处右齐）、当前行尾盖圆形「在听」朱印；底部 104px 播放条：封面（落同章圆印）、曲名、标准走带键、朱红进度。

FORM: 铅字印刷与朱印（grounded 候选序第 1 位；决策页上用户选定该卡）；seed: a2c6f82ea0754592。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
