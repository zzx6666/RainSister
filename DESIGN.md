---
name: "同步协议 / SYNC PROTOCOL"
description: "以近黑、暖纸、警报红与应急橙构成的 EVA 双阵营同步观测电影。"
colors:
  void: "#050504"
  ink: "#0b0a08"
  paper: "#e8e3d7"
  paper-bright: "#f5f0e4"
  bone: "#d9d3c5"
  signal-red: "#d22a1f"
  signal-red-text: "#e33a2c"
  signal-red-on-paper: "#b8271d"
  transmission-red: "#7b100d"
  emergency-orange: "#f06b3b"
  sync-acid: "#b9dc55"
  eva-purple: "#60477f"
  tokyo-blue: "#5884aa"
  muted: "#8d887d"
  faint-line: "rgba(232, 227, 215, 0.2)"
  structural-line: "rgba(232, 227, 215, 0.25)"
typography:
  display:
    fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", "Songti SC", "SimSun", serif'
    fontSize: "clamp(4.2rem, 9.7vw, 9.5rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", "Songti SC", "SimSun", serif'
    fontSize: "clamp(3.2rem, 6.4vw, 6.4rem)"
    fontWeight: 900
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  title:
    fontFamily: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", "Songti SC", "SimSun", serif'
    fontSize: "clamp(2.5rem, 4.4vw, 4.7rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  body:
    fontFamily: '"Source Serif", "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", "Songti SC", serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: '"Archivo Narrow", "Arial Narrow", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.08em"
  metric:
    fontFamily: '"Bodoni Moda", "Times New Roman", serif'
    fontSize: "clamp(2.8rem, 4.5vw, 4.6rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  square: "0"
spacing:
  hairline: "4px"
  tight: "8px"
  compact: "12px"
  control-inline: "18px"
  panel: "32px"
  section: "clamp(110px, 14vw, 190px)"
  gutter: "clamp(24px, 6vw, 104px)"
components:
  action-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.void}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0 18px"
    height: "48px"
  action-primary-hover:
    backgroundColor: "{colors.sync-acid}"
    textColor: "{colors.void}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0 18px"
    height: "48px"
  action-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0 18px"
    height: "48px"
  voice-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "9px 12px"
    height: "58px"
  official-reel:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "6px"
    height: "58px"
  machine-tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0 clamp(13px, 2.3vw, 28px)"
    height: "54px"
  field-trigger:
    backgroundColor: "transparent"
    textColor: "{colors.paper-bright}"
    typography: "{typography.title}"
    rounded: "{rounded.square}"
    padding: "22px"
    height: "118px"
  era-tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "8px"
    height: "62px"
  trailer-dialog:
    backgroundColor: "{colors.void}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0"
    width: "min(1080px, calc(100vw - 32px))"
---

# Design System: 同步协议 / SYNC PROTOCOL

## Overview

**Creative North Star: "同步观测电影 / The Synchro Observation Film"**

这套系统把《新世纪福音战士》组织成一件可滚动的同步观测装置：单一 WebGL 画布提供镜头、力场、机库和城市纵深，DOM 在其上承载可读档案、控制与来源说明。设计单位不是卡片，而是空间、镜头位置与信息层；滚动推进观察进度，指针只做有限视差，声音开启后才会进入章节音乐状态。

双阵营靠“物质”而不只靠颜色区分。NERV 使用暖纸、近黑正文与荧光绿同步状态，紫与蓝只作为机体和城市条件色；SEELE 则在近黑传输面上使用警报红、应急橙、扫描线和硬切文字，像一段从系统内部收到的广播。两者的字体骨架相同，差异来自底色、边框、字距、遮片与运动方向。

声音是可选的状态层，不是背景装饰：七个章节各自对应一条原创 BGM，默认静音，开启后在章节之间交叉淡化；角色合成语音会压低 BGM，官方原声短片只经用户触发并在原生对话框中进入。所有视觉与交互事实以当前构建代码为准，本文不构成截图、无障碍或性能验收结论。

**Key Characteristics:**

