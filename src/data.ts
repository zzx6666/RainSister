export type Faction = "nerv" | "seele";
export type Continuity = "1995" | "1997" | "rebuild";
export type QualityTier = "high" | "medium" | "low";

export interface VisualRecordMeta {
  depthLayers: number;
  cameraPath: string;
  qualityTier: QualityTier;
  sourceReviewedAt: string;
}

export interface MediaCredit {
  id: string;
  kind: "character-art" | "official-image" | "video-thumbnail" | "synthetic-voice" | "original-score";
  sourceUrl: string;
  rightsStatus: "待确认" | "项目原创" | "官方外链";
  usage: string;
  reviewedAt: string;
}

const assetModules = import.meta.glob(
  [
    "../assets/characters/*.{png,jpg,jpeg,webp,gif}",
    "../assets/audio/ja/*.mp3",
    "../assets/audio/bgm/*.wav",
    "../assets/official/*.{png,jpg,jpeg,webp}",
  ],
  {
  eager: true,
  import: "default",
  query: "?url",
  },
) as Record<string, string>;

export function asset(path: string, fallback = ""): string {
  return assetModules[`../assets/${path}`] ?? fallback;
}

export const solitudeLines = [
  { id: "L01", text: "独处，是与自己的和解。" },
  { id: "L02", text: "我与我自己的关系，比任何关系都长久，于独处中，生长出完整的自己。" },
  { id: "L03", text: "比起被左右的生活，我更爱无人问津的日子。" },
  { id: "L04", text: "高质量独处，胜过低质量周旋，与自己相处，才是终身修行。" },
  { id: "L05", text: "不必迎合众生，我自有我的晨昏与四季。" },
  { id: "L06", text: "我站在街角，不等任何人，只等自己的心跳与世界的节奏同频。" },
  { id: "L07", text: "独处不是孤独，是自由的栖息地。" },
  { id: "L08", text: "一个人走路，是和地球的单独约会，风是自由的，我也是。" },
  { id: "L09", text: "在独处的岛屿，我是自由的船长，掌舵自己的命运之舟。" },
  { id: "L10", text: "风吹哪页读哪页，花开何时看何时，独处是生活的诗，无需刻意编排。" },
  { id: "L11", text: "我把门关上，也把外界的噪音关在门外。" },
  { id: "L12", text: "世界熙熙攘攘，我独来独往，于无人问津处，寻得内心的丰饶。" },
  { id: "L13", text: "世界太吵，我只想听听自己的心跳。" },
  { id: "L14", text: "一个人待着，世界就安静得刚刚好。" },
  { id: "L15", text: "静下来，听风也听自己。" },
  { id: "L16", text: "房间里的安静，比很多热闹都更有力量。" },
  { id: "L17", text: "慢煮时光，自得其乐。" },
  { id: "L18", text: "不必艳羡风月，孤岛有孤岛的好。" },
] as const;

export type SolitudeId = (typeof solitudeLines)[number]["id"];

export interface CharacterRecord extends Partial<VisualRecordMeta> {
  id: string;
  code: string;
  faction: Faction;
  sceneOrder: number;
  continuity: "1995";
  name: string;
  nameJa: string;
  nameEn: string;
  alternateNameJa?: string;
  role: string;
  intro: string;
  firstAppearance: {
    episode: number;
    label: string;
    titleJa: string;
  };
  affiliation: string;
  machineOrSystem: string;
  portrait: string;
  portraitAlt: string;
  portraitCredit: string;
  sync: number | null;
  syncLabel: string;
  solitudeIds: SolitudeId[];
  quoteJa: string;
  quoteZh: string;
  quoteKind: "作品短引用" | "页面拟态指令" | "使徒信号字幕" | "议会拟态通讯";
  audio: string;
  isPilot: boolean;
  officialReel?: {
    videoId: string;
    title: string;
    thumbnail: string;
  };
}

