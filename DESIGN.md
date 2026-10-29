---
name: "ENO-M · 铅字印刷与朱印"
description: "「把 Bilibili 当成音乐播放器」的 Chrome 扩展：中文书刊铅字印刷 + 朱红钤印的 Operate 工具型设计系统"
colors:
  ink: "#16151a"
  ink-deep: "#100f13"
  ink-2: "#1d1b22"
  ink-3: "#262330"
  paper: "#f0ebdd"
  paper-2: "#c9c2b1"
  paper-3: "#9c9482"
  paper-4: "#7c7466"
  seal: "#b5342a"
  seal-bright: "#d9564a"
  seal-deep: "#8f271e"
  seal-on-fill: "#ef8477"
  seal-tint: "rgb(181 52 42 / 14%)"
  seal-tint-active: "rgb(181 52 42 / 16%)"
  indigo: "#3a4a6b"
  indigo-light: "#7d93bd"
  border-hairline: "rgb(240 235 221 / 12%)"
  rule-double: "rgb(240 235 221 / 38%)"
  fill-1: "rgb(240 235 221 / 5%)"
  fill-2: "rgb(240 235 221 / 9%)"
  fill-3: "rgb(240 235 221 / 14%)"
  fill-4: "rgb(240 235 221 / 20%)"
  fill-dark-1: "rgb(12 10 8 / 18%)"
  fill-dark-2: "rgb(12 10 8 / 26%)"
  fill-dark-3: "rgb(12 10 8 / 34%)"
  fill-dark-4: "rgb(12 10 8 / 44%)"
  status-green: "#22c55e"
  status-amber: "#f59e0b"
typography:
  display:
    fontFamily: "'ENO Serif', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif"
    fontSize: "clamp(38px, 4.4vw, 54px)"
    fontWeight: 900
    lineHeight: 1.12
    letterSpacing: "0.04em"
  vertical-masthead:
    fontFamily: "'ENO Serif', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif"
    fontSize: "13px"
    fontWeight: 900
    letterSpacing: "0.42em"
  headline:
    fontFamily: "'ENO Serif', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif"
    fontSize: "21px"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "0.06em"
  title:
    fontFamily: "'ENO Serif', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif"
    fontSize: "17px"
    fontWeight: 900
    lineHeight: 1.35
    letterSpacing: "0.02em"
  rank:
    fontFamily: "'ENO Serif', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "tabular-nums"
  body:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  meta:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.12em"
  label:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.04em"
  data:
    fontFamily: "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace"
    fontSize: "12px"
    fontFeature: "tabular-nums"
  seal-glyph:
    fontFamily: "'ENO Serif', 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif"
    fontSize: "13px"
    fontWeight: 900
    letterSpacing: "0.12em"
    lineHeight: 1
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "6px"
spacing:
  row-gap: "14px"
  inline-row: "12px"
  section-gap: "16px"
  page-top: "26px"
  page-inline: "48px"
  page-bottom: "32px"
  dock-inline: "32px"
  empty-block: "56px"
components:
  button-disc:
    size: "52px"
    backgroundColor: "{colors.seal}"
    textColor: "{colors.paper}"
    rounded: "50%"
  button-disc-hover:
    backgroundColor: "{colors.seal-deep}"
  button-ghost:
    height: "36px"
    padding: "0 14px"
    textColor: "{colors.paper-2}"
    rounded: "{rounded.md}"
  button-eu-primary:
    backgroundColor: "{colors.seal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-eu-secondary:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-eu-destructive:
    textColor: "{colors.seal-bright}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.fill-1}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
  input-focus:
    backgroundColor: "{colors.fill-2}"
  chip:
    height: "28px"
    padding: "0 12px"
    backgroundColor: "{colors.fill-1}"
    textColor: "{colors.paper-2}"
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
  chip-active:
    backgroundColor: "{colors.seal-tint}"
    textColor: "{colors.seal-on-fill}"
    rounded: "{rounded.sm}"
  track-row:
    height: "64px"
    padding: "0 12px"
    rounded: "{rounded.sm}"
  track-row-active:
    backgroundColor: "{colors.fill-2}"
  section-header:
    typography: "{typography.headline}"
    textColor: "{colors.paper}"
    padding: "0 0 8px"
  seal-round:
    size: "34px"
    textColor: "{colors.seal-bright}"
    rounded: "50%"
  seal-square:
    size: "34px"
    textColor: "{colors.seal-bright}"
    rounded: "{rounded.sm}"
  nav-item:
    height: "40px"
    padding: "0 10px"
    textColor: "{colors.paper-2}"
    rounded: "{rounded.sm}"
  nav-item-active:
    backgroundColor: "{colors.seal-tint-active}"
    textColor: "{colors.paper}"
  empty-state:
    padding: "56px 24px"
    textColor: "{colors.paper-3}"
  skeleton:
    rounded: "{rounded.sm}"
    backgroundColor: "{colors.fill-1}"
  toast:
    backgroundColor: "rgb(38 35 48 / 96%)"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
