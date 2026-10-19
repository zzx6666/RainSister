# 新世纪福音战士 / 同步协议

一个非官方、非商业的个人同人视觉实验。项目把《新世纪福音战士》的 1995 TV、旧剧场版与新剧场版档案，组织成一套可滚动的 NERV“同步装置”：真实角色与影像作为空间材质，Three.js 程序化几何负责力场、机库、城市与终幕空间，DOM 负责可阅读、可选择、可聚焦的角色资料。

> 本项目与 khara（カラー）、Khara Inc.、EVA 制作委员会及任何官方平台无隶属、合作、赞助或背书关系。作品、角色、标志、影像和台词权利归相应权利人所有。页面中的“官方”仅用于描述素材入口或来源归属，不表示本项目获得官方授权。

当前页面是围绕角色档案展开的单页体验，固定锚点为 `#top`、`#children`、`#evangelion`、`#angels`、`#tokyo-3`、`#records`、`#release`。角色主档案主要采用 1995 TV 连续性；1995/2021 的跨年代信息以单独的翻转卡并列呈现。

## 技术栈

| 层级 | 当前实现 |
| --- | --- |
| 构建与开发 | Vite 7、TypeScript 5.9、ES Modules |
| 3D 渲染 | Three.js `WebGLRenderer`；每个场景独立模块并按需动态加载 |
| 滚动与 DOM 动效 | GSAP 3、`ScrollTrigger`、CSS 3D |
| 程序化画面 | Three.js 几何与材质、WebGL shader、Web Audio API、Canvas 降级纹理 |
| 页面结构 | 原生 HTML、TypeScript 模板与 CSS；不使用 React |
| 字体 | 本地自托管 WOFF2；不依赖运行时字体 CDN |

渲染入口位于 `src/main.ts`。`src/scenes/SceneManager.ts` 只维持一个 WebGL 场景和渲染循环，场景切换时释放旧模块；`src/data.ts` 集中保存角色、机体、使徒、年代与文案数据，`src/ui.ts` 生成可读 DOM，`src/bgm.ts` 通过本地音频元素交叉淡化七条章节配乐。

当前质量策略为 HIGH / MEDIUM / LOW：桌面大屏优先高画质，移动端或低内存设备直接使用 LOW；持续低于 45fps 两秒会自动降到 LOW。启用 `prefers-reduced-motion` 时关闭 WebGL 场景，只保留可读 DOM 与基本交互。

## 安装与运行

建议使用 Node.js 20.19+ 或 22.12+，并确认 npm 可用。

```powershell
npm install
npm run dev
```

开发服务器固定为：

```text
http://127.0.0.1:4173/
```

端口在 `vite.config.ts` 中设置为 `strictPort: true`。若 `4173` 已被占用，Vite 会直接报错，不会自动切换端口。

### npm 命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器，地址为 `127.0.0.1:4173` |
| `npm run check` | 执行 `tsc --noEmit`，只做 TypeScript 类型检查，不输出文件 |
| `npm run build` | 先执行类型检查，再用 Vite 生成静态 `dist/` |
| `npm run preview` | 预览已经生成的 `dist/`，同样使用 `127.0.0.1:4173` |

典型交付流程：

```powershell
npm run check
node .\scripts\verify-content.mjs
npm run build
npm run preview
```

## 七场结构与固定锚点

来源：`src/ui.ts`、`src/scenes/SceneManager.ts` 与 `research/storyboard.md`。分镜文档是视觉设计契约；下文只描述当前代码已经实现的空间行为，不把分镜中的未来设想当作现有功能。

