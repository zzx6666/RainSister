import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("C:/Users/ZOU/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const OUT = path.join(ROOT, "visuals");

const A = {
  group: path.join(ROOT, "assets/characters/group.png"),
  shinji: path.join(ROOT, "assets/characters/shinji.webp"),
  rei: path.join(ROOT, "assets/characters/rei.png"),
  asuka: path.join(ROOT, "assets/characters/asuka.webp"),
  kaworu: path.join(ROOT, "assets/characters/kaworu.webp"),
  sachiel: path.join(ROOT, "assets/characters/sachiel.png"),
  seele: path.join(ROOT, "assets/characters/seele.png"),
  site1995: path.join(ROOT, "assets/official/official-site-1995.jpg"),
  site10: path.join(ROOT, "assets/official/official-site-1_0.jpg"),
  site30: path.join(ROOT, "assets/official/official-site-3_0.jpg"),
  trailer20: path.join(ROOT, "assets/official/trailer-2_0.jpg"),
  trailerFinal: path.join(ROOT, "assets/official/trailer-final.jpg"),
  grain: path.join(ROOT, "assets/textures/grain.png"),
};

const C = {
  ink: "#070808",
  ink2: "#101214",
  paper: "#f2eee3",
  paper2: "#ded8c9",
  white: "#f7f4ea",
  red: "#c51f17",
  redDark: "#7d130f",
  orange: "#e56a21",
  acid: "#b8d932",
  blue: "#4c9fd8",
  steel: "#8fa4ab",
  smoke: "#9f9a8e",
};

const FONT = {
  serif: "Noto Serif SC, Source Han Serif SC, SimSun, serif",
  sans: "Noto Sans SC, Microsoft YaHei, sans-serif",
  narrow: "Bahnschrift Condensed, Bahnschrift, sans-serif",
  mono: "Consolas, monospace",
};

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgDoc(width, height, body, defs = "") {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs>${defs}</defs>${body}</svg>`,
  );
}

async function svgPng(width, height, body, defs = "") {
  return sharp(svgDoc(width, height, body, defs)).png().toBuffer();
}

async function animateOpacity(input, opacity) {
  const image = sharp(input);
  const meta = await image.metadata();
  if (!meta.hasAlpha) {
    return image.removeAlpha().ensureAlpha(opacity).png().toBuffer();
  }
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * opacity);
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

async function cover(fileOrBuffer, width, height, options = {}) {
  const {
    position = "centre",
    brightness = 1,
    saturation = 1,
    gamma = 1,
    grayscale = false,
    blur = 0,
  } = options;
  let image = sharp(fileOrBuffer, { animated: false }).rotate().resize(width, height, {
    fit: "cover",
    position,
    withoutEnlargement: false,
  });
  if (grayscale) image = image.grayscale();
  if (brightness !== 1 || saturation !== 1 || gamma !== 1) {
    image = image.modulate({ brightness, saturation, gamma });
  }
  if (blur > 0) image = image.blur(blur);
  return image.png().toBuffer();
}

async function fitHeight(file, height) {
  return sharp(file, { animated: false })
    .resize({ height, withoutEnlargement: false })
    .png()
    .toBuffer();
}

async function fitWidth(file, width) {
  return sharp(file, { animated: false })
    .resize({ width, withoutEnlargement: false })
    .png()
    .toBuffer();
}

async function compose(width, height, background, layers = []) {
  return sharp({
    create: { width, height, channels: 4, background },
  })
    .composite(layers.filter(Boolean))
    .png()
    .toBuffer();
}

async function save(buffer, relativePath) {
  const target = path.join(OUT, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await sharp(buffer).png({ compressionLevel: 9, palette: false }).toFile(target);
  return target;
}

async function grainOverlay(width, height, opacity = 0.08) {
  const tile = await cover(A.grain, width, height, { grayscale: true, brightness: 1.15 });
  return animateOpacity(tile, opacity);
}

async function scanlineOverlay(width, height, opacity = 0.2) {
  const body = `<pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="none"/>
    <path d="M0 7.5H8" stroke="#000" stroke-opacity="0.72" stroke-width="1"/>
    <path d="M0 0.5H8" stroke="#fff" stroke-opacity="0.05" stroke-width="1"/>
  </pattern><rect width="${width}" height="${height}" fill="url(#scan)" opacity="${opacity}"/>`;
  return svgPng(width, height, body);
}

async function dustLayer(width, height, color = C.red, count = 65, seed = 7) {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let body = "";
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = 0.5 + random() * 2.4;
    const o = 0.12 + random() * 0.55;
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${o.toFixed(2)}"/>`;
  }
  return svgPng(width, height, body);
}