---

# Design System: ENO-M · 铅字印刷与朱印

## Overview

**Creative North Star: "铅字印刷与朱印"**

整个应用是一页铅字书：墨底是纸张的负片，纸色文字是排上去的铅字，正在播放的曲目在行尾盖一枚圆形「在听」朱印。这是 Operate 模式（工具型界面）——密度高、动作快、无表演性装饰；但每一个界面元素都来自同一套印刷语汇：细栏线分栏、双线栏头立目、宋体大字说内容、黑体小字说操作、时长以等宽 m:ss 右齐。拒绝品类默认的「封面网格 + 卡片流 + 发光圆角」。

世界的核心动作是**钤印**。听歌像在书页上盖章：榜单即曲目表，点一行即播，当前行尾落下圆印「在听」，播放条封面右下角盖同一枚章呼应。形制有语义——方印是品牌落款（「印」），圆印是状态钤记（「在听」「待听」「已听」）。朱红因此是**落印色**而非填充色：它只出现在印章、强调文字、进度与主操作上，屏幕上的大面积永远是墨与纸。

**Key Characteristics:**

- 墨底固定（#16151a）：主区不随封面漂移；封面只在播放舞台做氛围 wash。
- 双声部排版：自托管 Noto Serif SC 900（'ENO Serif'）说「内容的名字」，系统黑体栈说「操作与说明」，等宽栈 + tabular-nums 承载所有数字列。
- 印刷组件语言：1px 细栏线（rgb(240 235 221 / 12%)）、3px 双线栏头（rgb(240 235 221 / 38%)）、2/3/4/6px 方角、内页式行表（编号 / 曲名大字 / 小字条 / 时长右齐）。
- 唯一署名动效：eno-stamp「在听」钤印落下（0.34s，cubic-bezier(0.16, 1, 0.3, 1)）；其余动效全部是 0.16–0.22s 的状态过渡。
- 浏览器表面也属于设计：::selection 纸字朱底、caret 朱红、细纸色滚动条、:focus-visible 朱红 outline。
- 中文问题句 + 恢复动作的错误策略：error.message 不上屏（src/shared/zhError.ts）。

### 两层形态（Popup 遥控面 vs 完整页）

两层形态共用全部 token，但**构图原则不同，互不模仿**（PRODUCT.md 产品原则 2）：

- **完整页（options，可驻留的听歌空间）**：书页构图——左 220px 导航（品牌 + 方印「印」、导航项、「你的音乐库」栏题），主区内页（大字标题 + 书脊式竖排刊头条 + 双线栏头 + 曲目行表），底部固定 104px 播放条（封面落印、曲名大字、标准走带键、朱红进度）。允许 clamp 大字（38–54px）、竖排行文、hover 露出行操作、多栏并置。
- **Popup（工具栏遥控面，出货 320px）**：秒开秒用的遥控器——深墨底（#100f13），sans 优先，标题只用 14px 宋体小标（字距 0.12em），56px 封面小图、3px 朱红进度线、26px 小控件、等宽时间码。**不设**：竖排刊头条、双线栏头、行表、clamp 大字、hover 隐藏信息（小尺寸下信息必须常驻）。

## Colors

调色是一块墨、一叠纸、一枚朱印、一点靛蓝：中性色占屏幕 95% 以上，朱红只在「落印」时出现，靛蓝只承载次级信息语义（链接、info 状态）。

### Primary（朱印 · Seal）

- **朱红 Seal**（#b5342a / `--lp-seal`）：品牌落印色。主按钮底、进度填充、::selection 底、印章边框（纸面变体）。不做大面积背景。
- **亮朱 Seal Bright**（#d9564a / `--lp-seal-bright`）：墨底上的强调色——印章字与边、激活控件、错误语义、焦点 outline、caret、在听曲名。墨底对比 4.65:1。
- **深朱 Seal Deep**（#8f271e / `--lp-seal-deep`）：主操作 hover 按压底色（比朱红更深一档）。
- **印泥提亮 Seal On-Fill**（#ef8477）：朱红浅底（seal-tint）之上的文字色——激活标签片、在听曲名高亮；在 14% 朱红浅底上 6.12:1。
- **朱红浅底 Seal Tint**（rgb(181 52 42 / 14%) / `--eno-primary-light`）：激活标签片、危险项 hover 的底色。
- **朱红浅底·激活 Seal Tint Active**（rgb(181 52 42 / 16%)）：侧栏激活项、eno-ui 激活标签页的底色。

