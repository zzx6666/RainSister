import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const 输出目录 = dirname(fileURLToPath(import.meta.url));
const PNG签名 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC表 = (() => {
  const 表 = new Uint32Array(256);
  for (let 序号 = 0; 序号 < 256; 序号 += 1) {
    let 值 = 序号;
    for (let 位 = 0; 位 < 8; 位 += 1) {
      值 = 值 & 1 ? 0xedb88320 ^ (值 >>> 1) : 值 >>> 1;
    }
    表[序号] = 值 >>> 0;
  }
  return 表;
})();

function 计算CRC32(数据) {
  let 校验值 = 0xffffffff;
  for (const 字节 of 数据) {
    校验值 = CRC表[(校验值 ^ 字节) & 0xff] ^ (校验值 >>> 8);
  }
  return (校验值 ^ 0xffffffff) >>> 0;
}

function 创建数据块(类型, 数据 = Buffer.alloc(0)) {
  const 类型数据 = Buffer.concat([Buffer.from(类型, "ascii"), 数据]);
  const 长度 = Buffer.alloc(4);
  长度.writeUInt32BE(数据.length);
  const 校验值 = Buffer.alloc(4);
  校验值.writeUInt32BE(计算CRC32(类型数据));
  return Buffer.concat([长度, 类型数据, 校验值]);
}

function 编码PNG({ 宽, 高, 颜色类型, 像素 }) {
  const 头数据 = Buffer.alloc(13);
  头数据.writeUInt32BE(宽, 0);
  头数据.writeUInt32BE(高, 4);
  头数据[8] = 8; // 8 位色深
  头数据[9] = 颜色类型; // 0 = 灰度，6 = RGBA
  头数据[10] = 0; // DEFLATE
  头数据[11] = 0; // 自适应滤波
  头数据[12] = 0; // 非隔行扫描

  return Buffer.concat([
    PNG签名,
    创建数据块("IHDR", 头数据),
    创建数据块("IDAT", deflateSync(像素, { level: 9 })),
    创建数据块("IEND"),
  ]);
}

function 创建确定性随机数(种子) {
  let 状态 = 种子 >>> 0;
  return () => {
    状态 += 0x6d2b79f5;
    let 值 = 状态;
    值 = Math.imul(值 ^ (值 >>> 15), 值 | 1);
    值 ^= 值 + Math.imul(值 ^ (值 >>> 7), 值 | 61);
    return ((值 ^ (值 >>> 14)) >>> 0) / 4294967296;
  };
}

function 生成颗粒() {
  const 宽 = 256;
  const 高 = 256;
  const 随机 = 创建确定性随机数(0x4e455256); // NERV
  const 像素 = Buffer.alloc(高 * (宽 + 1));

  for (let y = 0; y < 高; y += 1) {
    const 行首 = y * (宽 + 1);
    像素[行首] = 0; // PNG 无滤波，便于复现和验证
    for (let x = 0; x < 宽; x += 1) {
      const 低频起伏 = Math.sin(((x + y * 0.35) * Math.PI) / 23) * 6;
      const 值 = 127 + (随机() - 0.5) * 224 + 低频起伏;
      像素[行首 + x + 1] = Math.max(8, Math.min(247, Math.round(值)));
    }
  }

  return { 文件名: "grain.png", 宽, 高, 颜色类型: 0, 像素 };
}

function 生成扫描线() {
  const 宽 = 64;
  const 高 = 8;
  const 像素 = Buffer.alloc(高 * (宽 * 4 + 1));

  for (let y = 0; y < 高; y += 1) {
    const 行首 = y * (宽 * 4 + 1);
    像素[行首] = 0; // PNG 无滤波
    for (let x = 0; x < 宽; x += 1) {
      const 偏移 = 行首 + 1 + x * 4;
      // 第 1 行为主扫描线，第 2 行为柔和回响，其余保持完全透明。
      const 透明度 = y === 0 ? 150 : y === 1 ? 38 : 0;
      像素[偏移] = 0;
      像素[偏移 + 1] = 0;
      像素[偏移 + 2] = 0;
      像素[偏移 + 3] = 透明度;
    }
  }

  return { 文件名: "scanlines.png", 宽, 高, 颜色类型: 6, 像素 };
}

function 验证PNG(纹理) {
  const 路径 = join(输出目录, 纹理.文件名);
  const 文件 = readFileSync(路径);
  if (!文件.subarray(0, 8).equals(PNG签名)) throw new Error(`${纹理.文件名} 的 PNG 签名无效`);

  let 偏移 = 8;
  let 图像头 = null;
  const 图像数据 = [];
  while (偏移 < 文件.length) {
    const 长度 = 文件.readUInt32BE(偏移);
    const 类型 = 文件.toString("ascii", 偏移 + 4, 偏移 + 8);
    const 数据 = 文件.subarray(偏移 + 8, 偏移 + 8 + 长度);
    const 存储校验 = 文件.readUInt32BE(偏移 + 8 + 长度);
    const 实算校验 = 计算CRC32(文件.subarray(偏移 + 4, 偏移 + 8 + 长度));
    if (存储校验 !== 实算校验) throw new Error(`${纹理.文件名} 的 ${类型} 数据块 CRC 无效`);
    if (类型 === "IHDR") 图像头 = 数据;
    if (类型 === "IDAT") 图像数据.push(数据);
    偏移 += 12 + 长度;
  }

  if (!图像头 || 图像数据.length === 0) throw new Error(`${纹理.文件名} 缺少必要数据块`);
  const 宽 = 图像头.readUInt32BE(0);
  const 高 = 图像头.readUInt32BE(4);
  const 色深 = 图像头[8];
  const 颜色类型 = 图像头[9];
  const 通道数 = 颜色类型 === 0 ? 1 : 颜色类型 === 6 ? 4 : 0;
  if (宽 !== 纹理.宽 || 高 !== 纹理.高 || 色深 !== 8 || 通道数 === 0) {
    throw new Error(`${纹理.文件名} 的图像头与预期不符`);
  }

  const 解压数据 = inflateSync(Buffer.concat(图像数据));
  const 每行字节 = 1 + 宽 * 通道数;
  if (解压数据.length !== 每行字节 * 高) throw new Error(`${纹理.文件名} 的扫描线长度无效`);
  for (let y = 0; y < 高; y += 1) {
    if (解压数据[y * 每行字节] !== 0) throw new Error(`${纹理.文件名} 含非预期滤波`);
  }

  if (纹理.文件名 === "scanlines.png") {
    for (let y = 0; y < 高; y += 1) {
      const 预期透明度 = y === 0 ? 150 : y === 1 ? 38 : 0;
      for (let x = 0; x < 宽; x += 1) {
        const 透明度 = 解压数据[y * 每行字节 + 1 + x * 4 + 3];
        if (透明度 !== 预期透明度) throw new Error("scanlines.png 的透明度分布无效");
      }
    }
  }

  return {
    文件: 纹理.文件名,
    尺寸: `${宽}×${高}`,
    字节数: 文件.length,
    SHA256: createHash("sha256").update(文件).digest("hex"),
  };
}

const 纹理列表 = [生成颗粒(), 生成扫描线()];
for (const 纹理 of 纹理列表) {
  const 路径 = join(输出目录, 纹理.文件名);
  writeFileSync(路径, 编码PNG(纹理));
}

console.log(JSON.stringify(纹理列表.map(验证PNG), null, 2));