function octPoints(cx, cy, radius, rotation = -Math.PI / 8) {
  return Array.from({ length: 8 }, (_, i) => {
    const angle = rotation + (Math.PI * 2 * i) / 8;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

function octPath(cx, cy, radius, rotation = -Math.PI / 8) {
  return octPoints(cx, cy, radius, rotation)
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ") + " Z";
}

async function atField(width, height, config) {
  const {
    cx, cy, radius, alpha = 1, fracture = 0, open = 0,
    color = C.red, seed = 19, gap = 2,
  } = config;
  const points = octPoints(cx, cy, radius);
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  let triangles = "";
  for (let i = 0; i < 8; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % 8];
    const angle = Math.atan2((p1[1] + p2[1]) / 2 - cy, (p1[0] + p2[0]) / 2 - cx);
    const shift = fracture * (25 + random() * 105);
    const dx = Math.cos(angle) * shift + (open > 0 ? Math.cos(angle) * open * 44 : 0);
    const dy = Math.sin(angle) * shift + (open > 0 ? Math.sin(angle) * open * 44 : 0);
    const opacity = Math.max(0.03, 0.095 + random() * 0.08 - fracture * 0.06);
    triangles +=
      `<path d="M${cx} ${cy} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z" ` +
      `transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${(fracture * (random() * 18 - 9)).toFixed(2)} ${cx} ${cy})" ` +
      `fill="${color}" opacity="${opacity.toFixed(3)}"/>`;
  }
  let cracks = "";
  if (fracture > 0) {
    for (let i = 0; i < 12; i += 1) {
      const a = random() * Math.PI * 2;
      const r1 = radius * (0.25 + random() * 0.55);
      const r2 = Math.min(radius * 1.2, r1 + 45 + random() * 140);
      cracks += `<path d="M${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1} L${cx + Math.cos(a + 0.06) * r2} ${cy + Math.sin(a + 0.06) * r2}" stroke="${color}" stroke-width="${1 + random() * 2}" opacity="${0.25 + random() * 0.4}"/>`;
    }
  }
  const ticks = Array.from({ length: 32 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 32;
    const inner = radius + 20 + (i % 4 === 0 ? 0 : 8);
    const outer = inner + (i % 4 === 0 ? 24 : 10);
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="${i % 4 === 0 ? 1.4 : 0.6}" opacity="${i % 4 === 0 ? 0.72 : 0.36}"/>`;
  }).join("");
  const body = `
    <g opacity="${alpha}">
      <path d="${octPath(cx, cy, radius)}" fill="none" stroke="${color}" stroke-width="2.2" opacity="0.86"/>
      <path d="${octPath(cx, cy, radius - 18)}" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.42"/>
      <path d="${octPath(cx, cy, radius * 0.52)}" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.48"/>
      ${triangles}
      ${points.map(([x, y]) => `<path d="M${cx} ${cy} L${x} ${y}" stroke="${color}" stroke-width="0.85" opacity="0.5"/>`).join("")}
      <path d="M${cx - gap / 2} ${cy - radius * 0.72} L${cx - gap / 2} ${cy + radius * 0.72}" stroke="${C.ink}" stroke-width="${gap}" opacity="0.92"/>
      ${ticks}
      ${cracks}
      <circle cx="${cx}" cy="${cy}" r="4" fill="${color}" opacity="0.9"/>
    </g>`;
  const defs = `<radialGradient id="fieldBg" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.13"/>
      <stop offset="55%" stop-color="${color}" stop-opacity="0.045"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="fieldBlur"><feGaussianBlur stdDeviation="13"/></filter>`;
  const glow = await svgPng(
    width,
    height,
    `<circle cx="${cx}" cy="${cy}" r="${radius * 1.05}" fill="url(#fieldBg)"/>
     <g filter="url(#fieldBlur)" opacity="0.42"><path d="${octPath(cx, cy, radius)}" fill="none" stroke="${color}" stroke-width="8"/></g>`,
    defs,
  );
  return { crisp: await svgPng(width, height, body), glow };
}

async function removeWhiteBackground(file) {
  const { data, info } = await sharp(file, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const alpha = Math.max(0, Math.min(255, Math.round((255 - min) * 8)));
    data[i + 3] = Math.min(data[i + 3], alpha);
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

async function ghostGroup(width, height, opacity = 0.16, invert = true) {
  let image = sharp(A.group, { animated: false }).resize(width, height, {
    fit: "cover",
    position: "centre",
  }).grayscale().removeAlpha();
  if (invert) image = image.negate();
  const buffer = await image.png().toBuffer();
  return animateOpacity(buffer, opacity);
}

async function officialCity(width, height, options = {}) {
  const cropped = await sharp(A.site10)
    .extract({ left: 0, top: 108, width: 1280, height: 720 })
    .png()
    .toBuffer();
  return cover(cropped, width, height, {
    brightness: options.brightness ?? 0.75,
    saturation: options.saturation ?? 1.15,
    position: options.position ?? "centre",
  });
}

function text(value, x, y, options = {}) {
  const {
    size = 18,
    fill = C.white,
    family = FONT.sans,
    weight = 400,
    spacing = 0,
    opacity = 1,
    anchor = "start",
  } = options;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" opacity="${opacity}" text-anchor="${anchor}">${xml(value)}</text>`;
}

function line(x1, y1, x2, y2, stroke = C.white, width = 1, opacity = 1) {
  return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"/>`;
}

function rect(x, y, width, height, fill, extra = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
}

function labelBox(value, x, y, options = {}) {
  const {
    fill = C.ink, color = C.white, border = "none", size = 12,
    width = 132, height = 28, family = FONT.narrow,
  } = options;
  return (
    rect(x, y, width, height, fill, `stroke="${border}"`) +
    text(value, x + width / 2, y + height / 2 + size * 0.34, {
      size, fill: color, family, anchor: "middle", spacing: 1.2,
    })
  );
}

function smallMarks(width, height, color = C.red) {
  const corners = [
    [30, 32, 1, 1],
    [width - 30, 32, -1, 1],
    [30, height - 32, 1, -1],
    [width - 30, height - 32, -1, -1],
  ];
  return corners.map(([x, y, sx, sy]) =>
    `<path d="M${x} ${y + sy * 42} L${x} ${y} L${x + sx * 42} ${y}" fill="none" stroke="${color}" stroke-width="2"/>`,
  ).join("");
}

async function baseK01() {
  const W = 1920;
  const H = 1080;
  const bg = await svgPng(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${C.ink}"/>
     <circle cx="1350" cy="540" r="720" fill="url(#bgGlow)"/>
     <path d="M0 928 L760 540 L0 168" fill="none" stroke="${C.red}" stroke-width="1" opacity="0.16"/>
     <path d="M1920 940 L1180 540 L1920 160" fill="none" stroke="${C.white}" stroke-width="0.8" opacity="0.09"/>
     <path d="M0 780 H1920 M0 1020 H1920" stroke="${C.white}" stroke-width="0.7" opacity="0.08"/>`,
    `<radialGradient id="bgGlow"><stop offset="0" stop-color="${C.redDark}" stop-opacity="0.32"/><stop offset="1" stop-color="${C.ink}" stop-opacity="0"/></radialGradient>`,
  );
  const ghost = await ghostGroup(1240, 760, 0.17, true);
  const field = await atField(W, H, {
    cx: 1365, cy: 535, radius: 388, gap: 3, alpha: 0.95, seed: 1995,
  });
  const structure = await svgPng(
    W,
    H,
    `${line(72, 112, 780, 112, C.white, 1, 0.28)}
     ${line(72, 112, 72, 900, C.white, 1, 0.22)}
     ${line(72, 900, 520, 900, C.white, 1, 0.22)}
     ${line(1040, 70, 1810, 70, C.red, 1, 0.35)}
     ${line(1810, 70, 1810, 950, C.red, 1, 0.18)}
     ${labelBox("00 / INITIALIZE", 72, 72, { fill: C.red, width: 174, height: 34, size: 14 })}
     ${labelBox("AT FIELD : CLOSED", 1490, 72, { fill: "transparent", color: C.red, border: C.red, width: 236 })}
     ${text("SYNC RATE", 1490, 160, { size: 12, fill: C.smoke, family: FONT.narrow, spacing: 1.8 })}
     ${text("00.0", 1486, 218, { size: 56, fill: C.white, family: FONT.narrow, spacing: 2 })}
     ${text("%", 1688, 214, { size: 20, fill: C.red, family: FONT.narrow })}
     ${line(1490, 240, 1804, 240, C.red, 1, 0.45)}
     ${text("AT—01 / SYNCHRONIZATION CHAMBER", 1490, 956, { size: 12, fill: C.smoke, family: FONT.narrow, spacing: 1.2 })}
     ${Array.from({ length: 9 }, (_, i) => `<circle cx="${1510 + i * 35}" cy="902" r="${i < 2 ? 3.5 : 2}" fill="${i < 2 ? C.red : C.smoke}" opacity="${i < 2 ? 1 : 0.24}"/>`).join("")}
     ${text("CONCEPT VISUAL / NON-OFFICIAL POSTER", 1490, 1012, { size: 11, fill: C.smoke, family: FONT.narrow, opacity: 0.8 })}`,
  );
  const headline = await svgPng(
    W,
    H,
    `<text x="1060" y="444" fill="${C.white}" font-family="${FONT.serif}" font-size="276" font-weight="900" opacity="0.96">同</text>
     <text x="1060" y="738" fill="${C.white}" font-family="${FONT.serif}" font-size="276" font-weight="900" opacity="0.96">期</text>
     ${text("同 期", 1080, 1046, { size: 12, fill: C.red, family: FONT.narrow, spacing: 9 })}
     ${line(92, 208, 710, 208, C.red, 2, 0.9)}
     ${text("同步协议", 92, 316, { size: 92, fill: C.white, family: FONT.serif, weight: 800, spacing: 2 })}
     ${text("SOLITUDE / SYNCHRONIZATION PROTOCOL", 96, 364, { size: 15, fill: C.red, family: FONT.narrow, spacing: 3.2 })}
     ${text("享受 / 独处", 94, 438, { size: 31, fill: C.paper, family: FONT.serif, weight: 600, spacing: 3 })}
     ${text("进入一套仍在运转的同步装置。", 94, 510, { size: 20, fill: C.paper, family: FONT.sans })}
     ${text("力场闭合时，所有读数只属于你自己。", 94, 544, { size: 20, fill: C.paper, family: FONT.sans })}
     ${labelBox("开始同步", 94, 650, { fill: C.acid, color: C.ink, width: 228, height: 62, size: 18, family: FONT.sans })}
     ${labelBox("静音浏览", 338, 650, { fill: C.ink, color: C.white, border: C.white, width: 228, height: 62, size: 18, family: FONT.sans })}
     ${text("ENTER / SPACE", 96, 744, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 2 })}
     ${text("声音默认关闭 · AT FIELD LOCKED", 566, 744, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 1.4 })}
     ${text("同步率不是进度。它是你允许世界靠近的距离。", 94, 856, { size: 15, fill: C.paper2, family: FONT.serif })}
     ${line(94, 886, 610, 886, C.white, 1, 0.2)}`,
  );
  return compose(W, H, C.ink, [
    { input: bg, left: 0, top: 0 },
    { input: ghost, left: 570, top: 160, blend: "screen" },
    { input: field.glow, left: 0, top: 0, blend: "screen" },
    { input: field.crisp, left: 0, top: 0 },
    { input: structure, left: 0, top: 0 },
    { input: headline, left: 0, top: 0 },
    { input: await dustLayer(W, H, C.orange, 74, 1), left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.07), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, H, 0.16), left: 0, top: 0 },
    { input: await svgPng(W, H, smallMarks(W, H, C.red)), left: 0, top: 0 },
  ]);
}

async function characterCard(file, width, height, options = {}) {
  const {
    name, number, role, accent = C.red, background = "#11161a",
    imageScale = 1.08, opacity = 1,
  } = options;
  const base = await svgPng(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="${background}"/>
     <rect width="${width}" height="8" fill="${accent}"/>
     <path d="M0 0 L${width * 0.22} 0 L${width * 0.08} ${height} L0 ${height} Z" fill="${accent}" opacity="0.91"/>
     <path d="M${width - 1} 18 V${height - 1} H18" fill="none" stroke="${accent}" stroke-width="2" opacity="0.85"/>
     <rect x="${width - 82}" y="24" width="58" height="4" fill="${C.paper}" opacity="0.65"/>`,
  );
  const character = await sharp(file, { animated: false })
    .resize(
      Math.max(1, width - 18),
      Math.max(1, height - 96),
      { fit: "contain", position: "top", withoutEnlargement: false },
    )
    .png()
    .toBuffer();
  const characterMeta = await sharp(character).metadata();
  const card = await sharp({
    create: { width, height, channels: 4, background },
  })
    .composite([
      { input: base, left: 0, top: 0 },
      { input: character, left: Math.round((width - characterMeta.width) / 2), top: 58 },
      {
        input: await svgPng(
          width,
          height,
          `<rect y="${height - 142}" width="${width}" height="142" fill="url(#cardShade)"/>
           ${text(number, 24, height - 78, { size: 48, fill: C.white, family: FONT.narrow, weight: 700 })}
           ${text(name, 24, height - 34, { size: 24, fill: C.white, family: FONT.sans, weight: 700, spacing: 1 })}
           ${text(role, width - 24, height - 31, { size: 11, fill: C.paper2, family: FONT.narrow, anchor: "end", spacing: 1.8 })}
           ${line(24, height - 106, width - 24, height - 106, accent, 2, 0.85)}`,
          `<linearGradient id="cardShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></linearGradient>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
  return animateOpacity(card, opacity);
}

async function baseK02() {
  const W = 1920;
  const H = 1080;
  const paperGhost = await animateOpacity(
    await cover(A.site1995, W, H, { grayscale: true, brightness: 1.5, blur: 0.4 }),
    0.055,
  );
  const paper = await compose(W, H, C.paper, [
    { input: paperGhost, left: 0, top: 0, blend: "multiply" },
    {
      input: await svgPng(
        W,
        H,
        `<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${C.red}" stroke-width="0.6" opacity="0.08"/></pattern>
         <rect width="${W}" height="${H}" fill="url(#grid)"/>
         <path d="M0 0 H1920 V1080 H0 Z" fill="url(#paperShade)"/>
         <path d="M728 0 L1040 1080 H1920 V0 Z" fill="${C.ink}" opacity="0.96"/>
         <path d="M764 0 L1090 1080" stroke="${C.red}" stroke-width="4" opacity="0.95"/>
         <path d="M696 0 L1020 1080" stroke="${C.red}" stroke-width="1" opacity="0.38"/>
         <path d="M1096 0 H1920 V1080 H1120 Z" fill="url(#corridor)"/>`,
        `<linearGradient id="paperShade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="${C.paper2}" stop-opacity="0.35"/></linearGradient>
         <linearGradient id="corridor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.ink}" stop-opacity="0.92"/><stop offset="1" stop-color="#1a1c1d" stop-opacity="0.86"/></linearGradient>`,
      ),
      left: 0,
      top: 0,
    },
  ]);
  const reiCard = await characterCard(A.rei, 300, 690, {
    name: "绫波丽", number: "00", role: "FIRST CHILD", accent: C.blue,
    background: "#202b34", imageScale: 1.12, opacity: 0.72,
  });
  const kaworuCard = await characterCard(A.kaworu, 266, 670, {
    name: "渚薰", number: "05", role: "FIFTH CHILD", accent: "#9a2420",
    background: "#16131a", imageScale: 1.08, opacity: 0.66,
  });
  const asukaCard = await characterCard(A.asuka, 390, 870, {
    name: "明日香", number: "02", role: "SECOND CHILD", accent: C.red,
    background: "#1b1313", imageScale: 1.1,
  });
  const shinjiCard = await characterCard(A.shinji, 414, 918, {
    name: "碇真嗣", number: "01", role: "THIRD CHILD", accent: C.acid,
    background: "#10191d", imageScale: 1.1,
  });
  const cardsBack = await svgPng(
    W,
    H,
    `<path d="M1170 142 L1542 240 L1500 952 L1126 1018 Z" fill="none" stroke="${C.red}" stroke-width="1.2" opacity="0.58"/>
     <path d="M1290 140 L1682 140 L1640 960 L1252 960 Z" fill="none" stroke="${C.white}" stroke-width="0.8" opacity="0.22"/>
     <path d="M1550 110 L1860 154 L1848 810 L1538 872 Z" fill="none" stroke="${C.red}" stroke-width="1" opacity="0.32"/>`,
  );
  const leftContent = await svgPng(
    W,
    H,
    `${labelBox("01 / CHILDREN", 72, 68, { fill: C.ink, width: 170 })}
     ${labelBox("1995 → 2021", 1510, 68, { fill: C.red, width: 172 })}
     ${text("CHILDREN", 66, 200, { size: 132, fill: C.ink, family: FONT.narrow, weight: 700, spacing: 2 })}
     ${text("適格者", 74, 326, { size: 112, fill: C.red, family: FONT.serif, weight: 900, spacing: 5 })}
     ${text("五个孩子 / 五面被折叠的镜子", 80, 386, { size: 22, fill: C.ink2, family: FONT.serif, weight: 600 })}
     ${line(80, 416, 660, 416, C.ink, 2, 0.82)}
     ${text("真嗣、丽、明日香、薰。他们被称作适格者，", 80, 468, { size: 18, fill: "#322f2b", family: FONT.serif })}
     ${text("却先要学习如何与自己的身体和沉默共处。", 80, 500, { size: 18, fill: "#322f2b", family: FONT.serif })}
     ${text("这不是阵容清单。", 80, 558, { size: 25, fill: C.ink, family: FONT.serif, weight: 700 })}
     ${text("这是每个人第一次独自站立的瞬间。", 80, 592, { size: 19, fill: C.redDark, family: FONT.serif })}
     ${labelBox("1995 / TV", 80, 656, { fill: C.ink, width: 136 })}
     ${labelBox("2021 / NEW", 230, 656, { fill: "transparent", color: C.ink, border: C.ink, width: 136 })}
     ${labelBox("NO RECORD / 真理", 380, 656, { fill: "transparent", color: C.red, border: C.red, width: 208 })}
     ${text("角色识别图来自公开同人资料；年份翻面只表示档案层，不等同官方剧照。", 80, 742, { size: 12, fill: "#605b53", family: FONT.sans })}
     ${line(80, 780, 656, 780, C.ink, 1, 0.24)}
     ${text("NERV COMMAND / 副档案", 80, 824, { size: 14, fill: C.ink, family: FONT.narrow, weight: 700, spacing: 1.6 })}
     ${text("葛城美里   OPERATIONS", 80, 858, { size: 13, fill: "#3d3933", family: FONT.sans })}
     ${text("赤木律子   TECHNICAL", 80, 886, { size: 13, fill: "#3d3933", family: FONT.sans })}
     ${text("碇源堂     COMMANDER", 80, 914, { size: 13, fill: "#3d3933", family: FONT.sans })}
     ${text("角色顺序按叙事初登场整理 · 档案可继续扩展到使徒与机体", 80, 984, { size: 12, fill: "#6f685c", family: FONT.sans })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL", 80, 1026, { size: 11, fill: C.red, family: FONT.narrow, spacing: 1.6 })}
     ${line(1120, 70, 1870, 70, C.white, 1, 0.2)}
     ${line(1120, 1010, 1870, 1010, C.white, 1, 0.2)}
     ${text("DUAL RECORD / FACE ↔ ERA", 1120, 1038, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 1.5 })}`,
  );
  return compose(W, H, C.paper, [
    { input: paper, left: 0, top: 0 },
    { input: reiCard, left: 720, top: 230 },
    { input: kaworuCard, left: 1652, top: 172 },
    { input: shinjiCard, left: 890, top: 106 },
    { input: asukaCard, left: 1260, top: 146 },
    { input: cardsBack, left: 0, top: 0 },
    { input: leftContent, left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.09), left: 0, top: 0, blend: "multiply" },
    { input: await scanlineOverlay(W, H, 0.09), left: 0, top: 0 },
  ]);
}

async function baseK03() {
  const W = 1920;
  const H = 1080;
  const hero = await cover(A.trailer20, W, H, {
    brightness: 0.75, saturation: 0.82, position: "east",
  });
  const ghost = await animateOpacity(
    await cover(A.trailer20, W, H, { brightness: 0.6, saturation: 0.7, blur: 8, position: "east" }),
    0.28,
  );
  const hangar = await svgPng(
    W,
    H,
    `<path d="M0 0 L1080 460 L0 1080" fill="url(#leftShade)"/>
     <path d="M1920 0 L1080 460 L1920 1080" fill="${C.ink}" opacity="0.12"/>
     <path d="M0 82 H1920 M0 982 H1920" stroke="${C.white}" stroke-width="1" opacity="0.18"/>
     <path d="M0 0 L1080 460 L1920 0 M0 1080 L1080 460 L1920 1080" fill="none" stroke="${C.orange}" stroke-width="1" opacity="0.24"/>
     <path d="M670 0 V1080 M1750 0 V1080" stroke="${C.white}" stroke-width="0.8" opacity="0.12"/>
     ${Array.from({ length: 7 }, (_, i) => `<path d="M${700 + i * 165} 86 V132" stroke="${C.orange}" stroke-width="${i === 3 ? 4 : 1}" opacity="${i === 3 ? 0.9 : 0.35}"/>`).join("")}
     <rect x="820" y="80" width="520" height="66" fill="${C.ink}" opacity="0.72"/>
     ${labelBox("02 / EVANGELION", 80, 70, { fill: C.orange, color: C.ink, width: 210 })}
     ${labelBox("OFFICIAL IMAGE / 2.0", 1590, 70, { fill: "transparent", color: C.orange, border: C.orange, width: 240 })}
     ${text("HANGAR 01 / DEEP SCAN", 848, 110, { size: 15, fill: C.white, family: FONT.narrow, spacing: 2.2 })}
     ${text("SYNC", 850, 132, { size: 10, fill: C.smoke, family: FONT.narrow })}
     ${text("87.4%", 1510, 132, { size: 12, fill: C.acid, family: FONT.mono })}
     ${line(908, 127, 1484, 127, C.orange, 5, 0.22)}
     ${line(908, 127, 1408, 127, C.acid, 5, 0.9)}`,
    `<linearGradient id="leftShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.ink}" stop-opacity="0.98"/><stop offset="0.58" stop-color="${C.ink}" stop-opacity="0.85"/><stop offset="1" stop-color="${C.ink}" stop-opacity="0"/></linearGradient>`,
  );
  const scan = await svgPng(
    W,
    H,
    `<g opacity="0.78">
       <ellipse cx="1380" cy="382" rx="245" ry="116" fill="none" stroke="${C.acid}" stroke-width="1.2"/>
       <ellipse cx="1380" cy="382" rx="295" ry="142" fill="none" stroke="${C.acid}" stroke-width="0.6" opacity="0.38" stroke-dasharray="14 12"/>
       <path d="M1350 322 V442 M1320 382 H1440" stroke="${C.acid}" stroke-width="1" opacity="0.88"/>
       <rect x="1310" y="312" width="140" height="140" fill="none" stroke="${C.orange}" stroke-width="1" opacity="0.6"/>
       ${text("ARMOR / DEFECT", 1320, 282, { size: 11, fill: C.acid, family: FONT.narrow, spacing: 1.5 })}
       ${text("X 0.42 / Y 0.61 / Z -7.2", 1320, 482, { size: 10, fill: C.white, family: FONT.mono, opacity: 0.72 })}
     </g>
     <path d="M1180 382 H1260 M1500 382 H1580" stroke="${C.acid}" stroke-width="1" opacity="0.45"/>`,
  );
  const copy = await svgPng(
    W,
    H,
    `${text("EVANGELION", 84, 242, { size: 82, fill: C.white, family: FONT.narrow, weight: 700, spacing: 2 })}
     ${text("汎用人型決戦兵器", 88, 292, { size: 22, fill: C.orange, family: FONT.sans, spacing: 3 })}
     ${text("初号機", 78, 474, { size: 194, fill: C.paper, family: FONT.serif, weight: 900, spacing: 8 })}
     ${text("TEST TYPE / UNIT 01", 92, 526, { size: 16, fill: C.orange, family: FONT.narrow, spacing: 3 })}
     ${line(92, 566, 670, 566, C.orange, 2, 0.74)}
     ${text("驾驶员", 92, 622, { size: 11, fill: C.smoke, family: FONT.sans, spacing: 2 })}
     ${text("碇 真嗣", 92, 662, { size: 30, fill: C.white, family: FONT.serif, weight: 700, spacing: 4 })}
     ${text("核心", 360, 622, { size: 11, fill: C.smoke, family: FONT.sans, spacing: 2 })}
     ${text("NOMINAL", 360, 660, { size: 22, fill: C.acid, family: FONT.narrow, spacing: 1 })}
     ${text("PHASE", 92, 724, { size: 11, fill: C.smoke, family: FONT.sans, spacing: 2 })}
     ${text("深度扫描中", 92, 758, { size: 24, fill: C.white, family: FONT.serif, weight: 600 })}
     ${text("缺陷不是在机体上被找到，而是在同步中暴露。", 92, 806, { size: 15, fill: C.paper2, family: FONT.serif })}
     ${line(92, 856, 700, 856, C.white, 1, 0.18)}
     ${["00", "01", "02", "08"].map((unit, i) => labelBox(unit, 92 + i * 138, 900, { fill: unit === "01" ? C.acid : C.ink, color: unit === "01" ? C.ink : C.white, border: unit === "01" ? C.acid : C.smoke, width: 112, height: 42, size: 17 })).join("")}
     ${text("CONCEPT VISUAL / NON-OFFICIAL POSTER", 92, 1022, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 1.2 })}`,
  );
  const bigNumber = await svgPng(
    W,
    H,
    `<text x="982" y="994" fill="${C.orange}" font-family="${FONT.narrow}" font-size="620" font-weight="700" opacity="0.12">01</text>`,
  );
  return compose(W, H, C.ink, [
    { input: hero, left: 0, top: 0 },
    { input: ghost, left: -20, top: 0, blend: "screen" },
    { input: bigNumber, left: 0, top: 0 },
    { input: hangar, left: 0, top: 0 },
    { input: scan, left: 0, top: 0 },
    { input: copy, left: 0, top: 0 },
    { input: await dustLayer(W, H, C.orange, 70, 20), left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.08), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, H, 0.12), left: 0, top: 0 },
    { input: await svgPng(W, H, smallMarks(W, H, C.orange)), left: 0, top: 0 },
  ]);
}

async function baseK04() {
  const W = 1920;
  const H = 1080;
  const bg = await officialCity(W, H, { brightness: 0.38, saturation: 1.3 });
  const redBlue = await svgPng(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="#08121a" opacity="0.48"/>
     <rect width="${W}" height="${H}" fill="url(#redWash)"/>
     <path d="M0 0 H820 L720 1080 H0 Z" fill="${C.ink}" opacity="0.82"/>`,
    `<radialGradient id="redWash" cx="72%" cy="48%" r="65%"><stop offset="0" stop-color="${C.red}" stop-opacity="0.2"/><stop offset="0.52" stop-color="${C.redDark}" stop-opacity="0.11"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient>`,
  );
  const seeleGhost = await animateOpacity(
    await sharp(A.seele).resize(830, 830).png().toBuffer(),
    0.52,
  );
  const field = await atField(W, H, {
    cx: 1395, cy: 516, radius: 432, gap: 2, alpha: 1, seed: 2001,
  });
  const sachiel = await removeWhiteBackground(A.sachiel);
  const sachielScaled = await fitHeight(sachiel, 860);
  const ramielCardBg = await cover(A.site10, 270, 340, {
    position: "centre", brightness: 0.72, saturation: 1.28,
  });
  const ramielCard = await compositeImage(
    270,
    340,
    ramielCardBg,
    [
      {
        input: await svgPng(
          270,
          340,
          `<rect width="270" height="340" fill="none" stroke="${C.red}" stroke-width="2"/>
           <rect y="272" width="270" height="68" fill="${C.ink}" opacity="0.88"/>
           ${text("1.0 / RAMIEL", 16, 302, { size: 14, fill: C.white, family: FONT.narrow, spacing: 1.5 })}
           ${text("OFFICIAL WALLPAPER", 16, 324, { size: 9, fill: C.orange, family: FONT.narrow, spacing: 1.2 })}`,
        ),
        left: 0,
        top: 0,
      },
    ],
  );
  const leftCopy = await svgPng(
    W,
    H,
    `${labelBox("03 / ANGELS", 72, 68, { fill: C.red, width: 168 })}
     ${labelBox("FIRST CONTACT", 1540, 68, { fill: "transparent", color: C.red, border: C.red, width: 190 })}
     ${text("AT 力場", 70, 298, { size: 146, fill: C.white, family: FONT.serif, weight: 900, spacing: 7 })}
     ${text("A.T. FIELD", 76, 356, { size: 18, fill: C.red, family: FONT.narrow, spacing: 6 })}
     ${text("使徒接触", 76, 430, { size: 46, fill: C.paper, family: FONT.serif, weight: 700, spacing: 2 })}
     ${line(76, 460, 620, 460, C.red, 2, 0.9)}
     ${text("SACHIEL", 76, 522, { size: 52, fill: C.white, family: FONT.narrow, weight: 700, spacing: 1.5 })}
    ${text("第三使徒 / THIRD ANGEL", 78, 556, { size: 14, fill: C.orange, family: FONT.narrow, spacing: 2 })}
     ${text("第一声警报之后，城市才发现自己并没有准备好。", 78, 620, { size: 18, fill: C.paper2, family: FONT.serif })}
     ${text("使徒不是等待被解释的怪物；它是另一种存在方式，", 78, 660, { size: 16, fill: C.paper2, family: FONT.serif })}
     ${text("带着自己的 AT 力场，要求你重新划出人与人的边界。", 78, 688, { size: 16, fill: C.paper2, family: FONT.serif })}
     ${labelBox("FAN VISUAL", 78, 742, { fill: C.ink, color: C.red, border: C.red, width: 126, height: 30 })}
     ${labelBox("SCREEN ONLY", 216, 742, { fill: C.ink, color: C.paper2, border: C.smoke, width: 138, height: 30 })}
     ${labelBox("中和 AT 力场", 78, 820, { fill: C.red, width: 250, height: 58, size: 18, family: FONT.sans })}
     ${text("FORCE BEND / POINTER 0.32 / FRACTURE 0.00", 78, 920, { size: 11, fill: C.smoke, family: FONT.mono, spacing: 0.8 })}
     ${text("SEELE / SOUND ONLY", 1520, 972, { size: 13, fill: C.red, family: FONT.narrow, spacing: 2.2, anchor: "middle" })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL POSTER", 78, 1020, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 1.2 })}`,
  );
  const crosshair = await svgPng(
    W,
    H,
    `<g opacity="0.78">
       <path d="M1395 62 V976 M938 516 H1858" stroke="${C.red}" stroke-width="0.7" opacity="0.25"/>
       <path d="M1395 112 V196 M1395 836 V920 M990 516 H1074 M1716 516 H1800" stroke="${C.red}" stroke-width="2"/>
       <circle cx="1395" cy="516" r="458" fill="none" stroke="${C.red}" stroke-width="1" stroke-dasharray="2 14" opacity="0.38"/>
      ${text("AT—03 / SACHIEL", 1234, 54, { size: 11, fill: C.paper2, family: FONT.narrow, spacing: 2.2 })}
       ${text("CORE SIGNAL", 1560, 890, { size: 10, fill: C.red, family: FONT.narrow, spacing: 1.5 })}
     </g>`,
  );
  return compose(W, H, C.ink, [
    { input: bg, left: 0, top: 0 },
    { input: redBlue, left: 0, top: 0 },
    { input: seeleGhost, left: 790, top: 122, blend: "screen" },
    { input: field.glow, left: 0, top: 0, blend: "screen" },
    { input: field.crisp, left: 0, top: 0 },
    { input: sachielScaled, left: 1122, top: 110 },
    { input: ramielCard, left: 1590, top: 170 },
    { input: crosshair, left: 0, top: 0 },
    { input: leftCopy, left: 0, top: 0 },
    { input: await dustLayer(W, H, C.red, 98, 31), left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.1), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, H, 0.18), left: 0, top: 0 },
    { input: await svgPng(W, H, smallMarks(W, H, C.red)), left: 0, top: 0 },
  ]);
}

async function cityStructures(width, height) {
  let state = 621;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  let buildings = "";
  for (let i = 0; i < 18; i += 1) {
    const w = 38 + random() * 96;
    const h = 90 + random() * 330;
    const x = -40 + i * 112 + random() * 30;
    const y = height - 180 - h;
    const shade = i < 7 ? "#08141f" : i < 13 ? "#0a1a27" : "#0d2332";
    buildings += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${shade}" stroke="#173e54" stroke-width="1" opacity="0.96"/>`;
    for (let wy = y + 16; wy < y + h - 12; wy += 22) {
      for (let wx = x + 10; wx < x + w - 7; wx += 18) {
        if (random() > 0.42) {
          buildings += `<rect x="${wx}" y="${wy}" width="4" height="5" fill="${random() > 0.86 ? C.orange : C.blue}" opacity="${0.34 + random() * 0.58}"/>`;
        }
      }
    }
  }
  return svgPng(
    width,
    height,
    `<g id="buildings">${buildings}</g>
     <path d="M0 ${height - 182} H${width}" stroke="${C.blue}" stroke-width="2" opacity="0.45"/>
     <path d="M0 ${height - 120} H${width}" stroke="${C.orange}" stroke-width="1" opacity="0.4"/>
     ${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 180} ${height - 178} V${height - 150}" stroke="${C.orange}" stroke-width="6" opacity="0.65"/>`).join("")}
     <rect y="${height - 104}" width="${width}" height="104" fill="${C.ink}" opacity="0.96"/>`,
  );
}

async function baseK05() {
  const W = 1920;
  const H = 1080;
  const cityBg = await officialCity(W, H, { brightness: 0.52, saturation: 1.35, position: "centre" });
  const overlays = await svgPng(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="#06111b" opacity="0.27"/>
     <path d="M0 0 H1920 V1080 H0 Z" fill="url(#nightShade)"/>
     <path d="M0 0 H770 L740 1080 H0 Z" fill="${C.ink}" opacity="0.74"/>
     <path d="M0 908 L1920 814" stroke="${C.orange}" stroke-width="2" opacity="0.38"/>
     <path d="M0 960 L1920 866" stroke="${C.orange}" stroke-width="1" opacity="0.22"/>`,
    `<linearGradient id="nightShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020913" stop-opacity="0.68"/><stop offset="0.42" stop-color="#061522" stop-opacity="0.08"/><stop offset="1" stop-color="#020609" stop-opacity="0.88"/></linearGradient>`,
  );
  const city = await cityStructures(W, H);
  const title = await svgPng(
    W,
    H,
    `${labelBox("04 / TOKYO-3", 72, 68, { fill: C.orange, color: C.ink, width: 185 })}
     ${labelBox("OFFICIAL IMAGE / 1.0", 1560, 68, { fill: "transparent", color: C.orange, border: C.orange, width: 258 })}
     ${text("TOKYO-3", 70, 246, { size: 74, fill: C.white, family: FONT.narrow, weight: 700, spacing: 2 })}
     ${text("第三新東京市", 70, 346, { size: 58, fill: C.paper, family: FONT.serif, weight: 800, spacing: 8 })}
     ${text("一座会把自己藏起来的城市。", 74, 402, { size: 21, fill: C.paper2, family: FONT.serif })}
     ${line(74, 432, 628, 432, C.orange, 2, 0.7)}
     ${text("地下都市 / 避难层 / NERV 总部", 74, 484, { size: 15, fill: C.white, family: FONT.sans, spacing: 1.3 })}
     ${text("GEOFRONT", 74, 570, { size: 12, fill: C.orange, family: FONT.narrow, spacing: 2.2 })}
     ${text("−720 M", 70, 634, { size: 52, fill: C.white, family: FONT.narrow, weight: 700 })}
     ${text("ASCENT", 356, 570, { size: 12, fill: C.orange, family: FONT.narrow, spacing: 2.2 })}
     ${text("62%", 354, 634, { size: 52, fill: C.blue, family: FONT.narrow, weight: 700 })}
     ${text("装甲层上升", 74, 724, { size: 25, fill: C.white, family: FONT.serif, weight: 700 })}
     ${text("楼群在警报与月光之间逐层苏醒。", 74, 758, { size: 16, fill: C.paper2, family: FONT.serif })}
     ${labelBox("地下都市档案", 74, 834, { fill: C.ink, color: C.white, border: C.orange, width: 218, height: 54, size: 17, family: FONT.sans })}
     ${text("NON-OFFICIAL CITY ATMOSPHERE NOT USED", 74, 1008, { size: 10, fill: C.smoke, family: FONT.narrow, spacing: 1.1 })}
     ${Array.from({ length: 12 }, (_, i) => `<text x="1722" y="${320 + i * 58}" fill="${C.white}" font-family="${FONT.serif}" font-size="72" font-weight="900" opacity="${0.9 - i * 0.025}">${xml("第三新東京市"[i] ?? " ")}</text>`).join("")}
     ${text("VERTICAL ACCESS / 05", 1694, 1018, { size: 11, fill: C.orange, family: FONT.narrow, spacing: 1.6 })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL POSTER", 74, 1040, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 1.2 })}`,
  );
  const depth = await svgPng(
    W,
    H,
    `<path d="M620 920 L930 652 L1120 652 L820 920 Z" fill="none" stroke="${C.orange}" stroke-width="1" opacity="0.3"/>
     <path d="M842 1040 L1108 760 L1240 760 L1000 1040 Z" fill="none" stroke="${C.white}" stroke-width="0.8" opacity="0.16"/>
     ${Array.from({ length: 9 }, (_, i) => `<circle cx="${1498 + i * 30}" cy="920" r="${i < 6 ? 2.5 : 1.5}" fill="${i < 6 ? C.orange : C.smoke}" opacity="${i < 6 ? 0.9 : 0.3}"/>`).join("")}
     ${text("UPLINK", 1496, 970, { size: 10, fill: C.smoke, family: FONT.narrow, spacing: 2 })}
     ${line(1490, 232, 1528, 232, C.orange, 2, 0.8)}
     ${line(1490, 232, 1490, 820, C.orange, 1, 0.3)}`,
  );
  return compose(W, H, C.ink, [
    { input: cityBg, left: 0, top: 0 },
    { input: overlays, left: 0, top: 0 },
    { input: city, left: 0, top: 0 },
    { input: depth, left: 0, top: 0 },
    { input: title, left: 0, top: 0 },
    { input: await dustLayer(W, H, C.orange, 48, 71), left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.08), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, H, 0.1), left: 0, top: 0 },
    { input: await svgPng(W, H, smallMarks(W, H, C.orange)), left: 0, top: 0 },
  ]);
}