| 场次 | 固定锚点 | 导航标签 | 当前实现 |
| --- | --- | --- | --- |
| 00 / INITIALIZE | `#top` | 接入 | 首屏 DOM 标题、同步读数、角色入口；`ATFieldScene` 绘制红色八面体线框、同心环和粒子，滚动推动镜头穿入力场 |
| 01 / CHILDREN + COMMAND | `#children` | 适格者 | `ChildrenScene` 将群像和驾驶员立绘布置为纵深画面；DOM 按“主角团 / 反派主角团”展开 9 份角色档案，并插入 1995/2021 翻转卡 |
| 02 / EVANGELION | `#evangelion` | 机体 | `HangarScene` 建立四个机体舱位、机库梁架与移动扫描线；`00 / 01 / 02 / 08` 选项卡同步切换机体资料 |
| 03 / ANGELS | `#angels` | 使徒 | `AngelScene` 以二十面体线框、碎片、力场环和粒子构成 AT 力场；点击或按 Enter 可中和力场并重新聚合 |
| 04 / TOKYO-3 | `#tokyo-3` | 东京-3 | `TokyoScene` 用 InstancedMesh 从地下生成程序化楼群，镜头随滚动抬升；没有使用旧风景照片代替第三新东京市 |
| 05 / RECORDS | `#records` | 年代 | `RecordsScene` 将 1995、1997、2007、2009、2012、2021 六块年代牌排成纵深走廊；DOM 提供年代切换与官方页面入口 |
| 06 / RELEASE | `#release` | 解除 | `ReleaseScene` 使用 GLSL 海面材质、八面体心之壁和粒子完成解场；终幕进入白场来源卡与返回入口 |

所有场景共用 `SceneModule` 接口：`mount`、`setProgress`、`setPointer`、`setAudioLevel`、`activate`、`deactivate`、`render`、`dispose`。滚动只驱动镜头与场景进度，不劫持滚轮。

## 视觉稿与动态分镜

实现前已产出 16:9 构图稿、移动端构图与 12 帧动态分镜。它们是非官方概念视觉，不是官方海报；逐张来源见 `visuals/CREDITS.md`，复现脚本为 `visuals/build-visuals.mjs`。

| 文件 | 内容 |
| --- | --- |
| `visuals/keyframes/k01-initialize.png` | 启动 / AT 力场首屏 |
| `visuals/keyframes/k02-children.png` | 1995 / 2021 角色纵深空间 |
| `visuals/keyframes/k03-evangelion.png` | EVA 机库与深度扫描 |
| `visuals/keyframes/k04-angels.png` | 使徒接触与 AT 力场中和 |
| `visuals/keyframes/k05-tokyo-3.png` | Geofront 到第三新东京市上升 |
| `visuals/keyframes/k06-release.png` | 心之壁聚合与终幕 |
| `visuals/storyboard-contact-sheet.png` | F01—F12 连续动态分镜 |
| `visuals/mobile/mobile-children.png` | 390×844 角色空间构图 |
| `visuals/mobile/mobile-release.png` | 390×844 终幕构图 |

## 角色、阵营与初登场

角色数据定义在 `src/data.ts`，显示顺序由 `characters` 数组和 `faction` 过滤决定。所有 9 份主档案的 `continuity` 字段均为 `1995`，不会把新剧场版角色直接混入旧 TV 档案。

### NERV / 主角团

| 顺序 | 角色 | 档案编号 | 初登场 | 机体 / 系统 |
| ---: | --- | --- | --- | --- |
| 1 | 碇真嗣 | `N-01` | EP.01「使徒、襲来」 | EVA-01 |
| 2 | 葛城美里 | `N-02` | EP.01「使徒、襲来」 | 作战指挥 |
| 3 | 赤木律子 | `N-03` | EP.01「使徒、襲来」 | MAGI |
| 4 | 绫波丽 | `N-04` | EP.01「使徒、襲来」 | EVA-00 |
| 5 | 惣流·明日香·兰格雷 | `N-05` | EP.08「アスカ、来日」 | EVA-02 |

### SEELE / 反派主角团

“反派主角团”是页面阵营名称：萨基尔是使徒，碇源堂仍隶属 NERV 总司令部，但它们与 SEELE、渚薰一起作为对抗性/幕后阵营展示。