### Secondary（靛蓝 · Indigo）

- **靛蓝 Indigo**（#3a4a6b / `--lp-indigo`）：保留色板身份的深靛；不做小字。
- **亮靛 Indigo Light**（#7d93bd / `--lp-indigo-light`）：正文链接色与 info 状态图标色。墨底对比 5.86:1。

### Neutral（墨与纸）

- **墨底 Ink**（#16151a / `--lp-ink`）：全应用主区底色，固定不漂移。
- **深墨 Ink Deep**（#100f13 / `--lp-ink-deep`）：html 底、popup 底、书脊/侧栏深处。
- **抬升面 Ink 2**（#1d1b22 / `--lp-ink-2`）：卡片、播放条、Dialog 面。
- **高抬升面 Ink 3**（#262330 / `--lp-ink-3`）：hover 抬升面、Popover/Toast 面。
- **纸色 Paper**（#f0ebdd / `--lp-paper`）：一级文字。墨底对比 15.25:1。
- **纸色 2**（#c9c2b1 / `--lp-paper-2`）：二级文字（副标题、chips）。10.24:1。
- **纸色 3**（#9c9482 / `--lp-paper-3`）：三级文字（占位符、提示、空态）。6.03:1。
- **纸色 4**（#7c7466 / `--lp-paper-4`）：**仅限大字与非文本**——30px 排名铅字、列表 marker、拖拽手柄图标。3.93:1（大字阈值 3:1 之上，正文阈值之下）。
- **细栏线**（rgb(240 235 221 / 12%) / `--eno-border`）：一切分隔线、卡片边、输入框边、小图框。
- **双线**（rgb(240 235 221 / 38%)）：3px double 栏头线与播放条顶线，**只**做栏目分界。
- **纸浮阶 fill-1..4**（rgb(240 235 221 / 5% / 9% / 14% / 20%)）：hover 浮墨（fill-1）、激活底（fill-2）、进度轨/更强底（fill-3、fill-4）。
- **墨沉阶 fill-dark-1..4**（rgb(12 10 8 / 18% / 26% / 34% / 44%)）：压暗层（已声明于 variables.css；当前构建无消费点，按保留值记录）。

### 状态语义色

| 语义 | 值 | 来源 | 用处 |
|---|---|---|---|
| error | 亮朱 #d9564a | `--lp-seal-bright` | Toast/浮层错误图标、错误声明、destructive 边框（rgb(217 86 74 / 50%)） |
| info | 亮靛 #7d93bd | `--lp-indigo-light` | Toast info 图标、链接 |
| success | 语义绿 #22c55e | eno-ui 语义色（保留） | 成功状态，**只**承载语义 |
| warning | 语义琥珀 #f59e0b | eno-ui 语义色（保留） | 警告状态，**只**承载语义 |

### 对比度承诺（实测值）

| 文字/元素 | 配色 | 墨底实测 | 承诺 |
|---|---|---|---|
| 正文一级 | paper on ink | 15.25:1 | ≥ 4.5:1 |
| 正文二级 | paper-2 on ink | 10.24:1 | ≥ 4.5:1 |
| 正文三级 | paper-3 on ink | 6.03:1 | ≥ 4.5:1 |
| 强调文字 | seal-bright on ink | 4.65:1 | ≥ 4.5:1（限 ≥12px 粗体或更大） |
| 大字/图标 | paper-4 on ink | 3.93:1 | ≥ 3:1，**禁止**用于正文 |
| 链接/info | indigo-light on ink | 5.86:1 | ≥ 4.5:1 |
| 印泥提亮 | #ef8477 on seal-tint | 6.12:1 | ≥ 4.5:1 |
| 纸字朱底 | paper on seal | 5.05:1 | ≥ 4.5:1 |

规则：正文（<24px）只用 paper / paper-2 / paper-3 / seal-bright-on-ink / indigo-light；paper-4 与 seal 填充上的白字（paper on seal-bright = 3.28:1）只允许大字、图形或非文本。

### Named Rules

**The Rare Seal Rule（朱印稀有律）。** 朱红是落印色，不是装饰色：同一屏上朱红元素应可数（印章、主操作、进度、强调各一）；出现第二块大面积朱红即是缺陷。

**The One-Base Rule（单墨底律）。** 主区永远是墨底 #16151a；封面取色（CoverStage wash）只允许做播放舞台的氛围层，禁止把导航、卡片、播放条染成封面色。

