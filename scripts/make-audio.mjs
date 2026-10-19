import { mkdirSync, writeFileSync } from "node:fs";

const sampleRate = 44100;
const duration = 18;
const channels = 1;
const bitsPerSample = 16;
const sampleCount = sampleRate * duration;
const pcm = Buffer.alloc(sampleCount * 2);

let seed = 0x12345678;
function noise() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
}

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  const fadeIn = Math.min(1, time / 1.8);
  const fadeOut = Math.min(1, (duration - time) / 3);
  const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
  const drone =
    0.22 * Math.sin(2 * Math.PI * 55 * time) +
    0.14 * Math.sin(2 * Math.PI * 82.41 * time + 0.3) +
    0.08 * Math.sin(2 * Math.PI * 110 * time + 1.2);
  const tremolo = 0.86 + 0.14 * Math.sin(2 * Math.PI * 0.13 * time);
  const signal = (drone * tremolo + noise() * 0.012) * envelope;
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, signal)) * 32767), index * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
header.writeUInt16LE((channels * bitsPerSample) / 8, 32);
header.writeUInt16LE(bitsPerSample, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);

mkdirSync("assets/audio", { recursive: true });
writeFileSync("assets/audio/night-signal.wav", Buffer.concat([header, pcm]));
console.log("assets/audio/night-signal.wav");