| 顺序 | 角色 | 档案编号 | 初登场 | 机体 / 系统 |
| ---: | --- | --- | --- | --- |
| 1 | 萨基尔 | `A-01` | EP.01「使徒、襲来」 | 第三使徒 |
| 2 | 碇源堂 | `A-02` | EP.01「使徒、襲来」 | 司令权限 |
| 3 | SEELE | `A-03` | EP.02「見知らぬ、天井」 | 集体意志 |
| 4 | 渚薰 | `A-04` | EP.24「最後のシ者」 | Tabris / EVA-02 |

每份角色档案包含立绘、初登场、所属、机体或系统、连续性、独处记录、台词与播放按钮。页面中的同步率标明为“设计演出数据”，不是官方设定值。

1995/2021 翻转卡单独列出碇真嗣、绫波丽、明日香、渚薰与真希波·玛丽。明日香区分“惣流”与“式波”；真理的 TV 面保留 `NO RECORD`，不补造旧作画面。由于当前本地素材有限，翻转卡两面复用已有角色立绘，只用于并列文字信息，不宣称为分别对应两个年代的官方剧照。

## 合成日语语音

`assets/audio/ja/` 中有 9 条 MP3，分别挂载到 9 个角色按钮：

| 文件 | 角色 / 对象 |
| --- | --- |
| `shinji.mp3` | 碇真嗣 |
| `misato.mp3` | 葛城美里 |
| `ritsuko.mp3` | 赤木律子 |
| `rei.mp3` | 绫波丽 |
| `asuka.mp3` | 惣流·明日香·兰格雷 |
| `sachiel.mp3` | 萨基尔信号语音 |
| `gendo.mp3` | 碇源堂 |
| `seele.mp3` | SEELE 议会语音 |
| `kaworu.mp3` | 渚薰 |

现有来源记录确认使用 `edge-tts`，涉及 `ja-JP-KeitaNeural` 与 `ja-JP-NanamiNeural` 两个语音模型。MP3 没有内嵌可核验的作者或模型标签，逐文件声线映射仍待补。

这些文件全部是**合成音声，不是原声优录音、官方对白音频或官方角色语音**。页面继续显示“合成音声，非原声”。同一条音频使用单例 `<audio>` 播放，同一时间只播放一条；播放角色语音时，场景 BGM 会自动降低。

## 官方原声短片与章节 BGM

碇真嗣、绫波丽、明日香、葛城美里、渚薰五人的角色卡提供 khara 官方频道 `Character Promotion Reel` 链接。短片只通过官方 YouTube 嵌入播放器打开，页面保存的本地缩略图用于入口识别；不下载、不拆条官方视频流、原声或配乐。赤木律子、碇源堂、SEELE、萨基尔没有可核验的独立官方角色短片，页面保留合成朗读并明确显示这一缺口。ID 和来源见 `assets/official/character-reels.json`。

`src/bgm.ts` 使用 `assets/audio/bgm/` 中七条项目原创循环音轨，按七个章节交叉淡化：接入、适格者、机库、使徒、第三新东京市、年代档案与终幕。BGM 默认关闭，用户点击“开始同步”或顶部 BGM 开关后才启动；打开官方视频时自动暂停，关闭后恢复。它们不是 EVA OST，也不含官方原声采样。生成方式见 `assets/audio/bgm/CREDITS.md`。

## 官方影像入口与本地缩略图边界

就当前采用的官方影像而言，页面本地只保存官方站图片和 YouTube 公开缩略图，不下载、转存或重新托管 YouTube 视频流。用户在 `#records` 主动点击“打开官方预告”后，页面才创建 `youtube-nocookie.com` 嵌入播放器；关闭弹窗会清空 iframe。