export const characters: CharacterRecord[] = [
  {
    id: "shinji",
    code: "N-01",
    faction: "nerv",
    sceneOrder: 20,
    continuity: "1995",
    name: "碇真嗣",
    nameJa: "碇シンジ",
    nameEn: "SHINJI IKARI",
    role: "第三适格者 / EVA 初号机驾驶员",
    intro: "被父亲叫到第三新东京市的少年。习惯把“不能逃避”说给自己听；在独处中，他一点点学习如何与自己相处。",
    firstAppearance: { episode: 1, label: "EP.01", titleJa: "使徒、襲来" },
    affiliation: "NERV / 第三新东京市",
    machineOrSystem: "EVA-01",
    portrait: asset("characters/shinji.webp"),
    portraitAlt: "碇真嗣身穿 EVA 初号机驾驶服的角色立绘",
    portraitCredit: "NeoApo 角色 1474 · 非官方同人资料图",
    sync: 41.2,
    syncLabel: "设计演出数据",
    solitudeIds: ["L01", "L13", "L08"],
    quoteJa: "「逃げちゃダメだ、逃げちゃダメだ、逃げちゃダメだ。」",
    quoteZh: "不能逃避，不能逃避，不能逃避。",
    quoteKind: "作品短引用",
    audio: asset("audio/ja/shinji.mp3"),
    isPilot: true,
    officialReel: {
      videoId: "G1lMNnXlWHg",
      title: "Character Promotion Reel 碇シンジ",
      thumbnail: asset("official/character-reel-shinji.jpg"),
    },
  },
  {
    id: "misato",
    code: "N-02",
    faction: "nerv",
    sceneOrder: 40,
    continuity: "1995",
    name: "葛城美里",
    nameJa: "葛城ミサト",
    nameEn: "MISATO KATSURAGI",
    role: "NERV 作战部长 / 一尉",
    intro: "把真嗣接进自己生活的上司与监护人。外表爽朗，私底下把孤独收进冰箱和啤酒罐里。",
    firstAppearance: { episode: 1, label: "EP.01", titleJa: "使徒、襲来" },
    affiliation: "NERV 作战部",
    machineOrSystem: "作战指挥",
    portrait: asset("characters/misato.webp"),
    portraitAlt: "葛城美里全身角色立绘",
    portraitCredit: "NeoApo 角色 1477 · 非官方同人资料图",
    sync: 62.8,
    syncLabel: "设计演出数据",
    solitudeIds: ["L03", "L05", "L15"],
    quoteJa: "「あんたまだ生きてるんでしょ。だったらしっかり生きて、それから死になさい。」",
    quoteZh: "你不是还活着吗。那就好好活着，然后再去死。",
    quoteKind: "作品短引用",
    audio: asset("audio/ja/misato.mp3"),
    isPilot: false,
    officialReel: {
      videoId: "LR4WskvTt0Q",
      title: "Character Promotion Reel 葛城ミサト",
      thumbnail: asset("official/character-reel-misato.jpg"),
    },
  },
  {
    id: "ritsuko",
    code: "N-03",
    faction: "nerv",
    sceneOrder: 60,
    continuity: "1995",
    name: "赤木律子",
    nameJa: "赤木リツコ",
    nameEn: "RITSUKO AKAGI",
    role: "NERV 技术开发部负责人 / MAGI 系统维护者",
    intro: "维持 NERV 技术系统的科学家。理性是她的盔甲，沉默是她与母亲、与源堂之间无法拆解的回路。",
    firstAppearance: { episode: 1, label: "EP.01", titleJa: "使徒、襲来" },
    affiliation: "NERV 技术开发部",
    machineOrSystem: "MAGI",
    portrait: asset("characters/ritsuko.jpg"),
    portraitAlt: "赤木律子角色插画",
    portraitCredit: "NeoApo 角色 1478 · 非官方同人资料图",
    sync: 55.4,
    syncLabel: "设计演出数据",
    solitudeIds: ["L04", "L16"],
    quoteJa: "「マギ・システム、起動。」",
    quoteZh: "MAGI 系统，启动。",
    quoteKind: "页面拟态指令",
    audio: asset("audio/ja/ritsuko.mp3"),
    isPilot: false,
  },
  {
    id: "rei",
    code: "N-04",
    faction: "nerv",
    sceneOrder: 80,
    continuity: "1995",
    name: "绫波丽",
    nameJa: "綾波レイ",
    nameEn: "REI AYANAMI",
    role: "第一适格者 / EVA 零号机驾驶员",
    intro: "在医院的白色光线里醒来的少女。她很少解释自己，像一份尚未写完的实验记录。",
    firstAppearance: { episode: 1, label: "EP.01", titleJa: "使徒、襲来" },
    affiliation: "NERV / 第三新东京市",
    machineOrSystem: "EVA-00",
    portrait: asset("characters/rei.png"),
    portraitAlt: "绫波丽身穿 EVA 零号机驾驶服的角色立绘",
    portraitCredit: "NeoApo 角色 1475 · 非官方同人资料图",
    sync: 12.6,
    syncLabel: "设计演出数据",
    solitudeIds: ["L02", "L14", "L10"],
    quoteJa: "「私が死んでも、代わりはいるもの。」",
    quoteZh: "即使我死了，也会有替代品。",
    quoteKind: "作品短引用",
    audio: asset("audio/ja/rei.mp3"),
    isPilot: true,
    officialReel: {
      videoId: "8lxhykF9z1c",
      title: "Character Promotion Reel 綾波レイ / アヤナミレイ（仮称）",
      thumbnail: asset("official/character-reel-rei.jpg"),
    },
  },
  {
    id: "asuka",
    code: "N-05",
    faction: "nerv",
    sceneOrder: 800,
    continuity: "1995",
    name: "惣流·明日香·兰格雷",
    nameJa: "惣流・アスカ・ラングレー",
    nameEn: "ASUKA LANGLEY SORYU",
    alternateNameJa: "式波・アスカ・ラングレー",
    role: "第二适格者 / EVA 二号机驾驶员",
    intro: "从德国来的王牌驾驶员。骄傲、明亮、争强好胜，最害怕的不是失败，而是无人需要自己。",
    firstAppearance: { episode: 8, label: "EP.08", titleJa: "アスカ、来日" },
    affiliation: "NERV / 第二适格者",
    machineOrSystem: "EVA-02",
    portrait: asset("characters/asuka.webp"),
    portraitAlt: "惣流·明日香·兰格雷身穿 EVA 二号机驾驶服的角色立绘",
    portraitCredit: "NeoApo 角色 1476 · 非官方同人资料图",
    sync: 74.9,
    syncLabel: "设计演出数据",
    solitudeIds: ["L09", "L17", "L06"],
    quoteJa: "「あんたバカぁ？」",
    quoteZh: "你是白痴吗？",
    quoteKind: "作品短引用",
    audio: asset("audio/ja/asuka.mp3"),
    isPilot: true,
    officialReel: {
      videoId: "vGnp7D8U4bs",
      title: "Character Promotion Reel 式波・アスカ・ラングレー",
      thumbnail: asset("official/character-reel-asuka.jpg"),
    },
  },
  {
    id: "sachiel",
    code: "A-01",
    faction: "seele",
    sceneOrder: 10,
    continuity: "1995",
    name: "萨基尔",
    nameJa: "サキエル",
    nameEn: "SACHIEL / THIRD ANGEL",
    role: "第三使徒 / 第一波来袭者",
    intro: "沉默的巨型生命体，拥有 AT 力场与自我修复能力。它不说话，只用存在本身否定人类的边界。",
    firstAppearance: { episode: 1, label: "EP.01", titleJa: "使徒、襲来" },
    affiliation: "使徒",
    machineOrSystem: "第三使徒",
    portrait: asset("characters/sachiel.png"),
    portraitAlt: "第三使徒萨基尔的角色插画",
    portraitCredit: "ibisPaint 公开同人作品 · 仅作非商业演示",
    sync: 100,
    syncLabel: "AT 力场 / 已展开",
    solitudeIds: [],
    quoteJa: "「第三使徒、サキエル。ATフィールド、展開。」",
    quoteZh: "第三使徒，萨基尔。AT 力场，展开。",
    quoteKind: "使徒信号字幕",
    audio: asset("audio/ja/sachiel.mp3"),
    isPilot: false,
  },
  {
    id: "gendo",
    code: "A-02",
    faction: "seele",
    sceneOrder: 50,
    continuity: "1995",
    name: "碇源堂",
    nameJa: "碇ゲンドウ",
    nameEn: "GENDO IKARI",
    role: "NERV 总司令 / 人类补完计划推进者",
    intro: "真嗣的父亲，也是 NERV 的司令。把感情锁在眼镜后面，把人类补完当作唯一的方向。",
    firstAppearance: { episode: 1, label: "EP.01", titleJa: "使徒、襲来" },
    affiliation: "NERV 总司令部",
    machineOrSystem: "司令权限",
    portrait: asset("characters/gendo.gif"),
    portraitAlt: "碇源堂戴着墨镜的角色立绘",
    portraitCredit: "NeoApo 角色 1479 · 非官方同人资料图",
    sync: null,
    syncLabel: "ACCESS DENIED",
    solitudeIds: ["L11", "L18"],
    quoteJa: "「人類補完計画、開始。」",
    quoteZh: "人类补完计划，开始。",
    quoteKind: "页面拟态指令",
    audio: asset("audio/ja/gendo.mp3"),
    isPilot: false,
  },
  {
    id: "seele",
    code: "A-03",
    faction: "seele",
    sceneOrder: 200,
    continuity: "1995",
    name: "SEELE",
    nameJa: "ゼーレ",
    nameEn: "SEELE",
    role: "人类补完委员会 / 幕后议会",
    intro: "七个没有面孔的声音，用“SOUND ONLY”决定人类的下一版。它们是制度化的孤独，也是补完计划的作者。",
    firstAppearance: { episode: 2, label: "EP.02", titleJa: "見知らぬ、天井" },
    affiliation: "SEELE / 人类补完委员会",
    machineOrSystem: "集体意志",
    portrait: asset("characters/seele.png"),
    portraitAlt: "SEELE 红色标志",
    portraitCredit: "BUFFALO 联名资料页公开标志 · 非官方页面引用",
    sync: 100,
    syncLabel: "SOUND ONLY",
    solitudeIds: [],
    quoteJa: "「ゼーレ。人類補完計画、開始。」",
    quoteZh: "SEELE。人类补完计划，开始。",
    quoteKind: "议会拟态通讯",
    audio: asset("audio/ja/seele.mp3"),
    isPilot: false,
  },
  {
    id: "kaworu",
    code: "A-04",
    faction: "seele",
    sceneOrder: 2400,
    continuity: "1995",
    name: "渚薰",
    nameJa: "渚カヲル",
    nameEn: "KAWORU NAGISA",
    role: "第五适格者 / 最后的使徒",
    intro: "在湖边与真嗣相遇的少年。温柔、从容，像一面镜子，让真嗣第一次听见自己心跳的回声。",
    firstAppearance: { episode: 24, label: "EP.24", titleJa: "最後のシ者" },
    affiliation: "NERV / 使徒",
    machineOrSystem: "Tabris / EVA-02",
    portrait: asset("characters/kaworu.webp"),
    portraitAlt: "渚薰身穿 EVA 驾驶服的角色立绘",
    portraitCredit: "NeoApo 角色 1485 · 非官方同人资料图",
    sync: 100,
    syncLabel: "PATTERN / BLUE",
    solitudeIds: ["L07", "L12"],
    quoteJa: "「僕は、君を愛しているよ。」",
    quoteZh: "我爱你。",
    quoteKind: "作品短引用",
    audio: asset("audio/ja/kaworu.mp3"),
    isPilot: true,
    officialReel: {
      videoId: "OChURARqU-c",
      title: "Character Promotion Reel 渚カヲル",
      thumbnail: asset("official/character-reel-kaworu.jpg"),
    },
  },
];