- 近黑空间、暖纸档案与高稀缺警报红共同构成主层。
- WebGL、CSS 3D、扫描线、颗粒和遮片负责纵深，卡片阴影不负责纵深。
- NERV 向上浮入、纸张展开；SEELE 横向切入、故障闪断。
- 大字号 Mincho 负责叙事，Bodoni 负责同步率与距离，Archivo Narrow 负责仪表标签。
- 所有声音默认关闭，章节 BGM、合成语音和官方影像入口都有可见状态。
- 直角、1px 细线、45° 力场框和硬遮片贯穿全站。

## Colors

颜色数值以 YAML frontmatter 为唯一事实源。总体是“黑纸上的警告信号”：红与橙负责危险和传输，纸色负责可读性，酸绿只表示同步或选中。

### Primary

- **Signal Red**：章节主标题、AT 力场、选中下划线和阵营边界的主警报色；它不是普通装饰红。
- **Signal Red Text**：深色底上的小字号信号文字，避免把标准红直接用于低对比小字。
- **Signal Red on Paper**：纸色档案上的小字号红文字，专门承担索引、强调与来源标签。
- **Transmission Red**：SEELE 边界、选中底和低亮传输红，形成比主红更沉、更制度化的层次。
- **Emergency Orange**：使徒中和、SEELE 交互、终幕解除与悬停反馈的应急橙，代表系统已经进入执行态。

### Secondary

- **Warm Paper**：NERV 角色档案的主要阅读面，也是双阵营之间最鲜明的材料切换。
- **Bright Paper**：反白标题、终幕来源卡和高对比文字面。
- **Bone**：深色背景上的正文与次级信息色，比纯白更接近印刷纸。

### Tertiary

- **Sync Acid**：同步率、选中状态、顶部声音按钮和初号机相关状态；只承担“系统在线”，不承担正文。
- **Eva Purple**：紫作为机体与适格者的条件色出现，不能变成第二主色。
- **Tokyo Blue**：仅属于第三新东京市、月光与城市读数，不能扩散为通用科技蓝。

### Neutral

- **Void Black**：页面基座、模态背板和 SEELE 传输底。
- **Ink Black**：纸面正文、黑色交互态和固定 HUD 的深层。
- **Muted Gray**：次级说明、坐标、版权与技术标签。
- **Faint Line**：低压分隔与轨道。
- **Structural Line**：固定栏、标签页、证据区和面板边界的 1px 结构线。

### Named Rules

**The Faction Ground Rule.** NERV 的阅读面以暖纸建立，SEELE 的阅读面以近黑传输建立；同一信息不能只换一个标签色就声称完成了阵营区分。

**The Small Signal Rule.** 深底小字使用 Signal Red Text，纸面小字使用 Signal Red on Paper；标准 Signal Red 留给大字号、边框、背景块和状态线。

## Typography

**Display Font:** Noto Serif JP（Yu Mincho、Hiragino Mincho ProN、Songti SC、SimSun 回退）
**Body Font:** Source Serif（Noto Serif JP 与中文宋体回退）
**Label/Mono Font:** Archivo Narrow（Arial Narrow 回退）
**Metric Font:** Bodoni Moda（Times New Roman 回退）

**Character:** 大字号 Mincho 是叙事的“纪念碑”，Source Serif 负责可停留的阅读，Archivo Narrow 像 NERV 仪表上的印刷标签，Bodoni 只把同步率和距离变成电影片头式读数。双阵营共享这套骨架，不额外引入第二套字体来伪装阵营差异。

### Hierarchy

- **Display**（900，clamp 4.2–9.5rem，0.82 行高）：首屏日文与超大电影标题；允许紧到接近印刷叠版。
- **Headline**（900，clamp 3.2–6.4rem，0.96 行高）：章节主叙事与大型断言。
- **Title**（900，clamp 2.5–4.7rem，1 行高）：角色名、机体名与使徒名。
- **Body**（400，16px，1.65 行高）：角色介绍、档案、说明和来源文字；阅读段建议控制在 48–72ch。
- **Label**（400 为基底，诊断重点用 700，12px / 0.08em）：章节索引、技术读数、按钮、来源和坐标。
- **Metric**（400，clamp 2.8–4.6rem，1 行高，-0.04em）：同步率、距离和数值型遥测。