async function baseK06() {
  const W = 1920;
  const H = 1080;
  const starCrop = await sharp(A.site30)
    .extract({ left: 0, top: 0, width: 430, height: 170 })
    .png()
    .toBuffer();
  const stars = await cover(starCrop, W, H, { brightness: 0.42, saturation: 0.8, blur: 2.4 });
  const film = await cover(A.trailerFinal, 250, H, { position: "left", brightness: 0.7, saturation: 0.88 });
  const field = await atField(W, H, {
    cx: 1372, cy: 438, radius: 360, gap: 1, fracture: 0.88, alpha: 0.95, seed: 2021,
  });
  const ghost = await ghostGroup(1240, 740, 0.13, true);
  const wave = await svgPng(
    W,
    H,
    `<path d="M0 790 C180 742 300 858 494 810 C680 764 790 886 990 824 C1190 762 1330 880 1510 818 C1660 766 1780 832 1920 786 V1080 H0 Z" fill="url(#lcl)"/>
     <path d="M0 842 C190 790 330 908 520 846 C720 782 870 924 1070 842 C1270 760 1430 918 1610 840 C1740 786 1840 814 1920 790" fill="none" stroke="${C.red}" stroke-width="2" opacity="0.62"/>
     <path d="M0 902 C220 850 350 972 560 900 C780 824 900 974 1120 898 C1340 822 1480 962 1680 884 C1800 840 1870 864 1920 846" fill="none" stroke="${C.orange}" stroke-width="1" opacity="0.34"/>`,
    `<linearGradient id="lcl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}" stop-opacity="0.05"/><stop offset="0.36" stop-color="${C.redDark}" stop-opacity="0.54"/><stop offset="1" stop-color="#120202" stop-opacity="0.98"/></linearGradient>`,
  );
  const filmOverlay = await svgPng(
    250,
    H,
    `<rect width="250" height="${H}" fill="${C.redDark}" opacity="0.22"/>
     <rect x="12" y="0" width="2" height="${H}" fill="${C.orange}" opacity="0.7"/>
     ${labelBox("FINAL IMAGE", 24, 36, { fill: C.ink, color: C.orange, border: C.orange, width: 146, height: 30 })}
     ${text("OFFICIAL", 24, 1014, { size: 10, fill: C.paper2, family: FONT.narrow, spacing: 1.8 })}
     ${text("TRAILER STILL", 24, 1032, { size: 10, fill: C.orange, family: FONT.narrow, spacing: 1.4 })}`,
  );
  const content = await svgPng(
    W,
    H,
    `${labelBox("06 / RELEASE", 72, 68, { fill: C.red, width: 165 })}
     ${labelBox("HEART WALL", 1490, 68, { fill: "transparent", color: C.red, border: C.red, width: 172 })}
     ${text("RELEASE", 70, 194, { size: 54, fill: C.paper, family: FONT.narrow, weight: 700, spacing: 4 })}
     ${text("心之壁", 66, 392, { size: 172, fill: C.white, family: FONT.serif, weight: 900, spacing: 10 })}
     ${text("AT FIELD / DISSOLUTION", 78, 440, { size: 15, fill: C.red, family: FONT.narrow, spacing: 3.4 })}
     ${line(78, 476, 670, 476, C.red, 2, 0.84)}
     ${text("不必艳羡风月，", 78, 552, { size: 37, fill: C.paper, family: FONT.serif, weight: 700 })}
     ${text("孤岛有孤岛的好。", 78, 602, { size: 37, fill: C.paper, family: FONT.serif, weight: 700 })}
     ${text("聚合不是结束。那是你最后一次确认自己的边界。", 78, 672, { size: 17, fill: C.paper2, family: FONT.serif })}
     ${labelBox("解除 AT 力场", 78, 748, { fill: C.paper, color: C.ink, width: 270, height: 60, size: 19, family: FONT.sans })}
     ${text("CLOSURE 1.00 → 0.00", 78, 842, { size: 11, fill: C.smoke, family: FONT.mono })}
     ${text("九角色索引 / 声音控制 / 来源与授权", 78, 880, { size: 14, fill: C.paper2, family: FONT.sans, spacing: 1.1 })}
     ${text("白场出现之前，先让所有影像离开。", 78, 916, { size: 14, fill: C.smoke, family: FONT.serif })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL POSTER", 78, 1024, { size: 11, fill: C.smoke, family: FONT.narrow, spacing: 1.2 })}`,
  );
  return compose(W, H, C.ink, [
    { input: stars, left: 0, top: 0 },
    { input: ghost, left: 500, top: 190, blend: "screen" },
    { input: film, left: 1670, top: 0 },
    { input: filmOverlay, left: 1670, top: 0 },
    { input: field.glow, left: 0, top: 0, blend: "screen" },
    { input: field.crisp, left: 0, top: 0 },
    { input: wave, left: 0, top: 0 },
    { input: content, left: 0, top: 0 },
    { input: await dustLayer(W, H, C.red, 120, 99), left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.1), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, H, 0.14), left: 0, top: 0 },
    { input: await svgPng(W, H, smallMarks(W, H, C.red)), left: 0, top: 0 },
  ]);
}