export const solitudeById = new Map(solitudeLines.map((line) => [line.id, line.text]));

export interface MachineRecord extends Partial<VisualRecordMeta> {
  id: string;
  code: string;
  name: string;
  nameJa: string;
  pilot: string;
  firstAppearance: string;
  profile: string;
  fault: string;
  sync: number;
  image: string;
  imageCredit: string;
}

export const machines: MachineRecord[] = [
  {
    id: "eva-00",
    code: "00",
    name: "零号机",
    nameJa: "EVANGELION 試作零号機",
    pilot: "绫波丽",
    firstAppearance: "EP.05「レイ、心のむこうに」",
    profile: "第一架可用于实战的 EVA 原型机。装甲与同期系统保留大量试验痕迹。",
    fault: "启动稳定性 / 核心排斥",
    sync: 12.6,
    image: asset("official/trailer-1_0.jpg"),
    imageCredit: "官方《1.0》预告缩略图 · 仅作机体版面切片",
  },
  {
    id: "eva-01",
    code: "01",
    name: "初号机",
    nameJa: "EVANGELION 初号機",
    pilot: "碇真嗣",
    firstAppearance: "EP.01「使徒、襲来」",
    profile: "真嗣驾驶的泛用人形决战兵器。紫色装甲与绿色荧光构成全站唯一许可的双色机器编码。",
    fault: "暴走阈值 / 拘束器断开",
    sync: 41.2,
    image: asset("official/trailer-1_0.jpg"),
    imageCredit: "官方《1.0》预告缩略图 · 仅作机体版面切片",
  },
  {
    id: "eva-02",
    code: "02",
    name: "二号机",
    nameJa: "EVANGELION 弐号機",
    pilot: "明日香",
    firstAppearance: "EP.08「アスカ、来日」",
    profile: "由德国支部完成量产的实战型机体，红色装甲与高机动近战逻辑属于明日香。",
    fault: "同步骤降 / 精神污染",
    sync: 74.9,
    image: asset("official/trailer-2_0.jpg"),
    imageCredit: "官方《2.0》预告缩略图 · 仅作机体版面切片",
  },
  {
    id: "eva-08",
    code: "08",
    name: "改八号机",
    nameJa: "EVANGELION 改八号機",
    pilot: "真希波·玛丽",
    firstAppearance: "新剧场版序列",
    profile: "新剧场版新增机体序列。缺失的旧作记录被保留成显式空位，不用仿制画面填补。",
    fault: "新剧场版连续体 / 资料分栏",
    sync: 93.8,
    image: asset("official/trailer-final.jpg"),
    imageCredit: "官方《终章》预告缩略图 · 仅作机体版面切片",
  },
];