**The Meaning-Carrying Green Rule（语义绿律）。** 绿与琥珀只承载 success / warning 语义（#22c55e / #f59e0b），永不用于装饰、品牌或强调；error 走朱红、info 走靛蓝。

## Typography

**Display Font:** 'ENO Serif' = 自托管 Noto Serif SC 900（SIL OFL 1.1，Google Fonts 官方 woff2 分片 101 片，src/assets/fonts/noto-serif-sc/，unicode-range 与官方一致，font-display: swap），回退 'Songti SC', 'STSong', 'SimSun', 'Noto Serif CJK SC', serif。
**Body Font:** 系统黑体栈 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif。
**Data Font:** 等宽栈 'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace + `font-variant-numeric: tabular-nums`。

**Character:** 宋体九百重的「铅字声部」只说内容的名字（标题、曲名、栏头、印章、排名数字），系统黑体的「操作声部」只说操作与说明；两个声部不混用、不换岗。数字一律等宽，让 m:ss 时长列与排名列像铅字排版一样对齐。

### Hierarchy

| 角色 | 字体 | 字号 | 字重 | 行高 | 字距 | 用处 |
|---|---|---|---|---|---|---|
| Display 大字标题 | ENO Serif | clamp(38px, 4.4vw, 54px) | 900 | 1.12 | 0.04em | 首页大字标题 |
| 竖排刊头条 | ENO Serif | 13px | 900 | — | 0.42em | 书脊式竖排（writing-mode: vertical-rl, text-orientation: mixed） |
| Headline 栏头 | ENO Serif | 21px | 900 | 1.25 | 0.06em（「曲目表」栏头 0.28em） | 双线栏头 |
| Title 行题 | ENO Serif | 17px | 900 | 1.35 | 0.02em | 曲目行曲名、空态标题 |
| Rank 铅字数字 | ENO Serif | 30px | 900 | 1 | 0 | 榜单排名（tabular-nums） |
| Body 正文 | 系统黑体 | 14px | 400 | 1.6 | — | 全局正文、导航（15px 500 0.02em） |
| Meta 小字条 | 系统黑体 | 12px | 500 | 1.5 | 0.12em | 栏头右则小字（期数/首数）、行内 meta |
| Label 标签 | 系统黑体 | 12px | 600 | — | 0.04em | 标签片、ghost 按钮（13px 600 0.04em） |
| Data 数据 | 等宽 | 12px | 400 | — | 0 | 时长 m:ss、时间码（tabular-nums） |
| Seal 印章字 | ENO Serif | 13px（sm 10px） | 900 | 1 | 0.12em | 印章字（配 text-indent 0.12em 抵消尾字距） |

### Named Rules

**The Two Voices Rule（双声部律）。** 宋体只说「内容的名字」（标题、曲名、栏头、印章、排名），黑体只说「操作与说明」（按钮、导航、提示、meta）。任何新界面先分声部再排版；一个界面里宋体字出现的地方应当是它的「题目」。

**The Tabular Rule（等宽数字律）。** 一切数字列——时长、时间码、排名、期数——用等宽栈 + tabular-nums；时长格式为 m:ss（分不补零、秒补零）右齐。缺数据时留空槽，不以横杠或估算值填塞。

## Layout

书页构图：**左 220px 书脊导航 + 主区内页 + 底部 104px 页脚播放条**。侧栏与内容区高 calc(100% - 104px)，播放条固定底边（z-index 20，顶边 3px 双线）；视频舞台同样为播放条留出 104px（inset 0 0 104px）。侧栏收起态 72px。主区内页边距 26px 48px 32px；播放条内边距 0 32px（三栏 grid：minmax(240px,1fr) / minmax(360px,1.6fr) / minmax(240px,1fr)，gap 24px）。

**间距节奏**（观察值，无形式化间距标尺）：行内 12px（行 padding、chip padding）、行间 gap 14px、栏头下 16px（margin-bottom）+ 8px（padding-bottom）、页面 26/48/32px、空态 56px 24px。4px 是最小节奏单位。

**栏线规则：**

- 细栏线 1px rgb(240 235 221 / 12%)（`--eno-border`）：行分隔、卡片边、输入框边、小图框、chip 边——默认分隔手段。
- 双线 3px double rgb(240 235 221 / 38%)：**仅**栏头（双线栏头）与播放条顶边；一条内页只有一至数条，不可滥用。
- 1px 透明左侧边是侧栏项的激活槽（激活时染亮朱 #d9564a，恰好 1px——见 Do's and Don'ts）。