### Named Rules

**The Single Type Spine Rule.** 阵营差异优先通过纸/传输底、红/酸绿状态、遮片和运动建立；不要让 NERV 与 SEELE 各自拥有一套互不相干的字体系统。

## Layout

页面以 `100svh` 场景段组织，章节使用 `clamp(110px, 14vw, 190px)` 的纵向呼吸与 `clamp(24px, 6vw, 104px)` 的横向边距。固定 HUD 高 58px，滚动章节轨固定在左侧；窄屏时导航隐藏，信息回到正常文档流。所有锚点保留 72px 的滚动余量。

模块采用角色明确的分栏，而不是统一卡片网格：角色档案使用交替主副栏，机体详情使用宽影像/窄读数栏，使徒使用力场控制/档案栏，年代使用影像/说明栏。对照关系重要时，边界、编号和读数应沿同一轴线排列；这不是要求所有后续页面复用同一种局部构图。

响应式阈值为 1180px、920px 和 620px。1180px 开始压缩 HUD 与双栏比例，并把连续性卡片改为横向胶片带；920px 隐藏桌面导航与竖向章节轨，双栏收为单栏，标签组转为横向可滚动；620px 使用 20px 内容边距、54px HUD，把首屏遥测与免责声明放回流式顺序，并保留 44px 以上的主要触控目标。

## Elevation & Depth

系统是“平面材料 + 空间镜头”的混合，不做浮起卡片。固定 WebGL 画布位于底层，颗粒层叠在画布与内容之间，DOM 内容在其上；HUD、滚动轨和传输面板靠层级、透明度、模糊与裁剪取得深度。常规卡片没有 box-shadow，纵深来自相机推进、前景遮片、扫描线、图层色差与纸/黑两种材料的直接切换。

### Shadow Vocabulary

- **Selected machine underline**（`box-shadow: inset 0 -2px var(--acid)`）：表示 EVA 编号处于同步选中态。
- **Selected era underline**（`box-shadow: inset 0 -2px var(--red)`）：表示年代索引处于选中态。
- **Archive glitch**（`text-shadow: 3px 0 var(--red), -3px 0 rgba(240, 107, 59, 0.55)`）：只在使徒力场中和后的档案裂解中出现。

### Named Rules

**The Camera-Not-Card Rule.** 深度先由 WebGL 镜头、图层与遮片建立；不要用大面积投影或通用玻璃卡片替代空间关系。

## Shapes

全站使用直角（0px），通过 1px 细线、硬边面板、45° 八边/八面力场、22.5° 与 67.5° 的叠加框、`-7deg` 的 SEELE 斜切框和虚线档案空位构成形状语言。首屏技术框、角色纸面和终幕白卡都不做圆角；圆角会破坏 90 年代印刷、军规仪表与电影遮片的直接性。

### Named Rules

**The Hard Edge Rule.** 结构面保持 0px 圆角；斜切、旋转或虚线只能服务于力场、传输与缺项语义，不能成为任意装饰。

## Components

### Primary and Quiet Actions

- **Shape:** 直角（0px），1px 边框，至少 48px 高。
- **Primary:** 暖纸底、近黑文字、Archivo Narrow 14px、`0 18px` 横向内距；悬停切换为 Sync Acid 并向阅读方向位移 4px。
- **Quiet:** 透明底、纸色文字与结构线；悬停改为 Bone 底和近黑文字。
- **Focus:** 2px Sync Acid 外框、4px offset；按钮不以阴影表示焦点。

### Character Dossier

NERV 档案以暖纸为整块阅读面，立绘用 `multiply` 融入纸张，编号是低对比大字；SEELE 档案放在近黑底上，使用灰度 `screen` 立绘、扫描线、红色斜切框和橙色状态字。两者都保留 1px 结构线、来源文字、初登场顺序、独处记录和声音状态，视觉差异不能删掉可读信息。

### Voice Button and Official Reel