export interface AngelRecord extends Partial<VisualRecordMeta> {
  id: string;
  code: string;
  name: string;
  nameJa: string;
  classification: string;
  firstAppearance: string;
  threat: string;
  concept: string;
  image?: string;
  procedural: boolean;
}

export const angels: AngelRecord[] = [
  {
    id: "sachiel",
    code: "03",
    name: "萨基尔",
    nameJa: "サキエル",
    classification: "第三使徒",
    firstAppearance: "EP.01「使徒、襲来」",
    threat: "A / 近距离接触",
    concept: "第一枚撕裂日常的边界。AT 力场以完整八面体出现，代表尚未被动摇的自我。",
    image: asset("characters/sachiel.png"),
    procedural: false,
  },
  {
    id: "ramiel",
    code: "05",
    name: "拉米尔",
    nameJa: "ラミエル",
    classification: "第五使徒",
    firstAppearance: "EP.05「レイ、心のむこうに」",
    threat: "S / 超远程粒子炮",
    concept: "几何晶体的绝对蓝。它把“距离”变成武器，也把第三新东京市变成一座反射面。",
    procedural: true,
  },
  {
    id: "zeruel",
    code: "14",
    name: "力天使",
    nameJa: "ゼルエル",
    classification: "第十四使徒",
    firstAppearance: "EP.19「男の戰い」",
    threat: "SS / 侵入与切割",
    concept: "折叠的带状躯体与没有瞳孔的面。它逼迫初号机越过人的界线。",
    procedural: true,
  },
  {
    id: "tabris",
    code: "17",
    name: "塔布里斯",
    nameJa: "タブリス / 渚カヲル",
    classification: "第十七使徒",
    firstAppearance: "EP.24「最後のシ者」",
    threat: "— / 自愿中止",
    concept: "以人的形状抵达的使徒。真正的中和不是击败，而是理解之后主动放手。",
    image: asset("characters/kaworu.webp"),
    procedural: false,
  },
];

