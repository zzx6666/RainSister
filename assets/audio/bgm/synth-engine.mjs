export const SAMPLE_RATE = 22050;
export const CHANNELS = 1;
export const BITS_PER_SAMPLE = 16;
export const BYTES_PER_SAMPLE = (BITS_PER_SAMPLE / 8) * CHANNELS;
export const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
};

export const dbToGain = (db) => 10 ** (db / 20);

export function rms(values, from = 0, to = values.length) {
  let sum = 0;
  for (let index = from; index < to; index += 1) sum += values[index] ** 2;
  return Math.sqrt(sum / Math.max(1, to - from));
}

export function peak(values) {
  let maximum = 0;
  for (const value of values) maximum = Math.max(maximum, Math.abs(value));
  return maximum;
}

export function hashSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seedText) {
  let state = hashSeed(seedText);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export const midiToHz = (note) => 440 * 2 ** ((note - 69) / 12);

function oscillator(phase, wave) {
  const wrapped = phase - Math.floor(phase / TAU) * TAU;
  if (wave === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(wrapped));
  if (wave === "soft-square") return Math.tanh(Math.sin(wrapped) * 3.2) / Math.tanh(3.2);
  if (wave === "saw") return 2 * (wrapped / TAU) - 1;
  return Math.sin(wrapped);
}

function envelope(position, length, attackSeconds, releaseSeconds, decaySeconds = 0) {
  const attack = Math.max(1, Math.round(attackSeconds * SAMPLE_RATE));
  const release = Math.max(1, Math.round(releaseSeconds * SAMPLE_RATE));
  const attackGain = smoothstep(position / attack);
  const releaseGain = smoothstep((length - position) / release);
  const decayGain = decaySeconds > 0 ? Math.exp(-(position / SAMPLE_RATE) / decaySeconds) : 1;
  return attackGain * releaseGain * decayGain;
}

export class AudioCanvas {
  constructor(duration, fadeSeconds) {
    this.duration = duration;
    this.loopSamples = Math.round(duration * SAMPLE_RATE);
    this.fadeSamples = Math.round(fadeSeconds * SAMPLE_RATE);
    this.samples = new Float64Array(this.loopSamples + this.fadeSamples);
    this.totalSamples = this.samples.length;
  }

  addTone({ start = 0, duration, frequency, amplitude, wave = "sine", attack = 0.01, release = 0.08, decay = 0, phase = 0, vibratoHz = 0, vibratoDepth = 0 }) {
    const startSample = Math.max(0, Math.round(start * SAMPLE_RATE));
    const length = Math.min(this.totalSamples - startSample, Math.max(1, Math.round(duration * SAMPLE_RATE)));
    if (length <= 0 || startSample >= this.totalSamples) return;
    for (let position = 0; position < length; position += 1) {
      const time = position / SAMPLE_RATE;
      const phaseMod = vibratoHz > 0 && vibratoDepth > 0
        ? (frequency * vibratoDepth / vibratoHz) * Math.sin(TAU * vibratoHz * time)
        : 0;
      this.samples[startSample + position] += amplitude * envelope(position, length, attack, release, decay) * oscillator(TAU * frequency * time + phase + phaseMod, wave);
    }
  }

  addAdditiveEvent({ start = 0, duration, frequency, amplitude, partials, attack = 0.008, release = 0.1, decay = 0, phaseSpread = 0 }) {
    partials.forEach((partial, index) => {
      this.addTone({
        start,
        duration,
        frequency: frequency * partial.ratio,
        amplitude: amplitude * partial.amplitude,
        wave: partial.wave ?? "sine",
        attack,
        release,
        decay: partial.decay ?? decay,
        phase: (phaseSpread * index) % TAU,
      });
    });
  }

  addPulse({ start, frequency = 58, amplitude = 0.22, duration = 0.48, endFrequency = 36, click = 0.06 }) {
    const startSample = Math.round(start * SAMPLE_RATE);
    const length = Math.min(this.totalSamples - startSample, Math.round(duration * SAMPLE_RATE));
    if (length <= 0 || startSample >= this.totalSamples) return;
    let phase = 0;
    for (let position = 0; position < length; position += 1) {
      const time = position / SAMPLE_RATE;
      const progress = position / length;
      const currentFrequency = endFrequency + (frequency - endFrequency) * Math.exp(-progress * 7);
      phase += (TAU * currentFrequency) / SAMPLE_RATE;
      const body = Math.sin(phase) * Math.exp(-progress * 7.4);
      const transient = position < SAMPLE_RATE * 0.012
        ? click * (1 - position / (SAMPLE_RATE * 0.012)) * (Math.sin(TAU * 2350 * time) + 0.4 * Math.sin(TAU * 3710 * time))
        : 0;
      this.samples[startSample + position] += amplitude * (body + transient);
    }
  }

  addNoiseBurst({ start, duration, amplitude, attack = 0.002, release, color = "white", seed }) {
    const random = makeRng(seed);
    const startSample = Math.max(0, Math.round(start * SAMPLE_RATE));
    const length = Math.min(this.totalSamples - startSample, Math.max(1, Math.round(duration * SAMPLE_RATE)));
    if (length <= 0 || startSample >= this.totalSamples) return;
    let low = 0;
    let previous = 0;
    for (let position = 0; position < length; position += 1) {
      const white = random() * 2 - 1;
      let sample = white;
      if (color === "dark") {
        low = low * 0.993 + white * 0.007;
        sample = low * 2.5;
      } else if (color === "bright") {
        sample = white - previous * 0.72;
      } else if (color === "band") {
        low = low * 0.84 + white * 0.16;
        sample = low - previous * 0.58;
      }
      previous = white;
      this.samples[startSample + position] += sample * amplitude * envelope(position, length, attack, release);
    }
  }

  addLoopVoice({ frequency, amplitude, wave = "sine", phase = 0, lfoCycles = 2, lfoDepth = 0.12, lfoPhase = 0 }) {
    // 频率量化到循环周期整数倍，持续音在接缝处保持同相位。
    const stableFrequency = Math.max(1, Math.round(frequency * this.duration)) / this.duration;
    for (let index = 0; index < this.totalSamples; index += 1) {
      const time = index / SAMPLE_RATE;
      const lfo = 1 - lfoDepth + lfoDepth * (0.5 + 0.5 * Math.sin(TAU * lfoCycles * time / this.duration + lfoPhase));
      this.samples[index] += amplitude * lfo * oscillator(TAU * stableFrequency * time + phase, wave);
    }
  }

  addPad(notes, amplitude, options = {}) {
    const brightness = options.brightness ?? 0.72;
    const movement = options.movement ?? 0.12;
    const detunes = options.detunes ?? [-0.0014, 0.0017];
    const partials = [
      { ratio: 1, gain: 1, wave: "triangle" },
      { ratio: 2, gain: 0.24 * brightness, wave: "sine" },
      { ratio: 3, gain: 0.13 * brightness, wave: "sine" },
      { ratio: 4, gain: 0.055 * brightness, wave: "sine" },
      { ratio: 5, gain: 0.028 * brightness, wave: "sine" },
    ];
    notes.forEach((note, noteIndex) => {
      detunes.forEach((detune, detuneIndex) => {
        partials.forEach((partial, partialIndex) => {
          this.addLoopVoice({
            frequency: midiToHz(note) * (1 + detune) * partial.ratio,
            amplitude: amplitude * partial.gain / (detunes.length * partials.length * Math.sqrt(notes.length)),
            wave: partial.wave,
            phase: noteIndex * 0.63 + detuneIndex * 1.37 + partialIndex * 0.41,
            lfoCycles: 1 + ((noteIndex + detuneIndex + partialIndex) % 3),
            lfoDepth: movement,
            lfoPhase: noteIndex * 0.8 + detuneIndex,
          });
        });
      });
    });
  }

  addPeriodicNoise({ amplitude, color = "air", seed, lfoCycles = 1, lfoDepth = 0 }) {
    const random = makeRng(seed);
    const loop = new Float64Array(this.loopSamples);
    let low = 0;
    let previous = 0;
    for (let index = 0; index < this.loopSamples; index += 1) {
      const white = random() * 2 - 1;
      let sample = white;
      if (color === "air") {
        low = low * 0.985 + white * 0.015;
        sample = white - low;
      } else if (color === "rumble") {
        low = low * 0.9985 + white * 0.0015;
        sample = low * 3.2;
      } else if (color === "tape") {
        low = low * 0.72 + white * 0.28;
        sample = low * 0.34 + (white - previous) * 0.18;
      }
      previous = white;
      loop[index] = sample;
    }
    const scale = amplitude / Math.max(1e-8, rms(loop));
    for (let index = 0; index < this.totalSamples; index += 1) {
      const lfo = 1 - lfoDepth + lfoDepth * (0.5 + 0.5 * Math.sin(TAU * lfoCycles * (index / SAMPLE_RATE) / this.duration));
      this.samples[index] += loop[index % this.loopSamples] * scale * lfo;
    }
  }

  addMultiTap(taps) {
    const snapshot = this.samples.slice();
    taps.forEach((tap) => {
      const delay = Math.max(1, Math.round(tap.delay * SAMPLE_RATE));
      for (let index = 0; index < this.totalSamples - delay; index += 1) {
        this.samples[index + delay] += snapshot[index] * tap.gain;
      }
    });
  }

  addCrackle({ start = 0, count, seed, amplitude, span = this.duration }) {
    const random = makeRng(seed);
    for (let index = 0; index < count; index += 1) {
      this.addNoiseBurst({
        start: start + random() * span,
        duration: 0.003 + random() * 0.014,
        amplitude: amplitude * (0.28 + random() * 0.72),
        attack: 0.0002,
        release: 0.002,
        color: "bright",
        seed: `${seed}-${index}`,
      });
    }
  }
}

export function applyLoopCrossfade(raw, loopSamples, fadeSamples) {
  const output = new Float64Array(loopSamples);
  for (let index = 0; index < fadeSamples; index += 1) {
    const position = index / Math.max(1, fadeSamples - 1);
    const tailGain = Math.cos(position * Math.PI * 0.5);
    const headGain = Math.sin(position * Math.PI * 0.5);
    output[index] = raw[loopSamples + index] * tailGain + raw[index] * headGain;
  }
  output.set(raw.subarray(fadeSamples, loopSamples), fadeSamples);
  return output;
}

function removeDc(values) {
  let mean = 0;
  for (const value of values) mean += value;
  mean /= values.length;
  for (let index = 0; index < values.length; index += 1) values[index] -= mean;
}

function softLimit(values) {
  const ceiling = 0.98;
  for (let index = 0; index < values.length; index += 1) {
    values[index] = Math.tanh(values[index]) * ceiling;
  }
}

function normalize(values, targetRms, peakCap) {
  const currentRms = rms(values);
  const currentPeak = peak(values);
  if (currentRms < 1e-9) throw new Error("音轨没有可听信号");
  const scale = Math.min(targetRms / currentRms, peakCap / Math.max(currentPeak, 1e-9));
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("音轨归一化失败");
  for (let index = 0; index < values.length; index += 1) values[index] *= scale;
}

export function finalizeAudio(canvas, targetRms, peakCap) {
  const loop = applyLoopCrossfade(canvas.samples, canvas.loopSamples, canvas.fadeSamples);
  removeDc(loop);
  softLimit(loop);
  removeDc(loop);
  normalize(loop, targetRms, peakCap);
  return loop;
}

export function encodeWav(samples, seed) {
  const dataBytes = samples.length * BYTES_PER_SAMPLE;
  const buffer = Buffer.allocUnsafe(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28);
  buffer.writeUInt16LE(BYTES_PER_SAMPLE, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);

  const dither = makeRng(`${seed}-dither`);
  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    // 三角分布抖动只影响最低位，确保 16-bit 转换可复现且不产生量化粘连。
    const ditherValue = (dither() - dither()) / 32768;
    const value = clamp(samples[index] + ditherValue, -1, 32767 / 32768);
    buffer.writeInt16LE(Math.round(value * 32767), offset);
    offset += 2;
  }
  return buffer;
}