- **Voice Button:** 至少 58px 高，透明底、Ink 边框，左侧播放/暂停图标，右侧五条 2px 声柱；播放时以 640ms、`steps(4)` 更新声柱，并用 `aria-pressed` 同步文字、标号和视觉状态。
- **Official Reel:** 至少 58px 高，64×42px 灰度缩略图、两行说明；纸面悬停转为 Ink 底与纸色文字，SEELE 面悬停转为 Emergency Orange 底与黑字。
- **Boundary:** “合成音声 · 非原声”与“官方原声短片”必须同时可见；合成语音不能伪装成原声优表演。没有可核验独立短片的角色只提供 khara 官方频道入口，不用第三方视频补位。

### Machine Tabs

四项等宽标签沿 1px 结构线排列，至少 54px 高；编号使用 Bodoni 21px 红字，标签使用窄体。选中态用低亮酸绿底与 2px 内置酸绿下划线，不移动卡片；窄屏保留横向滚动，不把四项压到无法辨认。

### AT Field Neutralization

中和控件是 118px 高的应急面板，直角、Signal Red 边框、纸色大标题和橙色操作提示。悬停以 Emergency Orange 整面执行态向侧面推进 5px；触发后档案使用 `620ms steps(6)` 的 clip-path 与横向错位裂解，状态文字从 `LOCKED` 切换为 `NEUTRALIZED`。这是状态转换，不是无限故障循环。

### Era Tabs

六个年代按 62px 高并排，年份使用 Bodoni，连续性标签使用窄体。选中态用 13% 红底与 2px 内置红下划线；920px 以下横向滚动，620px 保留约 90px 一项，保证年代与连续性仍可成组阅读。

### Trailer Dialog

官方影像进入 16:9 原生对话框：近黑底、Signal Red 1px 边框、50px 标题栏与 44×44px 关闭按钮；关闭后移除 iframe，恢复 BGM，阻止后台播放。外部来源与“YouTube 官方嵌入”说明始终位于播放器下方。

### Motion and Audio State

NERV 角色从下方上浮 56px，使用 `power3.out`、820ms；SEELE 角色从左右横向切入 56px，伴随 `blur(8px)` 与 `steps(5)` 硬切。年代详情用从左向右的 `clip-path` 揭示；连续性卡片支持水平拖动时最多 ±18° 的限量旋转，松手回中，点击或键盘以 720ms 翻转。指针视差只作用于 WebGL 相机，不拖动正文；减少动态时所有动画时长压至 0.001ms，并保留静态翻面内容。

七条 BGM 由章节驱动，播放时正常音量 0.38、语音压低至 0.10；章节切换 760ms 交叉淡化，初次开启 620ms，关闭 360ms。顶部 HUD、首屏遥测、按钮和声柱共同显示实际状态，不用“正在播放”的静态假读数。

## Do's and Don'ts

### Do:

- **Do** 用暖纸与近黑传输面先建立阵营，再叠加红、橙、酸绿、紫和蓝的条件状态。
- **Do** 把 WebGL 当作镜头与空间层，把 DOM 当作可读、可聚焦、可复制的档案层。
- **Do** 为每个声音入口提供明确的开启、暂停、失败与来源说明；默认静音，并允许从首屏静音浏览。
- **Do** 使用直角、1px 细线、裁切、扫描线和步骤动画，让电影式的硬边成为系统性格。
- **Do** 在窄屏保留横向标签带，同时保证主要触控目标至少 44px。
- **Do** 把官方视频作为外部嵌入或外链，保留非官方、非商业与来源边界。

### Don't:

- **Don't** 把系统做成通用霓虹科幻 HUD、圆角玻璃卡或无限粒子背景。
- **Don't** 用同一套淡入视差代替章节差异；NERV 上浮、SEELE 横切、机体扫描、使徒裂解和城市上升必须保持各自行为。
- **Don't** 把 Acid Green、Eva Purple 或 Tokyo Blue 当作全站通用强调色；它们只在对应状态和语境中出现。
- **Don't** 自动播放声音、跳过用户手势加载官方视频，或把合成语音标成原声。
- **Don't** 用投影、圆角或模糊伪造纵深，掩盖镜头、材料和信息层的关系。
- **Don't** 把本文当作截图验收、无障碍合格、性能实测或素材授权完成的证明。