export interface EraRecord extends Partial<VisualRecordMeta> {
  id: string;
  year: string;
  chronology: string;
  titleZh: string;
  titleJa: string;
  titleEn: string;
  note: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  trailerId?: string;
  officialUrl: string;
}

export const eras: EraRecord[] = [
  {
    id: "1995",
    year: "1995",
    chronology: "TV",
    titleZh: "新世纪福音战士",
    titleJa: "新世紀エヴァンゲリオン",
    titleEn: "NEON GENESIS EVANGELION",
    note: "26 话电视序列建立了两套神话：少年驾驶巨大兵器，成人用组织语言掩盖恐怖。",
    image: asset("official/official-site-1995.jpg", asset("characters/group.png")),
    imageAlt: "1995 电视版官方站点主视觉",
    imageCredit: "Khara 官方站 1995 TV 主视觉 · 仅作非商业档案展示",
    officialUrl: "https://www.evangelion.jp/neon_genesis.html",
  },
  {
    id: "1997",
    year: "1997",
    chronology: "旧剧场版",
    titleZh: "真心为你",
    titleJa: "THE END OF EVANGELION",
    titleEn: "THE END OF EVANGELION",
    note: "电视终局之外的另一扇门。城市、海面与人群被推到只剩边界与选择。",
    image: "",
    imageAlt: "没有可靠本地剧照的旧剧场版档案空位",
    imageCredit: "无本地剧照 / 以档案版式和公开作品资料呈现",
    officialUrl: "https://www.evangelion.jp/neon_genesis.html",
  },
  {
    id: "2007",
    year: "2007",
    chronology: "新剧场版",
    titleZh: "序",
    titleJa: "ヱヴァンゲリヲン新劇場版：序",
    titleEn: "EVANGELION: 1.0 YOU ARE (NOT) ALONE.",
    note: "第三新东京市与初号机被重新剪辑，旧记忆进入新的光线与尺度。",
    image: asset("official/official-site-1_0.jpg"),
    imageAlt: "《1.0》官方站点公开壁纸",
    imageCredit: "Khara 官方站《1.0》壁纸 · 非商业同人展示",
    trailerId: "uuFwvzLRF-o",
    officialUrl: "https://www.evangelion.jp/1_0/index.html",
  },
  {
    id: "2009",
    year: "2009",
    chronology: "新剧场版",
    titleZh: "破",
    titleJa: "ヱヴァンゲリヲン新劇場版：破",
    titleEn: "EVANGELION: 2.0 YOU CAN (NOT) ADVANCE.",
    note: "明日香、真理与新的二号机把人物关系推向无法回收的分岔。",
    image: asset("official/official-site-2_0.jpg"),
    imageAlt: "《2.0》官方站点主图",
    imageCredit: "Khara 官方站《2.0》主图 · 非商业同人展示",
    trailerId: "WLHNOS80_W8",
    officialUrl: "https://www.evangelion.jp/2_0/index.html",
  },
  {
    id: "2012",
    year: "2012",
    chronology: "新剧场版",
    titleZh: "Q",
    titleJa: "ヱヴァンゲリヲン新劇場版：Q",
    titleEn: "EVANGELION: 3.0 YOU CAN (NOT) REDO.",
    note: "十四年之后，熟悉的人变成陌生的制度，红与黑成为新的默认光线。",
    image: asset("official/official-site-3_0.jpg"),
    imageAlt: "《3.0》官方站点星空主视觉",
    imageCredit: "Khara 官方站《3.0》主视觉 · 非商业同人展示",
    trailerId: "IRQMZADWoPI",
    officialUrl: "https://www.evangelion.jp/3_0/index.html",
  },
  {
    id: "2021",
    year: "2021",
    chronology: "新剧场版",
    titleZh: "终",
    titleJa: "シン・エヴァンゲリオン劇場版",
    titleEn: "EVANGELION: 3.0+1.0 THRICE UPON A TIME",
    note: "终点不再是一座可以继续驾驶的机体，而是一个允许人物离开故事的空间。",
    image: asset("official/trailer-final.jpg"),
    imageAlt: "《终章》官方预告缩略图",
    imageCredit: "Khara 官方 YouTube 预告缩略图",
    trailerId: "10ict3GCxGY",
    officialUrl: "https://www.evangelion.jp/final_bd_dvd.html",
  },
];

