# 概念视觉稿与素材来源

> **概念视觉稿，非官方海报。** 本目录中的图片只用于个人非商业同人项目的视觉开发与镜头预演，不代表 khara、官方频道、角色作者或任何权利人的授权、认可或官方物料。

合成日期：2026-10-19（Asia/Shanghai）

## 合成方式

- 使用项目内置运行环境中的 Sharp 做真实位图合成，所有角色、机体、城市、使徒、标志与星光底片均来自本项目 `assets/`。
- AT 力场、八边形棱片、HUD 线条、扫描门、胶片边框、城市建筑、LCL 波形、颗粒与落尘由 SVG 程序化几何绘制，不替代或伪造角色画面。
- 文字使用系统已安装的 Noto Serif SC、Noto Sans SC、Bahnschrift Condensed 与 Consolas 渲染；未下载外部字体、图片、视频或音频。
- 所有裁切、调色、遮罩、扫描线和文字叠压都在平面合成中完成；没有使用 AI 生成角色、AI 重绘官方画面或写实 3D 重建。
- 可复现脚本：[build-visuals.mjs](build-visuals.mjs)。脚本只写入本目录。

## 交付文件

| 文件 | 尺寸 | 用途 |
| --- | ---: | --- |
| `keyframes/k01-initialize.png` | 1920×1080 | 启动／首屏，AT 力场闭合 |
| `keyframes/k02-children.png` | 1920×1080 | 1995／2021 适格者档案廊 |
| `keyframes/k03-evangelion.png` | 1920×1080 | EVA-01 机库与深度扫描 |
| `keyframes/k04-angels.png` | 1920×1080 | 萨基尔、拉米尔与 AT 力场接触 |
| `keyframes/k05-tokyo-3.png` | 1920×1080 | Geofront 至第三新东京市上升 |
| `keyframes/k06-release.png` | 1920×1080 | 心之壁聚合与崩解 |
| `mobile/mobile-children.png` | 390×844 | 适格者场景移动端构图 |
| `mobile/mobile-release.png` | 390×844 | 终幕场景移动端构图 |
| `storyboard-contact-sheet.png` | 1920×1080 | F01—F12 十二帧动效联络表 |

## 逐张素材清单

### K01 / INITIALIZE

- `assets/characters/group.png`：背景群像底片，反转灰度后以低透明度叠入。来源：36ch 公开角色资料图，记录见 `assets/characters/CREDITS.md`。
- `assets/textures/grain.png`：项目原创胶片颗粒纹理。
- 程序化对象：八边形 AT 力场、三角棱片、同步率刻度、按钮和 HUD 线条。

### K02 / CHILDREN