**内页式行表（SongItem 规范）**：64px 行高，gap 14px，padding 0 12px，方角 2px；从左到右＝编号（宋体 21px 900 tabular，行 hover/激活变纸色）→ 44px 封面小图（1px 细栏线框）→ 曲名（宋体 17px 900）+ 小字条（12px，作者/来源）→ 时长（等宽 12px tabular，右齐 m:ss，缺数据留空）→ 行操作（hover 露出）。行 hover 浮墨 fill-1，激活 fill-2；正在播放行曲名转亮朱、行尾落圆印「在听」。榜单行的编号用 30px 铅字排名（`.eno-rank`，前 3 名亮朱 `.eno-rank--top`）。

**响应式**：≤1100px 播放条三栏收缩（grid 列比 0.9/1.4/0.9，padding 0 12px，gap 10px）并隐藏音量滑杆；≤860px 隐藏作者行与迷你操作。1280px 桌面宽度为收缩验证基准（见 .impeccable/review/PROVENANCE.md 的 user-1280.png）。popup 固定 320px，不参与响应式。

### Named Rules

**The Column Rule（栏线律）。** 分区靠线不靠色块：分隔用 1px 细栏线，立目用 3px 双线；禁止用粗色边框、渐变或阴影条分区。栏头右则小字（12px 0.12em）是眉题信息的唯一合法位置。

## Elevation & Depth

以**色调分层**为主（ink → ink-2 → ink-3），阴影为辅：纸页平放，阴影只在悬停与浮层时出现，一律带偏移与柔化（0 1px 2px / 0 6px 18px / 0 16px 40px），绝无硬偏移、无 0 模糊贴纸阴影。玻璃拟态被明确关闭（`--eno-filter-glass-*` 一律 `none`）；封面舞台不发光、不模糊。

### Shadow Vocabulary

- **阴影·小**（`0 1px 2px rgb(12 10 8 / 40%)`）：小件轻抬（保留值，用于贴面小件）。
- **阴影·中**（`0 6px 18px rgb(12 10 8 / 48%)`）：卡片/瓦片 hover 抬升（eno-card、playlist-tile、continue-card、singer-card）。
- **阴影·大**（`0 16px 40px rgb(12 10 8 / 55%)`）：浮层（Toast）。
- **朱晕**（`0 6px 18px rgb(181 52 42 / 28%)`）：**只**用于播放圆盘 hover——朱红圆件轻微发光，是「印泥未干」的暗示。
- **光环**（`0 0 0 1px rgb(240 235 221 / 18%), 0 6px 18px rgb(12 10 8 / 45%)`）：已声明保留值；当前构建无消费点。

### Named Rules

**The Flat Page Rule（平页律）。** 静止的面是平的：阴影只作为状态响应（hover 抬升、浮层离页）出现，恢复静止即收回；把阴影当常驻装饰即违背铅字印刷的平纸质感。

## Shapes

方角是世界形制：圆角标尺 2 / 3 / 4 / 6px（`--eno-radius-sm/md/lg/xl`），上限 6px，从不出现胶囊圆角。圆，是印章的特权形——方印 2px 圆角、圆印 50%、播放圆盘 50%。分隔靠 1px 线与 3px 双线，不靠形状。所有印章带 -4deg 轻微倾斜与双环内衬（inset 2px 墨环 + inset 3px 半透印泥环），模拟钤印在纸上的不平。

### Named Rules

**The Square Corner Rule（方角律）。** 圆角只取 2/3/4/6px 四档；圆角超过 6px 或使用胶囊形，除非它是印章或播放圆盘。

**The Two Seal Shapes Rule（两形制律）。** 方印＝品牌落款「印」（侧栏品牌行）；圆印＝状态钤记（「在听」「待听」「已听」），必须行尾与封面同章同形。分享卡纸面例外：用圆印形制 + 纸色变体（`--eno-seal--paper`）落「印」。

## Components

### 按钮（Buttons）

