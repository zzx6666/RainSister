# 官方公开素材核验与来源记录

## 官方角色原声短片

2026-10-19 另行核验了 khara 官方频道的《终章》角色宣传短片序列。以下视频只通过官方 YouTube 嵌入播放器打开，本地仅保存官方公开缩略图，不下载视频流、背景音乐或独立角色音轨。视频内包含官方角色原声与官方配乐，但它们不是可单独再分发的音频文件。

| 本地缩略图 | 角色 | YouTube ID | 官方标题 |
| --- | --- | --- | --- |
| `character-reel-shinji.jpg` | 碇真嗣 | `G1lMNnXlWHg` | Character Promotion Reel 碇シンジ |
| `character-reel-rei.jpg` | 绫波丽 | `8lxhykF9z1c` | Character Promotion Reel 綾波レイ／アヤナミレイ（仮称） |
| `character-reel-asuka.jpg` | 明日香 | `vGnp7D8U4bs` | Character Promotion Reel 式波・アスカ・ラングレー |
| `character-reel-misato.jpg` | 葛城美里 | `LR4WskvTt0Q` | Character Promotion Reel 葛城ミサト |
| `character-reel-kaworu.jpg` | 渚薰 | `OChURARqU-c` | Character Promotion Reel 渚カヲル |

对应元数据同时记录在 `character-reels.json`。赤木律子、碇源堂、SEELE 与萨基尔未找到可核验的独立官方角色宣传短片，因此页面保留合成朗读并明确显示缺口。网络上标题相同但来自第三方账号的源堂短片已经移除，不按官方素材展示。

核验日期：2026-10-19（Asia/Shanghai）

用途范围：仅用于本项目的非商业 EVA 同人演示、空间视觉与年代档案展示。本目录中的图片不代表 khara 或其他权利人对项目、角色改编、页面设计或公开传播作出授权。

本次新增 8 张图片，合计 3,322,519 字节（约 3.17 MiB），未下载任何 YouTube 视频文件。

## 命名映射与文件清单

| 项目文件 | 原始文件或缩略图 | 尺寸 | 字节 | SHA-256 前 16 位 | 建议裁切焦点 |
| --- | --- | ---: | ---: | --- | --- |
| `official-site-1995.jpg` | `images/ng/main.jpg` | 2214×2658 | 1,869,633 | `437D0D544CC2AADE` | 中心 46% / 50%；保留右侧巨大的“2015”和密集文字，避免二次缩放后文字糊成噪点 |
| `official-site-1_0.jpg` | `1_0/img/wallpaper/evawp3_1280_960.jpg` | 1280×960 | 374,548 | `1BBC9A21B4B66922` | 56% / 43%；优先保留蓝色拉米尔与城市光束，可裁掉上下红色促销边 |
| `official-site-2_0.jpg` | `2_0/img/top/noflash_eva_top_mainv.gif` 的唯一帧 | 403×586 | 101,242 | `EA99341A9ED338C1` | 50% / 47%；确保橙色主体与中央日文标题留在安全区，仅作小中尺寸卡片 |
| `official-site-3_0.jpg` | `3_0/img/index_main_04.jpg` | 960×699 | 675,293 | `047821BDB0D2C68F` | 双人构图 64% / 47%；移动端竖裁可选 78% / 42% 聚焦渚薰，或 46% / 48% 聚焦真嗣 |
| `trailer-1_0.jpg` | YouTube 视频 `uuFwvzLRF-o` 的 `maxresdefault.jpg` | 1280×720 | 68,162 | `313F8B9658067102` | 55% / 42%；保留真嗣面部与左后方橙色环境光 |
| `trailer-2_0.jpg` | YouTube 视频 `WLHNOS80_W8` 的 `maxresdefault.jpg` | 1280×720 | 104,983 | `FD3C0390E7777DC5` | 47% / 43%；保留初号机头部、跃起姿态与山体背景 |
| `trailer-3_0.jpg` | YouTube 视频 `IRQMZADWoPI` 的 `maxresdefault.jpg` | 1280×720 | 83,162 | `15B8E40CA73E6905` | 34% / 45%；保留明日香面部、红黑驾驶服与橙色碎屑 |
| `trailer-final.jpg` | YouTube 视频 `10ict3GCxGY` 的 `maxresdefault.jpg` | 1280×720 | 45,496 | `B2566978957E3227` | 39% / 45%；保留真嗣侧脸、咬痕与右侧天空留白 |