export const pilotMatrix = [
  {
    id: "shinji",
    name: "碇真嗣",
    tv: "第三适格者 / EVA-01",
    rebuild: "第三少年 / 选择离开补完",
    portrait: asset("characters/shinji.webp"),
  },
  {
    id: "rei",
    name: "绫波丽",
    tv: "第一适格者 / EVA-00",
    rebuild: "暂称：绫波丽 / 可被重新命名",
    portrait: asset("characters/rei.png"),
  },
  {
    id: "asuka",
    name: "明日香",
    tv: "惣流·明日香·兰格雷",
    rebuild: "式波·明日香·兰格雷",
    portrait: asset("characters/asuka.webp"),
  },
  {
    id: "kaworu",
    name: "渚薰",
    tv: "第十七使徒 / Tabris",
    rebuild: "从月球抵达的渚司令",
    portrait: asset("characters/kaworu.webp"),
  },
  {
    id: "mari",
    name: "真希波·玛丽",
    tv: "NO RECORD",
    rebuild: "新剧场版适格者 / EVA-08",
    portrait: "",
  },
] as const;

function attachVisualMeta(
  records: Array<{ id: string } & Partial<VisualRecordMeta>>,
  cameraPrefix: string,
  baseLayers: number,
): void {
  records.forEach((record, index) => {
    Object.assign(record, {
      depthLayers: baseLayers + (index % 2),
      cameraPath: `${cameraPrefix}/${record.id}`,
      qualityTier: index % 5 === 0 ? "high" : "medium",
      sourceReviewedAt: "2026-10-19T00:00:00+08:00",
    } satisfies VisualRecordMeta);
  });
}