- **Shape:** 方角 3px（`--eno-radius-md`）；唯一例外是播放圆盘（52px 正圆）与播放条圆钮。
- **主操作 · 播放圆盘（.play-all / .eno-play-disc）:** 朱红底（#b5342a）+ 纸色字，52px 正圆；hover 深朱（#8f271e）+ 上抬 1px + 朱晕；active 下沉 1px（.eno-play-disc active scale 0.94）。过渡 0.16s（eno-play-btn 0.18s，缓动含 ease-pop）。
- **Ghost 按钮（.ghost）:** 36px 高、padding 0 14px、方角 3px、黑体 13px 600 0.04em、纸色 2 字；hover 纸色 1 字 + 浮墨 fill-1；active scale 0.97；`--danger` 变体 hover 亮朱字 + 朱红浅底。
- **行/媒体操作（.media-action-btn / .btn / .icon-btn）:** hover 上抬 1px（icon-btn 以 opacity 1 + fill-1 表达），active 下沉 1px / 透明度 0.85。
- **走带键（.eno-ctrl / .ctrl）:** hover scale 1.1，active scale 0.9；激活态（.eno-ctrl--on）亮朱字。
- **eno-ui 按钮（body .eu-btn 双类覆盖）:** primary 朱红底纸色字、secondary 细栏线边 + fill-2 底、ghost 纸色 2 字、destructive 亮朱字 + rgb(217 86 74 / 50%) 边；一律方角 3px；hover/active 底色走深朱与浮阶。禁用态 opacity 0.45。
- **过渡词汇:** 按钮族统一 0.16s var(--eno-ease)（color / background / border / transform / opacity）。

### 输入（Inputs / Fields）

- **Style:** 1px 细栏线边、方角 3px、浮墨 fill-1 底、纸色字、占位符纸色 3；与 eno-ui `.eu-input` 同规格。
- **Focus:** 边框转亮朱（#d9564a）+ 底转 fill-2；`box-shadow: none`（不发光）；全局 :focus-visible 另有 2px 亮朱 outline（offset 2px）。
- **Error / Disabled:** 错误走中文问题句 + 恢复动作（见错误策略）；禁用 opacity 0.45。
- **caret:** 亮朱（caret-color: #d9564a）。

### 标签片（Chips / Tabs）

- **Style:** 28px 高、padding 0 12px、方角 2px、细栏线边、fill-1 底、纸色 2 字（黑体 12px 600 0.04em）。
- **State:** hover 边线 rgb(240 235 221 / 28%) + 纸色字；激活（.eno-chip--on / .rank-chip--active）＝亮朱边 + 朱红浅底（14%）+ 印泥提亮字（#ef8477）——「纸色印块」的负片表达。active 按压 scale 0.97。eno-ui tab 激活态同规格（纸色字 + 16% 朱红浅底）。

### 行（Rows · 内页曲目行 SongItem）

- **Anatomy:** 64px 行 / 编号（宋体 21px 900 tabular）/ 44px 封面小图 / 曲名（宋体 17px 900）+ 小字条（12px 纸色 3）/ 时长（等宽 12px tabular 右齐 m:ss）/ hover 露出的操作。
- **States:** hover 浮墨 fill-1（z-index 提升）；激活 fill-2；正在播放：曲名转亮朱、行尾落 26px 圆印「在听」（带 eno-stamp 钤印动效）、编号转纸色。
- **排名变体:** 编号槽换 30px 铅字排名（纸色 4，前三名亮朱）；B 站音乐榜不提供 duration，时长列**留空槽**。

### 栏头（Section Headers · 双线栏头）

- **Style:** 底边 3px double rgb(240 235 221 / 38%)，宋体 21px 900（「曲目表」两字栏头用 0.28em 宽字距），padding-bottom 8px、margin-bottom 16px，基线对齐。
- **眉题位置:** 期数/首数等信息一律放栏头**右则小字**（.eno-section-sub：黑体 12px 500 0.12em 纸色 3，margin-left auto）；标题之上不设 kicker/eyebrow（craft-floor 禁项）。

### 印章（Seals · 签名组件）

「在听」是这个产品的记忆点，印章是唯一被允许「用力」的组件。

- **Anatomy（.eno-seal）:** 34px 方章，2px 亮朱边、方角 2px、-4deg 倾斜；双环内衬（inset 0 0 0 2px 墨色 + inset 0 0 0 3px rgb(217 86 74 / 55%)）模拟印泥边；字为宋体 13px 900、字距 0.12em（配 text-indent 0.12em）。
- **形制:** 方章（默认，2px 圆角）＝品牌落款「印」；圆章（`--round`，50%）＝状态钤记（「在听」「待听」「已听」）。小章（`--sm`：26px、1.5px 边、10px 字）用于行尾与封面角；`--flat` 去内衬；`--paper` 纸面变体（朱红边字 + 纸色内衬）用于分享卡。
- **同章呼应:** 正在播放的行尾圆印与播放条封面右下角（offset -8px）是同一枚章（30–34px，10–11px 字）；直播/关注人列表用 ::after 伪元素落 30px 圆章，形制一致。
- **签名动效 · eno-stamp「钤印落下」:** `animation: eno-stamp 0.34s cubic-bezier(0.16, 1, 0.3, 1) both`，从 `opacity 0 / scale(1.5) rotate(-10deg)` 落到 `opacity 1 / scale(1) rotate(-4deg)`（70% 处 opacity 已满）。**这是全系统唯一署名动效**：只在印章落下时播放，不复用于其他组件。