| 年份 | 官方视频 ID | 本地文件 |
| --- | --- | --- |
| 2007 / 1.0 | `uuFwvzLRF-o` | `assets/official/trailer-1_0.jpg` |
| 2009 / 2.0 | `WLHNOS80_W8` | `assets/official/trailer-2_0.jpg` |
| 2012 / 3.0 | `IRQMZADWoPI` | `assets/official/trailer-3_0.jpg` |
| 2021 / 终 | `10ict3GCxGY` | `assets/official/trailer-final.jpg` |

1995 与 1997 档案不显示预告嵌入按钮，只提供官方作品页面入口。1997 旧剧场版没有可靠本地剧照，页面使用 `LOCAL IMAGE / NO RECORD` 空档案，不以其他图片冒充。

本地缩略图只用于年代档案的画面索引，不代表视频或图片已经取得再分发许可。`WLHNOS80_W8` 在现有核验中曾出现 oEmbed 401、观看可见性不稳定的问题，公开部署前必须再次人工检查；缩略图可访问也不等于视频可公开播放。完整来源见 `assets/official/CREDITS.md`。

## 素材目录

素材统一按类型放在 `assets/`，不在项目根目录或 `src/` 中散放媒体文件。

| 目录 | 当前内容 | 当前状态 |
| --- | --- | --- |
| `assets/characters/` | 10 张角色、群像、使徒与 SEELE 图；5 个来源侧车 JSON；1 份目录来源文档 | 页面采用；同人来源与原作者信息仍需确认 |
| `assets/official/` | 4 张官方站图片、4 张 YouTube 缩略图、1 份来源文档 | 仅用于非商业档案展示；授权未取得 |
| `assets/audio/ja/` | 9 条日语合成 MP3 | 页面采用；逐文件模型映射与服务条款待补 |
| `assets/fonts/` | 3 个拉丁字体 WOFF2、91 个 Noto Serif JP 分片、4 份 OFL 文本和 `LICENSES.md` | 自托管开源字体；公开上线前继续复核 |
| `assets/textures/` | `grain.png`、`scanlines.png`、生成脚本与来源文档 | 项目原创程序化资产 |
| `assets/eva/` | 5 张旧照片、1 个旧 WebM、1 份旧来源文档 | 页面未使用；暂不删除 |
| `assets/photos/` | 6 张旧雨景照片 | 页面未使用；暂不删除 |
| `assets/video/` | `reel.mp4` | 页面未使用；暂不删除 |
| `assets/audio/night-signal.wav` | 旧环境声文件 | 页面未使用；暂不删除 |

本次全项目权利清单位于根目录 `CREDITS.md`。新增素材前应先放入对应目录，补来源侧车记录，并登记到 `CREDITS.md`；不能用“URL 可访问”代替“已经取得授权”。

### 旧素材标记

旧方案留下的 `assets/eva/`、`assets/photos/`、`assets/video/reel.mp4` 与 `assets/audio/night-signal.wav` 已被 `CREDITS.md` 标记为“未在页面使用，可后续清理”。当前页面不再引用雨窗视频、旧雨景照片或 `night-signal.wav`；文件仍保留在原位置，等待项目结束后统一处理和复核，不在本文档流程中删除。

## 程序化纹理

`assets/textures/` 中的两张 PNG 均由仓库内脚本生成，没有使用图片生成模型、第三方纹理或网络下载素材：

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| `grain.png` | 256 × 256 | 固定种子的可平铺胶片颗粒；用于页面 soft-light 噪点层 |
| `scanlines.png` | 64 × 8 | RGBA CRT 扫描线；用于 SEELE 黑红档案与机库叠层 |

复现命令：

```powershell
node .\assets\textures\generate-textures.mjs
```

生成脚本会检查 PNG 签名、CRC、IHDR、IDAT 扫描线、透明度分布和 SHA-256。固定种子、尺寸、生成方式与哈希记录见 `assets/textures/CREDITS.md`。

## 字体许可

项目自托管以下字体，不使用运行时字体 CDN：