export function parseWav(buffer) {
  if (buffer.length < 44) throw new Error("WAV 长度不足 44 字节");
  if (buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("缺少 RIFF 标识");
  if (buffer.readUInt32LE(4) + 8 !== buffer.length) throw new Error("RIFF 长度字段不匹配");
  if (buffer.toString("ascii", 8, 12) !== "WAVE") throw new Error("缺少 WAVE 标识");

  let offset = 12;
  let format = null;
  let data = null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (body + size > buffer.length) throw new Error(`区块 ${id} 越界`);
    if (id === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        byteRate: buffer.readUInt32LE(body + 8),
        blockAlign: buffer.readUInt16LE(body + 12),
        bitsPerSample: buffer.readUInt16LE(body + 14),
      };
    }
    if (id === "data") data = buffer.subarray(body, body + size);
    offset = body + size + (size % 2);
  }

  if (!format) throw new Error("缺少 fmt 区块");
  if (!data) throw new Error("缺少 data 区块");
  if (format.audioFormat !== 1) throw new Error("不是 PCM WAV");
  if (format.channels !== CHANNELS) throw new Error("声道数不正确");
  if (format.sampleRate !== SAMPLE_RATE) throw new Error("采样率不正确");
  if (format.bitsPerSample !== BITS_PER_SAMPLE) throw new Error("位深不正确");
  if (format.blockAlign !== BYTES_PER_SAMPLE) throw new Error("blockAlign 不正确");
  if (format.byteRate !== SAMPLE_RATE * BYTES_PER_SAMPLE) throw new Error("byteRate 不正确");
  if (data.length < 4 || data.length % BYTES_PER_SAMPLE !== 0) throw new Error("data 长度不正确");

  const samples = new Float64Array(data.length / BYTES_PER_SAMPLE);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = data.readInt16LE(index * 2) / 32768;
  }
  return { format, dataBytes: data.length, samples };
}