### 浮层（Overlays · eno-ui 重皮）

- **Toast（MessageAPI）:** 1px 细栏线边、方角 3px、rgb(38 35 48 / 96%) 底、阴影·大；文字纸色 1（0.02em）；图标按语义：info 亮靛、error 亮朱、success/warning 保留库语义绿/琥珀。
- **Dialog:** 1px 细栏线边、方角 4px、抬升面 ink-2 底、遮罩 rgb(12 10 8 / 62%)；标题用宋体 900 + 0.04em。
- **Drawer / DrawerSlideUp:** rgb(30 27 36 / 96%) 底、同款遮罩。
- **重皮机制（扩展 eno-ui 时必须遵守）:** 库规则形如 `.x[data-v-hash]`（特指度 0,2,0）且样式表在后；覆盖一律写 `body .eu-* .eu-*` 双类（特指度 0,2,1+，伪类再加一级），保证库自带样式（含其默认绿值）运行时零呈现。

### 骨架（Skeleton）

- **Style:** 方角 2px；底为 fill-1 → fill-2 → fill-1 的 400% 渐变，`eno-skeleton-shimmer 1.4s ease infinite` 横扫。用于榜单/列表加载位；行骨架维持行表节奏（行高 64px、条宽 38% / 22%）。

### 空态与错误态（Empty & Error States）

- **空态（.eno-empty）:** 纵排居中、gap 12px、padding 56px 24px、纸色 3 字；56px 方角图标框（1px 细栏线边）；标题宋体 17px 900 纸色 2；提示 13px/1.7、max-width 320px。
- **错误策略（zhError，src/shared/zhError.ts）:** 屏幕上只出现**中文问题句 + 恢复动作**（如「搜索失败」+「网络没通，歌没搜来。点『重试』再搜一次。」+ 重试按钮）；`error.message` 原文永不上屏——网络类错误统一「网络没通，请稍后重试」，已是中文的业务错误保留原文，其余用调用点中文兜底。

### 导航（Navigation · 侧栏）

- **Style:** 40px 行高、padding 0 10px、gap 14px、方角 2px、黑体 15px 500 0.02em、纸色 2 字；品牌行为宋体 21px 900 0.12em + 方印「印」（26px）。
- **States:** hover 浮墨 fill-1；active 下沉为 fill-2；**当前项**＝1px 左侧边染亮朱 + 16% 朱红浅底 + 纸色字 600——「纸色印块」的侧栏表达。
- **栏题:** 「你的音乐库」等组标题用 12px 黑体宽字距（0.18em）小字。

### 浏览器表面（Browser Surfaces）

浏览器 chrome 也属于设计（src/styles/main.css）：

- **::selection:** 纸字朱底（color #f0ebdd / background #b5342a）。
- **caret:** 亮朱 #d9564a。
- **:focus-visible:** 2px 亮朱 outline，offset 2px（全元素）。
- **滚动条:** 细纸色——`scrollbar-width: thin`，thumb rgb(240 235 221 / 22%)（hover 36%）、10px 宽、3px 透明边、2px 圆角、透明轨。
- **链接:** 亮靛 #7d93bd、下划线 offset 3px / 粗 1px；hover 转纸色。
- **行内代码:** 等宽栈、fill-1 底、细栏线边、2px 圆角、0.85em。

### 动效词汇与减弱动效（Motion Vocabulary）

| 名称 | 值 | 用处 |
|---|---|---|
| 标准缓动 `--eno-ease` | cubic-bezier(0.22, 0.61, 0.24, 1) | 一切状态过渡（0.16s 交互 / 0.18–0.22s 抬升件 / 0.4s 封面交叉淡入） |
| 钤印缓动 `--eno-ease-pop` | cubic-bezier(0.16, 1, 0.3, 1) | **只**用于印章落下与圆钮按压（eno-play-btn / Lyrics 圆钮） |
| eno-stamp 钤印 | 0.34s ease-pop both | 唯一署名动效（见印章） |
| eno-skeleton-shimmer | 1.4s ease infinite | 骨架屏微光 |
| 视图切换 | 0.18s ease（enter 上移 10px / leave 上移 6px + 淡出） | 页面/视图切换 |

**The One Signature Motion Rule（唯一署名动效律）。** 0.34s 的钤印落下是系统里唯一允许「表演」的动效；其余动效只做 0.16–0.22s 的状态反馈或 0.18s 的视图切换。新界面不得引入第二个表演性动效。