attachVisualMeta(characters, "children/cast", 3);
attachVisualMeta(machines, "hangar/bay", 3);
attachVisualMeta(angels, "angel/at-field", 4);
attachVisualMeta(eras, "records/film-corridor", 3);

export const mediaCredits: MediaCredit[] = [
  {
    id: "character-art",
    kind: "character-art",
    sourceUrl: "assets/characters/CREDITS.md",
    rightsStatus: "待确认",
    usage: "角色识别与非商业同人演示；公开传播前需复核作者与授权。",
    reviewedAt: "2026-10-19",
  },
  {
    id: "official-images-and-reels",
    kind: "official-image",
    sourceUrl: "assets/official/CREDITS.md",
    rightsStatus: "官方外链",
    usage: "官方图片与短片缩略图用于来源索引；视频只通过 khara 官方 YouTube 播放器外链。",
    reviewedAt: "2026-10-19",
  },
  {
    id: "synthetic-voice",
    kind: "synthetic-voice",
    sourceUrl: "assets/audio/ja/",
    rightsStatus: "待确认",
    usage: "edge-tts 合成朗读，不是原声优演出；页面明确标注。",
    reviewedAt: "2026-10-19",
  },
  {
    id: "chapter-score",
    kind: "original-score",
    sourceUrl: "assets/audio/bgm/CREDITS.md",
    rightsStatus: "项目原创",
    usage: "七条本地程序化章节配乐，不含 EVA OST 或原声采样。",
    reviewedAt: "2026-10-19",
  },
];

