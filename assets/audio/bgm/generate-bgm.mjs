#!/usr/bin/env node

/**
 * 项目原创程序化 BGM 生成器。
 *
 * 所有声音均由本地振荡器、确定性噪声、包络与延迟网络合成；
 * 不读取、采样、拼接或克隆任何 EVA OST、原声、歌曲或第三方音乐。
 *
 * 用法：
 *   node assets/audio/bgm/generate-bgm.mjs          生成并校验全部音轨
 *   node assets/audio/bgm/generate-bgm.mjs --check  只校验现有音轨
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AudioCanvas,
  BITS_PER_SAMPLE,
  SAMPLE_RATE,
  encodeWav,
  finalizeAudio,
  validateAudio,
} from "./synth-engine.mjs";
import {
  buildAngels,
  buildChildren,
  buildEvangelion,
  buildInitialize,
  buildRecords,
  buildRelease,
  buildTokyo3,
} from "./track-recipes.mjs";

const CROSSFADE_SECONDS = 0.18;
const MAX_TOTAL_BYTES = 6 * 1024 * 1024;
const OUTPUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const TRACKS = [
  {
    file: "01-initialize.wav",
    scene: "top / initialize",
    title: "AT FIELD: COLD START",
    duration: 14,
    seed: "initialize-red-field",
    targetRms: 0.074,
    peakCap: 0.84,
    build: buildInitialize,
  },
  {
    file: "02-children.wav",
    scene: "children",
    title: "A ROOM FOR ONE",
    duration: 15,
    seed: "children-quiet-heart",
    targetRms: 0.067,
    peakCap: 0.79,
    build: buildChildren,
  },
  {
    file: "03-evangelion.wav",
    scene: "evangelion",
    title: "SYNCHRONIZED MASS",
    duration: 15,
    seed: "evangelion-machine-room",
    targetRms: 0.081,
    peakCap: 0.88,
    build: buildEvangelion,
  },
  {
    file: "04-angels.wav",
    scene: "angels",
    title: "GEOMETRY OF LIGHT",
    duration: 16,
    seed: "angels-inharmonic-choir",
    targetRms: 0.063,
    peakCap: 0.78,
    build: buildAngels,
  },
  {
    file: "05-tokyo-3.wav",
    scene: "tokyo-3",
    title: "CITY UNDER THE CITY",
    duration: 15,
    seed: "tokyo-3-underground-rise",
    targetRms: 0.073,
    peakCap: 0.84,
    build: buildTokyo3,
  },
  {
    file: "06-records.wav",
    scene: "records",
    title: "TWO ERAS, ONE PROJECTOR",
    duration: 14,
    seed: "records-dust-and-celluloid",
    targetRms: 0.059,
    peakCap: 0.75,
    build: buildRecords,
  },
  {
    file: "07-release.wav",
    scene: "release",
    title: "THE WALL GIVES WAY",
    duration: 16,
    seed: "release-lcl-afterglow",
    targetRms: 0.061,
    peakCap: 0.79,
    build: buildRelease,
  },
];

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

async function generateTrack(track) {
  const canvas = new AudioCanvas(track.duration, CROSSFADE_SECONDS);
  track.build(canvas);
  const samples = finalizeAudio(canvas, track.targetRms, track.peakCap);
  const wav = encodeWav(samples, track.seed);
  await writeFile(path.join(OUTPUT_DIR, track.file), wav);
  return wav;
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(checkOnly ? "仅校验现有项目原创 BGM\n" : "生成项目原创程序化 BGM\n");

  let totalBytes = 0;
  const summaries = [];
  for (const track of TRACKS) {
    const wav = checkOnly
      ? await readFile(path.join(OUTPUT_DIR, track.file))
      : await generateTrack(track);
    const validation = validateAudio(track, wav);
    const hash = createHash("sha256").update(wav).digest("hex").slice(0, 16);
    totalBytes += wav.length;
    summaries.push({ track, validation, bytes: wav.length, hash });
    console.log(
      `${track.file} | ${track.scene} | ${validation.duration.toFixed(2)}s | ${formatBytes(wav.length)} | ` +
      `峰值 ${validation.peakDb.toFixed(1)} dBFS | RMS ${validation.rmsDb.toFixed(1)} dBFS | ` +
      `首尾差 ${validation.energyDeltaDb.toFixed(2)} dB | SHA ${hash}`,
    );
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error(`BGM 总计 ${formatBytes(totalBytes)}，超过 6 MiB 预算`);
  }
  console.log(`\nBGM 总计：${formatBytes(totalBytes)}，低于 6 MiB 预算。`);
  console.log(`采样规格：${SAMPLE_RATE} Hz / ${BITS_PER_SAMPLE}-bit / 单声道 PCM WAV。`);
  console.log(`循环处理：${(CROSSFADE_SECONDS * 1000).toFixed(0)} ms 等功率首尾交叉淡化。`);
  console.log("校验通过：RIFF 长度、PCM 规格、data 区块、峰响度、首尾能量与循环接缝。\n");

  if (!checkOnly) {
    console.log("听感索引：");
    console.log("01 初始化：低频压迫、远距警告钟与机械继电器；克制而不霓虹。");
    console.log("02 孩子们：温暖开放和弦、双次心跳与稀疏音乐盒，孤独但不悲情。");
    console.log("03 机体：96 BPM 6/4 机械结构、金属非谐波敲击与锯齿低音。");
    console.log("04 使徒：小二度/三全音持续音、类圣咏泛音与缓慢呼吸。");
    console.log("05 第三新东京市：128 BPM 冷色琶音、地下隆隆与城市升降脉冲。");
    console.log("06 年代档案：放映机抖闪、磁带底噪、旧钢琴与短廊回声。");
    console.log("07 终幕：开放 D 和声收束、长延迟尾迹与低频归于平静。\n");
  }

  console.log("校验摘要（文件名 / 时长 / 字节 / SHA-256 前 16 位）：");
  for (const item of summaries) {
    console.log(`${item.track.file}\t${item.validation.duration.toFixed(3)}s\t${item.bytes}\t${item.hash}`);
  }
}

main().catch((error) => {
  console.error(`生成或校验失败：${error.stack ?? error.message}`);
  process.exitCode = 1;
});