**Reduced-Motion:** `@media (prefers-reduced-motion: reduce)` 下，按钮族 / .eno-ctrl / .icon-btn / .action-icon / .play-all / 卡片瓦片 / .eno-seal 的过渡压到 0.01ms（仅 color / background-color）、transform: none、animation: none；封面交叉淡入过渡亦关闭。钤印元素直接以终态呈现（rotate(-4deg) 静态章）。

## Do's and Don'ts

### Do:

- **Do** 用 3px 双线（rgb(240 235 221 / 38%)）立栏头、用 1px 细栏线（rgb(240 235 221 / 12%)）做其余一切分隔。
- **Do** 把期数/首数等眉题信息放进栏头**右则小字**（12px 500 0.12em）。
- **Do** 正文只用纸色 1–3 与亮朱（≥12px 粗体）；纸色 4 只给 ≥24px 大字与图形。
- **Do** 时长列用等宽 tabular m:ss 右齐；数据不提供 duration（B 站音乐榜）时**留空槽**，不放占位符。
- **Do** 错误文案写成中文问题句 + 恢复动作（zhError 统一入口），`error.message` 不上屏。
- **Do** 让「在听」圆印在行尾与封面同章同形；品牌落款只用方印「印」。
- **Do** 扩展 eno-ui 组件时用 `body .eu-*` 双类选择器覆盖，并以 state-dialog / state-toast 证据复查无库默认色泄漏。
- **Do** 尊重 prefers-reduced-motion，让钤印以静态章呈现。

### Don't:

- **Don't** 在标题之上放 kicker/eyebrow 眉题（craft-floor 禁项；信息移到栏头右则）。
- **Don't** 用超过 1px 的彩色侧边框（craft-floor 禁项；侧栏当前项恰好 1px 左边）。
- **Don't** 让封面取色染指主区——墨底固定，wash 只在 CoverStage 舞台层。
- **Don't** 把朱红当大面积填充或装饰色；不要在非语义处引入绿/琥珀。
- **Don't** 圆角超过 6px、加胶囊形、给按钮加辉光（朱晕只属于播放圆盘 hover）。
- **Don't** 引入第二个表演性动效，或把 eno-stamp 复用到非印章组件。
- **Don't** 用比例数字排时长/排名列，或以横杠、估算值填补缺失时长。
- **Don't** 在 popup 里复刻书页构图（无竖排刊头、无双线栏头、无行表、hover 不藏信息）。
- **Don't** 开启玻璃/模糊滤镜（`--eno-filter-glass-*` 保持 `none`）。

## Recorded Trade-offs（设计决策记录）

1. **主区固定墨底。** CoverStage 封面取色（accent/wash/dim，取像素均值并压暗：wash = 均值×0.22 + 基准 18×0.78）只做播放舞台的氛围层：封面图 `grayscale(1) contrast(1.12) brightness(0.55)`、透明度 0.2（播放中 0.26），其上再叠 70% wash / 30% 深墨的色罩；导航、卡片、播放条、行表一律不变色。
2. **eno-ui 共享库的绿值以覆盖代替改库。** `@cloudfly/eno-ui` 自带样式文本仍含默认绿（#1db954 等 6 处规则），但所有可达绿色规则被 `body .eu-*` 双类选择器（特指度 0,2,1+ > 库 0,2,0）压制，运行时零呈现（实证 .impeccable/review/PROVENANCE.md：state-dialog.png 确认键朱红、state-toast.png）。库内文本属遗留漂移，**未**被写成本系统规则；新增 eu-* 表面必须带同款覆盖，否则绿值回潮。
3. **榜单时长空槽。** B 站音乐榜 API 不提供 duration，榜单行时长列留空槽；搜索 / 收藏夹 / 合集等数据提供处显示 m:ss。
4. **错误文案策略。** src/shared/zhError.ts 统一翻译：网络类错误给统一中文说法，中文业务错误保留原文，其余交调用点中文兜底；`error.message` 不上屏，声明 + 恢复动作成对出现。
5. **craft-floor 禁项优先于构图骨架。** FIRST VIEWPORT 的 kicker 眉题被删除（信息移入双线栏头右则小字）；>1px 彩色侧边框禁用（当前项恰好 1px）。禁项不因构图需要而复活。
6. **声明但未消费的保留值（如实记录，不当作规则）。** `--eno-fill-dark-1..4`、`--eno-filter-glass-*`（恒为 none）、`--eno-glow-ring`、`--eno-primary-glow`、`--eno-cover-accent` 在 variables.css 中声明、当前构建无消费点；它们是保留位，不代表既有视觉惯例，采用前需先有实现落点。