async function compositeImage(width, height, base, layers = []) {
  return sharp(base)
    .resize(width, height, { fit: "cover" })
    .composite(layers.filter(Boolean))
    .png()
    .toBuffer();
}

async function mobileChildren() {
  const W = 390;
  const H = 844;
  const paperGhost = await animateOpacity(
    await cover(A.site1995, W, 430, { grayscale: true, brightness: 1.45 }),
    0.045,
  );
  const bg = await svgPng(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${C.ink}"/>
     <rect width="${W}" height="492" fill="${C.ink}"/>
     <path d="M0 0 H390 V492 H0 Z" fill="url(#mBg)"/>
     <rect y="492" width="${W}" height="352" fill="${C.paper}"/>
     <path d="M26 492 H364" stroke="${C.red}" stroke-width="3"/>
     <pattern id="tinyGrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${C.red}" stroke-width="0.5" opacity="0.16"/></pattern>
     <rect y="492" width="${W}" height="352" fill="url(#tinyGrid)"/>`,
    `<radialGradient id="mBg" cx="54%" cy="38%" r="78%"><stop offset="0" stop-color="#18333e"/><stop offset="0.62" stop-color="#0b1115"/><stop offset="1" stop-color="${C.ink}"/></radialGradient>`,
  );
  const shinji = await fitHeight(A.shinji, 510);
  const rei = await fitHeight(A.rei, 420);
  const asuka = await fitHeight(A.asuka, 510);
  const kaworu = await fitHeight(A.kaworu, 390);
  const field = await atField(W, H, { cx: 292, cy: 212, radius: 116, alpha: 0.42, seed: 123 });
  const typography = await svgPng(
    W,
    H,
    `${labelBox("01 / CHILDREN", 20, 18, { fill: C.red, width: 142, height: 24, size: 10 })}
     ${text("適格者", 18, 108, { size: 54, fill: C.white, family: FONT.serif, weight: 900, spacing: 2 })}
     ${text("CHILDREN", 20, 132, { size: 11, fill: C.red, family: FONT.narrow, spacing: 3 })}
     ${text("五个孩子 / 五面镜子", 20, 476, { size: 11, fill: C.paper2, family: FONT.sans })}
     ${text("1995 → 2021", 346, 38, { size: 10, fill: C.paper2, family: FONT.narrow, anchor: "end", spacing: 1.5 })}
     ${text("角色档案", 22, 534, { size: 29, fill: C.ink, family: FONT.serif, weight: 800, spacing: 2 })}
     ${text("真嗣 / 丽 / 明日香 / 薰", 22, 566, { size: 15, fill: C.redDark, family: FONT.serif, weight: 600 })}
     ${line(22, 586, 368, 586, C.ink, 1.5, 0.82)}
     ${text("他们被称作适格者，却先要学习", 22, 624, { size: 15, fill: "#332f2a", family: FONT.serif })}
     ${text("如何与自己的身体和沉默共处。", 22, 648, { size: 15, fill: "#332f2a", family: FONT.serif })}
     ${text("把五个人放在同一条走廊里，", 22, 690, { size: 15, fill: "#332f2a", family: FONT.serif })}
     ${text("每个人仍只能独立完成自己的同步。", 22, 714, { size: 15, fill: "#332f2a", family: FONT.serif })}
     ${labelBox("1995 / TV", 22, 744, { fill: C.ink, width: 98, height: 28, size: 10 })}
     ${labelBox("2021 / NEW", 132, 744, { fill: "transparent", color: C.ink, border: C.ink, width: 106, height: 28, size: 10 })}
     ${labelBox("NO RECORD / 真理", 250, 744, { fill: "transparent", color: C.red, border: C.red, width: 118, height: 28, size: 9 })}
     ${text("NERV COMMAND：美里 / 律子 / 源堂", 22, 806, { size: 10, fill: "#5b554c", family: FONT.sans })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL", 22, 828, { size: 8, fill: C.red, family: FONT.narrow, spacing: 1.2 })}`,
  );
  return compose(W, H, C.ink, [
    { input: bg, left: 0, top: 0 },
    { input: paperGhost, left: 0, top: 492, blend: "multiply" },
    { input: field.glow, left: 0, top: 0, blend: "screen" },
    { input: field.crisp, left: 0, top: 0 },
    { input: shinji, left: -54, top: 38 },
    { input: kaworu, left: 262, top: 96 },
    { input: rei, left: 86, top: 104 },
    { input: asuka, left: 138, top: 38 },
    { input: typography, left: 0, top: 0 },
    { input: await grainOverlay(W, 492, 0.09), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, 492, 0.1), left: 0, top: 0 },
  ]);
}