- `assets/official/official-site-1995.jpg`：纸白档案层的文字纹理底片，仅作低透明度背景，不作为主视觉或角色剧照。来源：[1995 TV 官方页](https://www.evangelion.jp/neon_genesis.html)，原图 `images/ng/main.jpg`。
- `assets/characters/shinji.webp`：碇真嗣角色识别层。来源：[NeoApo 角色 1474](https://neoapo.com/characters/1474)。
- `assets/characters/rei.png`：绫波丽角色识别层。来源：[NeoApo 角色 1475](https://neoapo.com/characters/1475)。
- `assets/characters/asuka.webp`：惣流·明日香·兰格雷角色识别层。来源：[NeoApo 角色 1476](https://neoapo.com/characters/1476)。
- `assets/characters/kaworu.webp`：渚薰角色识别层。来源：[NeoApo 角色 1485](https://neoapo.com/characters/1485)。
- 程序化对象：纸纤维网格、纵深卡框、年代标签与副档案。

说明：立绘是公开同人资料，不是官方剧照；1995／2021 只表示档案结构，不把同人立绘冒充相应年份官方画面。

### K03 / EVANGELION

- `assets/official/trailer-2_0.jpg`：EVA-01 与城市背景。来源：khara 官方频道 `WLHNOS80_W8` 的公开 `maxresdefault` 缩略图，来源和可见性风险见 `assets/official/CREDITS.md`。
- `assets/textures/grain.png`：颗粒层。
- 程序化对象：机库透视梁、扫描环、缺陷坐标、机体选择器和应急橙结构线。

说明：机体画面是公开官方缩略图，不是页面自行生成的 EVA 重建。

### K04 / ANGELS

- `assets/characters/sachiel.png`：萨基尔同人插画，已在画面上标注 `FAN VISUAL`。来源：[ibisPaint 公开作品](https://cdn.ibispaint.com/movie/915/309/915309809/image915309809.png)。
- `assets/official/official-site-1_0.jpg`：远景城市、拉米尔和官方壁纸文字层。来源：[1.0 官方壁纸页](https://www.evangelion.jp/1_0/wallpaper.html)，原图 `1_0/img/wallpaper/evawp3_1280_960.jpg`。
- `assets/characters/seele.png`：SEELE 标志背景，仅以低透明度显示。来源：[BUFFALO 联名资料](https://www.buffalo.jp/contents/topics/special/eva/img/mark_seele.png)。
- 程序化对象：AT 力场棱线、中和坐标、十字准星和红色落尘。

说明：萨基尔为同人插画；拉米尔画面来自官方 1.0 壁纸。二者在画面中分开标注，不混称官方剧照。

### K05 / TOKYO-3

- `assets/official/official-site-1_0.jpg`：官方城市与蓝色拉米尔远景；裁掉部分促销边后作为远景。来源与授权记录同上。
- 程序化对象：十八组建筑、窗户灯光、装甲层、上升刻度、危险线与地下通道。
- 未使用旧方案中的现实东京雨景与视频，以免把现实空镜误认成第三新东京市官方影像。

### K06 / RELEASE

- `assets/official/official-site-3_0.jpg`：仅裁取顶部纯星光区域，经放大、降亮度与虚化作为星空底片。来源：[3.0 官方页](https://www.evangelion.jp/3_0/index.html)，原图 `3_0/img/index_main_04.jpg`。
- `assets/official/trailer-final.jpg`：右侧纵向终章影像条。来源：khara 官方频道 `10ict3GCxGY` 的公开 `maxresdefault` 缩略图。
- `assets/characters/group.png`：群体轮廓低透明度底片。
- 程序化对象：破碎八边形、LCL 波形、红色海面、终幕按钮与来源索引。

### 移动端两张

- `mobile-children.png`：重新裁切 `shinji.webp`、`rei.png`、`asuka.webp`、`kaworu.webp`，再加纸白档案层与程序化 AT 力场；未直接缩小桌面 K02，避免正文不可读。
- `mobile-release.png`：重新使用 `official-site-3_0.jpg` 纯星光裁片、`trailer-final.jpg`、程序化八边形与 LCL 波形，形成竖屏层级。

### 12 帧联络表

- 以 K01—K06 的最终合成结果为底，重新裁切并按 F01—F12 的镜头任务叠加遮片、扫描环、碎裂线和城市上升标记。
- `F01—F12` 编号、标题、说明均为清晰文字层；底图仍是概念预演，不代表官方分镜或成片截图。

## 来源优先级与风险

1. 官方站图片与 YouTube 缩略图只按 `assets/official/CREDITS.md` 记录使用；可公开访问不等于授权再分发或商业使用。
2. `official-site-1_0.jpg` 包含官方页促销边和文字。本目录只在真实素材范围内裁切和压暗，没有伪造“无文字官方剧照”。
3. 角色立绘来自 NeoApo，萨基尔来自 ibisPaint，SEELE 标志来自 BUFFALO 联名资料。逐项权利状态见 `assets/characters/CREDITS.md`。
4. 当前没有任何素材被标记为已取得正式授权。公开部署、商业使用或二次传播前必须重新评估授权；权利方要求删除时应立即替换或移除。
5. 本目录只用于视觉稿与动态分镜，不是最终网页产物。若公开上线，应保留“概念视觉稿，非官方海报”的可见声明与完整来源入口。

## 本地来源索引

- `assets/characters/CREDITS.md`
- `assets/official/CREDITS.md`
- `assets/textures/CREDITS.md`
- `assets/eva/CREDITS.md`（旧方案素材；本批视觉稿未使用其现实街景与雨窗视频）