export function validateAudio(track, buffer) {
  const parsed = parseWav(buffer);
  const samples = parsed.samples;
  const duration = samples.length / SAMPLE_RATE;
  if (Math.abs(duration - track.duration) > 1 / SAMPLE_RATE) {
    throw new Error(`时长 ${duration.toFixed(3)}s 与目标 ${track.duration}s 不一致`);
  }

  const windowSize = Math.min(Math.round(SAMPLE_RATE * 0.35), Math.floor(samples.length / 4));
  const headRms = rms(samples, 0, windowSize);
  const tailRms = rms(samples, samples.length - windowSize, samples.length);
  const headDb = 20 * Math.log10(Math.max(headRms, 1e-9));
  const tailDb = 20 * Math.log10(Math.max(tailRms, 1e-9));
  const energyDeltaDb = Math.abs(headDb - tailDb);
  const seamDelta = Math.abs(samples[0] - samples[samples.length - 1]);
  const currentPeak = peak(samples);
  const currentRms = rms(samples);

  if (currentPeak > 0.99) throw new Error("采样峰值超过 -0.09 dBFS 安全范围");
  if (currentRms < dbToGain(-34)) throw new Error("整体响度过低");
  if (headRms < dbToGain(-42) || tailRms < dbToGain(-42)) throw new Error("首尾能量过低");
  if (energyDeltaDb > 3.5) throw new Error(`首尾能量差 ${energyDeltaDb.toFixed(2)} dB 超过 3.5 dB`);
  if (seamDelta > 0.42) throw new Error(`循环接缝采样差 ${seamDelta.toFixed(3)} 超过安全阈值`);

  return {
    duration,
    dataBytes: parsed.dataBytes,
    peakDb: 20 * Math.log10(Math.max(currentPeak, 1e-9)),
    rmsDb: 20 * Math.log10(Math.max(currentRms, 1e-9)),
    headDb,
    tailDb,
    energyDeltaDb,
    seamDelta,
  };
}