async function mobileRelease() {
  const W = 390;
  const H = 844;
  const starCrop = await sharp(A.site30)
    .extract({ left: 0, top: 0, width: 420, height: 170 })
    .png()
    .toBuffer();
  const bg = await cover(starCrop, W, 500, { brightness: 0.48, blur: 0.35 });
  const field = await atField(W, H, {
    cx: 270, cy: 238, radius: 145, fracture: 0.82, alpha: 0.95, seed: 390,
  });
  const finalStrip = await cover(A.trailerFinal, 190, 500, {
    position: "left", brightness: 0.58, saturation: 0.8,
  });
  const typography = await svgPng(
    W,
    H,
    `${labelBox("06 / RELEASE", 18, 18, { fill: C.red, width: 128, height: 24, size: 10 })}
     ${text("心之壁", 16, 100, { size: 48, fill: C.white, family: FONT.serif, weight: 900, spacing: 2 })}
     ${text("HEART WALL", 20, 122, { size: 10, fill: C.red, family: FONT.narrow, spacing: 2.6 })}
     ${text("聚合不是结束。", 20, 438, { size: 15, fill: C.paper2, family: FONT.serif })}
     ${text("RELEASE / 06", 370, 38, { size: 9, fill: C.paper2, family: FONT.narrow, anchor: "end", spacing: 1.5 })}
     <rect y="500" width="${W}" height="344" fill="${C.ink}"/>
     <path d="M0 500 H390" stroke="${C.red}" stroke-width="3"/>
     ${text("不必艳羡风月，", 22, 566, { size: 26, fill: C.paper, family: FONT.serif, weight: 700 })}
     ${text("孤岛有孤岛的好。", 22, 606, { size: 26, fill: C.paper, family: FONT.serif, weight: 700 })}
     ${line(22, 628, 368, 628, C.red, 1.5, 0.82)}
     ${text("力场重新聚合，所有影像被吸入中心；", 22, 666, { size: 14, fill: C.paper2, family: FONT.serif })}
     ${text("点击解除后，只留下可读的终幕与来源。", 22, 690, { size: 14, fill: C.paper2, family: FONT.serif })}
     ${labelBox("解除 AT 力场", 22, 724, { fill: C.paper, color: C.ink, width: 196, height: 48, size: 16, family: FONT.sans })}
     ${text("CLOSURE 1.00 → 0.00", 234, 754, { size: 9, fill: C.smoke, family: FONT.mono })}
     ${text("九角色索引 · 声音控制 · 来源授权", 22, 804, { size: 10, fill: C.paper2, family: FONT.sans })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL", 22, 827, { size: 8, fill: C.red, family: FONT.narrow, spacing: 1.1 })}`,
  );
  const tint = await svgPng(190, 500, `<rect width="190" height="500" fill="${C.redDark}" opacity="0.28"/>`);
  return compose(W, H, C.ink, [
    { input: bg, left: 0, top: 0 },
    { input: finalStrip, left: 228, top: 0 },
    { input: tint, left: 228, top: 0 },
    { input: field.glow, left: 0, top: 0, blend: "screen" },
    { input: field.crisp, left: 0, top: 0 },
    { input: typography, left: 0, top: 0 },
    { input: await dustLayer(W, 500, C.red, 42, 66), left: 0, top: 0 },
    { input: await grainOverlay(W, H, 0.08), left: 0, top: 0, blend: "overlay" },
    { input: await scanlineOverlay(W, H, 0.1), left: 0, top: 0 },
  ]);
}