说明：`official-site-2_0.jpg` 是把官方站唯一帧 GIF 以质量 92 转为 JPEG 的静态展示版本；原始尺寸与构图未改变。其余 `official-site-*.jpg` 均直接复制自官方站原 JPEG。没有把旧文件名或重复副本留在本目录。

## 官方站核验

以下页面在本次检查中均返回 HTTP 200：

| 作品 | 核验页面 | 使用的直接图片地址 |
| --- | --- | --- |
| 1995 TV | <https://www.evangelion.jp/neon_genesis.html> | <https://www.evangelion.jp/images/ng/main.jpg> |
| 1.0 | <https://www.evangelion.jp/1_0/wallpaper.html> | <https://www.evangelion.jp/1_0/img/wallpaper/evawp3_1280_960.jpg> |
| 2.0 | <https://www.evangelion.jp/2_0/index.html> | <https://www.evangelion.jp/2_0/img/top/noflash_eva_top_mainv.gif> |
| 3.0 | <https://www.evangelion.jp/3_0/index.html> | <https://www.evangelion.jp/3_0/img/index_main_04.jpg> |
| 终章 | <https://www.evangelion.jp/final.html>、<https://www.evangelion.jp/final_bd_dvd.html> | 终章页仅定位到 OGP 品牌色卡，未选作角色场景图；终章画面改用可验证的本预告缩略图 |

权利方标注：官方站页脚、图片水印和素材语境标注为 `©khara` / `©カラー`；作品及相关角色、影像的实际权利构成以官方版权声明为准。

## YouTube 核验

官方频道元数据中显示的权利方为“株式会社カラー khara inc.official”（`khara inc.official`）。本次只保存 YouTube 提供的公开静态缩略图，没有下载视频流、音频、字幕或完整节目。

| ID | 公开元数据标题 | oEmbed | 观看页补充状态 | hqdefault | maxresdefault |
| --- | --- | --- | --- | --- | --- |
| `uuFwvzLRF-o` | 【公式】ダイジェスト これまでの『ヱヴァンゲリヲン新劇場版：序』 | 200 | 公开元数据可用 | 480×360，有效 JPEG | 1280×720，有效 JPEG |
| `WLHNOS80_W8` | 【公式】ダイジェスト これまでの『ヱヴァンゲリヲン新劇場版：破』 | 401 | 搜索页仍可索引；观看页自动化状态不稳定，未能确认无需登录即可直接播放 | 480×360，有效 JPEG | 1280×720，有效 JPEG |
| `IRQMZADWoPI` | 【公式】ダイジェスト これまでの『ヱヴァンゲリヲン新劇場版：Ｑ』 | 200 | 公开元数据可用 | 480×360，有效 JPEG | 1280×720，有效 JPEG |
| `10ict3GCxGY` | 『シン・エヴァンゲリオン劇場版』本予告【公式】 | 200 | 公开元数据可用 | 480×360，有效 JPEG | 1280×720，有效 JPEG |

标准视频地址：

- <https://www.youtube.com/watch?v=uuFwvzLRF-o>
- <https://www.youtube.com/watch?v=WLHNOS80_W8>
- <https://www.youtube.com/watch?v=IRQMZADWoPI>
- <https://www.youtube.com/watch?v=10ict3GCxGY>

`WLHNOS80_W8` 的风险处理：其 `hqdefault` 与 `maxresdefault` 均可直接访问并成功解码，故保留为静态缩略图；但不把它当作“无需登录即可播放”的公开视频，也不把缩略图用于未经核验的播放器入口。若上线时仍需播放功能，应先由人工浏览确认当前可见性。

## 授权与上线风险

1. 官方站提供可直链图片、YouTube 提供公开缩略图，不等于授权第三方下载后再分发、改编或用于商业项目。当前仅按个人非商业同人演示归档。
2. 1995 主图是官方站当前用于 TV 作品的 Blu-ray 宣传主视觉，不是动画原始赛璐璐扫描；2.0 静态图来自官方站无 Flash 回退主图，分辨率仅 403×586，适合纹理和档案卡，不适合大幅面锐利展示。
3. `official-site-1_0.jpg` 保留官方站上下红色促销边和销售文字。若要作为全屏背景，应由实现层裁切；不建议再次修改源文件后冒充“无文字剧照”。
4. 缩略图可能随频道方更新、删除、限制地区或改变可见性而失效。正式公开部署前应再次检查来源页；如权利方提出要求，应立即移除相关文件及页面引用。
5. 若项目未来转为商业发布，必须替换为明确许可的素材，或取得 khara 及相关权利人的书面授权。不能以“来源已记录”代替授权。