| 字体 | 用途 | 许可 |
| --- | --- | --- |
| Noto Serif JP 900 | 中日文标题、引语与巨幅排版 | SIL Open Font License 1.1 |
| Bodoni Moda | 拉丁标题与读数 | SIL Open Font License 1.1 |
| Archivo Narrow | 技术标签与导航 | SIL Open Font License 1.1 |
| Source Serif 4 | 正文 | SIL Open Font License 1.1 |

`src/noto-serif-jp.css` 由 `scripts/build-noto-font.ps1` 按页面实际字符生成，并把 91 个字符子集分片保存在 `assets/fonts/noto-serif-jp/`。四个字体家族的许可证全文位于 `assets/fonts/OFL-*.txt`，来源和用途汇总见 `assets/fonts/LICENSES.md`。根目录 `CREDITS.md` 仍把公开上线前的字体与发布包审计列为待办，不能仅凭本地 OFL 文件宣称整个发布包已经完成合规审计。

## 内容验证

项目提供内容与资源引用验证脚本：

```powershell
node .\scripts\verify-content.mjs
```

该脚本通过 Vite SSR 加载真实页面模板与数据，检查：

- 7 个固定场景锚点是否齐全；
- 18 条独处文案是否全部进入 DOM；
- HTML 中是否存在重复 `id` 或失效的页内锚点；
- 9 个角色合成语音按钮与 5 个官方原声短片入口是否全部挂载；
- 七条章节 BGM 是否存在；
- 9 个角色是否都有立绘和音频；
- 页面模板是否重新引用已停用的旧媒体；
- 官方素材来源说明是否包含非商业范围；
- 程序化纹理和关键本地缩略图是否存在。

成功时会输出“7 个场景、9 个角色档案、18 条独处文案、9 个合成语音、5 个官方原声短片、7 条场景 BGM”。

验证边界：该脚本只检查内容、结构和本地引用，不代替浏览器视觉验收，也不证明音频实际可播、YouTube 当前可见、移动端布局无溢出或交互无障碍全部通过。本项目当前不声明新版页面已经完成截图验收；跨分辨率构图、触控、键盘、WebGL 降级和真实播放仍应在 `1920×1080`、`1440×900`、`390×844` 等环境中实际检查。

## 已知授权与发布风险

`CREDITS.md` 的当前审计结论是：明确取得授权并覆盖现状的素材数量为 **0**。以下事项是公开传播或商业使用前的主要风险：

1. 角色立绘、群像、萨基尔同人插画与 SEELE 标志来自公开网络页面，部分原作者、许可范围和再分发条件没有完整证据链。
2. 官方站图片和 YouTube 缩略图可公开访问，不等于允许第三方下载、保存、改编或再次分发。
3. 9 条日语 MP3 是 `edge-tts` 合成音声，不是原声优录音；作品台词短引用、原创拟写、拟态指令与合成语音的权利边界必须分别复核。
4. YouTube 视频可能删除、限制地区或改变可见性；`WLHNOS80_W8` 的观看状态尤其需要在公开部署前重新确认。
5. 字体虽有本地 OFL 文本，但发布包仍需保留许可、来源、字符分片与必要声明，不能把“开源字体”简化为“无需任何合规检查”。
6. 当前页面是非商业同人演示，不构成任何权利人的授权、合作、赞助或背书。转为商业项目、广告、付费活动或众筹前，应停止使用待确认素材并重新取得许可。

如权利人提出更正署名、限制传播或移除内容，应优先处理相关素材与页面引用。

## 相关文档

- `research/storyboard.md`：七场叙事、镜头、空间行为、性能与其他设计契约。
- `CREDITS.md`：全项目素材、字体、合成语音、旧素材和公开上线风险清单。
- `assets/characters/CREDITS.md`：角色与同人素材来源。
- `assets/official/CREDITS.md`：官方站图片、YouTube 缩略图核验与边界。
- `assets/textures/CREDITS.md`：程序化纹理生成记录与哈希。
- `assets/fonts/LICENSES.md`：本地字体来源与许可汇总。