async function panelFromImage(buffer, number, title, subtitle, options = {}) {
  const W = 452;
  const H = 270;
  const {
    position = "centre", accent = C.red, overlay = "none", brightness = 0.72,
  } = options;
  const image = await cover(buffer, W, H, { position, brightness, saturation: 0.82 });
  let extra = "";
  if (overlay === "break") {
    extra = `<path d="M310 0 L236 270 H310 L386 0 Z" fill="${C.ink}" opacity="0.56"/>
      <path d="M248 0 L174 270" stroke="${C.red}" stroke-width="3" opacity="0.85"/>
      <path d="M202 0 L126 270" stroke="${C.white}" stroke-width="1" opacity="0.28"/>`;
  } else if (overlay === "scan") {
    extra = `<circle cx="300" cy="112" r="62" fill="none" stroke="${C.acid}" stroke-width="1.5" opacity="0.9"/>
      <circle cx="300" cy="112" r="78" fill="none" stroke="${C.acid}" stroke-width="0.7" opacity="0.38" stroke-dasharray="7 7"/>
      <path d="M232 112 H368 M300 44 V180" stroke="${C.acid}" stroke-width="1" opacity="0.55"/>
      <rect y="82" width="452" height="2" fill="${C.acid}" opacity="0.78"/>`;
  } else if (overlay === "fracture") {
    extra = `<path d="M40 220 L138 132 L92 70 L224 0 M246 270 L190 170 L290 110 L330 0 M388 270 L342 188 L430 118" fill="none" stroke="${C.red}" stroke-width="3" opacity="0.86"/>
      <path d="M252 0 L242 270" stroke="${C.ink}" stroke-width="8" opacity="0.9"/>`;
  } else if (overlay === "rise") {
    extra = `<path d="M24 238 H430" stroke="${C.orange}" stroke-width="2" opacity="0.8"/>
      <path d="M374 224 L386 212 L398 224" fill="none" stroke="${C.orange}" stroke-width="2"/>
      <path d="M386 212 V58" stroke="${C.orange}" stroke-width="2" stroke-dasharray="10 9" opacity="0.82"/>
      ${text("UP", 390, 46, { size: 11, fill: C.orange, family: FONT.narrow, anchor: "middle", spacing: 1.6 })}`;
  } else if (overlay === "film") {
    extra = `<g opacity="0.72">
      ${Array.from({ length: 10 }, (_, i) => `<rect x="14" y="${12 + i * 25}" width="14" height="12" fill="${C.paper}" opacity="0.8"/>`).join("")}
      ${text("05 / RECORDS", 288, 28, { size: 11, fill: C.paper, family: FONT.narrow, spacing: 1.4 })}
    </g>`;
  }
  const ui = await svgPng(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="url(#vignette)"/>
     ${extra}
     <rect x="0" y="0" width="69" height="36" fill="${accent}"/>
     ${text(number, 34, 25, { size: 19, fill: C.white, family: FONT.narrow, weight: 700, anchor: "middle" })}
     ${text(title, 84, 25, { size: 15, fill: C.paper, family: FONT.sans, weight: 700, spacing: 0.8 })}
     <rect y="220" width="${W}" height="50" fill="${C.ink}" opacity="0.94"/>
     ${text(subtitle, 14, 251, { size: 13, fill: C.paper2, family: FONT.sans })}
     <path d="M0 0 H452 V270 H0 Z" fill="none" stroke="${accent}" stroke-width="2" opacity="0.82"/>`,
    `<radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="0.48" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.58"/></radialGradient>`,
  );
  return compositeImage(W, H, image, [{ input: ui, left: 0, top: 0 }]);
}

async function buildContactSheet(keyframes) {
  const W = 1920;
  const H = 1080;
  const background = await svgPng(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="#0a0b0c"/>
     <path d="M0 0 H1920 V112 H0 Z" fill="${C.ink}"/>
     <path d="M0 112 H1920" stroke="${C.red}" stroke-width="2" opacity="0.86"/>
     <path d="M0 998 H1920 V1080 H0 Z" fill="${C.ink}"/>
     <path d="M0 998 H1920" stroke="${C.white}" stroke-width="1" opacity="0.16"/>
     <pattern id="sheetGrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${C.white}" stroke-width="0.4" opacity="0.035"/></pattern>
     <rect y="112" width="${W}" height="886" fill="url(#sheetGrid)"/>
     ${text("12 FRAME PREVIS", 28, 52, { size: 29, fill: C.paper, family: FONT.narrow, weight: 700, spacing: 3 })}
     ${text("NERV 同步协议 / 动态分镜缩写表", 30, 82, { size: 13, fill: C.paper2, family: FONT.sans, spacing: 1.5 })}
     ${labelBox("F01—F12", 1664, 28, { fill: C.red, width: 108, height: 30, size: 13 })}
     ${text("CONCEPT VISUAL / NON-OFFICIAL FAN PREVIS", 1664, 80, { size: 10, fill: C.smoke, family: FONT.narrow, anchor: "end", spacing: 1.2 })}
     ${text("镜头路径 × 力场状态 × 场景转场", 28, 1030, { size: 12, fill: C.paper2, family: FONT.sans })}
     ${text("SOURCE INDEX: visuals/CREDITS.md", 1892, 1030, { size: 10, fill: C.smoke, family: FONT.narrow, anchor: "end", spacing: 1.2 })}`,
  );
  const panels = [
    await panelFromImage(keyframes.k01, "F01", "拒绝接入", "黑场 · 闭合八边形 · 标题与按钮先可读", { position: "centre", overlay: "none", brightness: 0.82 }),
    await panelFromImage(keyframes.k01, "F02", "力场破门", "棱片压缩后向外错开 · 镜头穿过中心", { position: "centre", overlay: "break", brightness: 0.76 }),
    await panelFromImage(keyframes.k01, "F03", "主视觉建立", "群像底片横向铺开 · 扫描线只经过一次", { position: "right", overlay: "break", brightness: 0.72 }),
    await panelFromImage(keyframes.k02, "F04", "适格者走廊", "五块角色牌进入纵深 · 视线落在当前角色", { position: "right", accent: C.acid, brightness: 0.82 }),
    await panelFromImage(keyframes.k02, "F05", "年代翻面", "1995 / 2021 双面记录 · NERV 副档案向下延展", { position: "left", overlay: "film", accent: C.red }),
    await panelFromImage(keyframes.k03, "F06", "机库舱门", "真实机体影像进入近黑机库 · 橙色应急灯", { position: "right", overlay: "none", accent: C.orange }),
    await panelFromImage(keyframes.k03, "F07", "深度扫描", "扫描面通过装甲 · 缺陷与驾驶员数据同步变化", { position: "right", overlay: "scan", accent: C.acid }),
    await panelFromImage(keyframes.k04, "F08", "力场闭合", "AT 力场包住镜头 · 红色只留在棱线与警报", { position: "right", overlay: "none", brightness: 0.7 }),
    await panelFromImage(keyframes.k04, "F09", "中和力场", "八棱片沿法线碎裂 · 骨白档案接管读阅", { position: "right", overlay: "fracture" }),
    await panelFromImage(keyframes.k05, "F10", "东京上升", "Geofront → 装甲层 → 楼群 → 月光", { position: "right", overlay: "rise", accent: C.orange }),
    await panelFromImage(keyframes.k02, "F11", "胶片走廊", "六代载体纵深穿行 · 年份以硬切推进", { position: "right", overlay: "film", accent: C.red }),
    await panelFromImage(keyframes.k06, "F12", "心之壁崩解", "聚合 → 碎裂 → 近黑硬切 → 骨白终幕", { position: "right", overlay: "fracture" }),
  ];
  const positions = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      positions.push({ left: 28 + col * 470, top: 122 + row * 292 });
    }
  }
  const layers = panels.map((input, i) => ({ input, left: positions[i].left, top: positions[i].top }));
  return compose(W, H, C.ink, [{ input: background, left: 0, top: 0 }, ...layers]);
}

async function validateFile(file, expectedWidth, expectedHeight) {
  const meta = await sharp(file).metadata();
  if (meta.width !== expectedWidth || meta.height !== expectedHeight) {
    throw new Error(`${path.basename(file)} 尺寸错误：${meta.width}×${meta.height}`);
  }
  await sharp(file).stats();
  return { file, width: meta.width, height: meta.height };
}

async function main() {
  console.log("合成关键帧…");
  const k01 = await baseK01();
  await save(k01, "keyframes/k01-initialize.png");
  const k02 = await baseK02();
  await save(k02, "keyframes/k02-children.png");
  const k03 = await baseK03();
  await save(k03, "keyframes/k03-evangelion.png");
  const k04 = await baseK04();
  await save(k04, "keyframes/k04-angels.png");
  const k05 = await baseK05();
  await save(k05, "keyframes/k05-tokyo-3.png");
  const k06 = await baseK06();
  await save(k06, "keyframes/k06-release.png");

  console.log("合成移动端关键帧…");
  const mobile1 = await mobileChildren();
  await save(mobile1, "mobile/mobile-children.png");
  const mobile2 = await mobileRelease();
  await save(mobile2, "mobile/mobile-release.png");

  console.log("合成 12 帧联络表…");
  const contact = await buildContactSheet({ k01, k02, k03, k04, k05, k06 });
  await save(contact, "storyboard-contact-sheet.png");

  console.log("校验真实解码与尺寸…");
  const outputs = [
    ["keyframes/k01-initialize.png", 1920, 1080],
    ["keyframes/k02-children.png", 1920, 1080],
    ["keyframes/k03-evangelion.png", 1920, 1080],
    ["keyframes/k04-angels.png", 1920, 1080],
    ["keyframes/k05-tokyo-3.png", 1920, 1080],
    ["keyframes/k06-release.png", 1920, 1080],
    ["mobile/mobile-children.png", 390, 844],
    ["mobile/mobile-release.png", 390, 844],
    ["storyboard-contact-sheet.png", 1920, 1080],
  ];
  const results = [];
  for (const [relative, width, height] of outputs) {
    const result = await validateFile(path.join(OUT, relative), width, height);
    const size = (await fs.stat(result.file)).size;
    results.push({ ...result, size });
  }
  console.table(
    results.map((item) => ({
      文件: path.relative(OUT, item.file).replaceAll("\\", "/"),
      尺寸: `${item.width}×${item.height}`,
      字节: item.size,
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
