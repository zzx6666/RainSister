import { midiToHz } from "./synth-engine.mjs";

function addWarningPulse(canvas, start, seed, intensity = 1) {
  addBell(canvas, { start, frequency: 261.63, amplitude: 0.038 * intensity, duration: 1.8, seed: `${seed}-a` });
  addBell(canvas, { start: start + 0.19, frequency: 311.13, amplitude: 0.029 * intensity, duration: 2.1, seed: `${seed}-b` });
  canvas.addTone({
    start,
    duration: 0.52,
    frequency: 73.42,
    amplitude: 0.035 * intensity,
    wave: "soft-square",
    attack: 0.03,
    release: 0.24,
  });
}

function addHeartbeat(canvas, start, strength, seed) {
  canvas.addPulse({ start, frequency: 55, endFrequency: 34, amplitude: 0.17 * strength, duration: 0.42, click: 0 });
  canvas.addPulse({ start: start + 0.17, frequency: 48, endFrequency: 31, amplitude: 0.11 * strength, duration: 0.34, click: 0 });
  canvas.addNoiseBurst({ start: start + 0.02, duration: 0.09, amplitude: 0.011 * strength, attack: 0.006, release: 0.05, color: "dark", seed });
}

function addBell(canvas, { start, frequency, amplitude = 0.1, duration = 2.4, seed = "bell" }) {
  canvas.addAdditiveEvent({
    start,
    duration,
    frequency,
    amplitude,
    partials: [
      { ratio: 1, amplitude: 1, decay: 0.72 },
      { ratio: 2.01, amplitude: 0.35, decay: 0.42 },
      { ratio: 3.98, amplitude: 0.16, decay: 0.28 },
      { ratio: 6.93, amplitude: 0.07, decay: 0.17 },
    ],
    attack: 0.006,
    release: 0.65,
    phaseSpread: 0.93,
  });
  canvas.addNoiseBurst({ start, duration: 0.038, amplitude: amplitude * 0.32, attack: 0.0005, release: 0.018, color: "bright", seed });
}

function addMechanicalHit(canvas, { start, amplitude = 1, pitch = 1, seed }) {
  canvas.addNoiseBurst({ start, duration: 0.075, amplitude: 0.085 * amplitude, attack: 0.0005, release: 0.025, color: "band", seed: `${seed}-noise` });
  canvas.addAdditiveEvent({
    start,
    duration: 0.9,
    frequency: 176 * pitch,
    amplitude: 0.095 * amplitude,
    partials: [
      { ratio: 1, amplitude: 1 },
      { ratio: 2.37, amplitude: 0.54 },
      { ratio: 4.13, amplitude: 0.26 },
      { ratio: 6.79, amplitude: 0.12 },
    ],
    attack: 0.001,
    decay: 0.17,
    release: 0.35,
    phaseSpread: 1.13,
  });
  canvas.addPulse({ start, frequency: 88 * pitch, endFrequency: 43 * pitch, amplitude: 0.15 * amplitude, duration: 0.42, click: 0.025 });
}

function addPianoNote(canvas, { start, note, amplitude = 0.1, duration = 3.2 }) {
  const frequency = midiToHz(note);
  canvas.addAdditiveEvent({
    start,
    duration,
    frequency,
    amplitude,
    partials: [
      { ratio: 1, amplitude: 1, decay: 1.35 },
      { ratio: 2.002, amplitude: 0.42, decay: 0.72 },
      { ratio: 3.008, amplitude: 0.2, decay: 0.48 },
      { ratio: 4.013, amplitude: 0.09, decay: 0.3 },
    ],
    attack: 0.004,
    release: 0.72,
    phaseSpread: 0.47,
  });
  canvas.addNoiseBurst({ start, duration: 0.026, amplitude: amplitude * 0.1, attack: 0.0004, release: 0.012, color: "band", seed: `${note}-${start}` });
}

export function buildInitialize(canvas) {
  // 黑色空间、低频 AT 力场与克制而规律的警告脉冲。
  canvas.addPad([26, 33, 38], 0.48, { brightness: 0.36, movement: 0.2 });
  canvas.addLoopVoice({ frequency: midiToHz(26), amplitude: 0.115, wave: "soft-square", lfoCycles: 2, lfoDepth: 0.1 });
  canvas.addLoopVoice({ frequency: midiToHz(38), amplitude: 0.03, wave: "triangle", lfoCycles: 3, lfoDepth: 0.4, lfoPhase: 1.2 });
  canvas.addPeriodicNoise({ amplitude: 0.028, color: "rumble", seed: "initialize-rumble", lfoCycles: 2, lfoDepth: 0.42 });
  canvas.addPeriodicNoise({ amplitude: 0.011, color: "air", seed: "initialize-air", lfoCycles: 5, lfoDepth: 0.25 });

  for (let index = 0; index < 6; index += 1) {
    addWarningPulse(canvas, 0.8 + index * 2.25, `initialize-warning-${index}`, index === 0 ? 0.7 : 1);
  }
  canvas.addPulse({ start: 1.35, frequency: 62, endFrequency: 31, amplitude: 0.21, duration: 0.62 });
  canvas.addPulse({ start: 5.95, frequency: 64, endFrequency: 32, amplitude: 0.19, duration: 0.6 });
  canvas.addPulse({ start: 10.6, frequency: 66, endFrequency: 33, amplitude: 0.2, duration: 0.62 });
  addMechanicalHit(canvas, { start: 7.36, amplitude: 0.42, pitch: 0.72, seed: "initialize-relay" });

  canvas.addTone({ start: 3.7, duration: 3.6, frequency: 146.83, amplitude: 0.014, wave: "triangle", attack: 1.2, release: 1.1, vibratoHz: 0.17, vibratoDepth: 0.006 });
  canvas.addTone({ start: 8.9, duration: 4.6, frequency: 155.56, amplitude: 0.012, wave: "triangle", attack: 1.6, release: 1.5, vibratoHz: 0.14, vibratoDepth: 0.005 });
  canvas.addMultiTap([
    { delay: 0.137, gain: 0.16 },
    { delay: 0.281, gain: 0.1 },
    { delay: 0.479, gain: 0.055 },
  ]);
}

export function buildChildren(canvas) {
  // 温暖但不拥挤的和弦、双次心跳与稀疏音乐盒音型。
  canvas.addPad([50, 57, 62, 64, 69], 0.43, { brightness: 0.58, movement: 0.16, detunes: [-0.0009, 0.0012] });
  canvas.addLoopVoice({ frequency: midiToHz(38), amplitude: 0.045, wave: "triangle", lfoCycles: 1, lfoDepth: 0.35 });
  canvas.addPeriodicNoise({ amplitude: 0.009, color: "tape", seed: "children-room-air", lfoCycles: 3, lfoDepth: 0.28 });

  for (let index = 0; index < 8; index += 1) {
    addHeartbeat(canvas, 0.86 + index * 1.78, index % 4 === 0 ? 1 : 0.72, `children-heart-${index}`);
  }

  const chordChanges = [
    { start: 1.6, duration: 3.3, notes: [53, 60, 64, 67, 71] },
    { start: 5.0, duration: 3.7, notes: [48, 55, 64, 67, 71] },
    { start: 8.8, duration: 3.4, notes: [50, 57, 62, 65, 69] },
    { start: 12.15, duration: 2.9, notes: [45, 52, 57, 64, 69] },
  ];
  for (const change of chordChanges) {
    for (const note of change.notes) {
      canvas.addTone({
        start: change.start,
        duration: change.duration,
        frequency: midiToHz(note),
        amplitude: 0.017,
        wave: "triangle",
        attack: 0.52,
        release: 0.74,
        vibratoHz: 0.11,
        vibratoDepth: 0.002,
      });
    }
  }

  const motif = [66, 69, 74, 71, 69, 64, 66, 62];
  motif.forEach((note, index) => {
    addBell(canvas, {
      start: 2.25 + index * 1.48,
      frequency: midiToHz(note),
      amplitude: 0.021 + (index % 3) * 0.002,
      duration: 2.7,
      seed: `children-motif-${index}`,
    });
  });
  canvas.addMultiTap([
    { delay: 0.211, gain: 0.13 },
    { delay: 0.379, gain: 0.08 },
    { delay: 0.617, gain: 0.047 },
  ]);
}

export function buildEvangelion(canvas) {
  // 96 BPM 的 6/4 机械循环，突出金属敲击、伺服声与压迫低音。
  const beat = 60 / 96;
  canvas.addPad([33, 40, 45], 0.29, { brightness: 0.26, movement: 0.09, detunes: [-0.0018, 0.0015] });
  canvas.addLoopVoice({ frequency: midiToHz(28), amplitude: 0.12, wave: "soft-square", lfoCycles: 3, lfoDepth: 0.08 });
  canvas.addPeriodicNoise({ amplitude: 0.023, color: "rumble", seed: "evangelion-sub-rumble", lfoCycles: 4, lfoDepth: 0.22 });

  const bassPattern = [33, 33, 36, 31, 33, 40, 33, 36];
  for (let bar = 0; bar < 4; bar += 1) {
    for (let step = 0; step < 6; step += 1) {
      const note = bassPattern[(bar * 6 + step) % bassPattern.length];
      canvas.addTone({
        start: (bar * 6 + step) * beat,
        duration: beat * 0.82,
        frequency: midiToHz(note),
        amplitude: step === 0 ? 0.074 : 0.045,
        wave: "saw",
        attack: 0.008,
        release: 0.11,
        decay: 0.28,
      });
    }
  }

  for (let index = 0; index < 24; index += 1) {
    const time = index * beat;
    const accent = index % 6 === 0 ? 1 : index % 6 === 3 ? 0.72 : 0.43;
    canvas.addPulse({ start: time, frequency: 76, endFrequency: 39, amplitude: 0.16 * accent, duration: 0.31, click: 0.012 });
    if (index % 2 === 1) {
      addMechanicalHit(canvas, {
        start: time + beat * 0.27,
        amplitude: 0.34 + 0.17 * accent,
        pitch: 0.88 + (index % 3) * 0.13,
        seed: `evangelion-hit-${index}`,
      });
    }
  }

  for (let index = 0; index < 8; index += 1) {
    canvas.addNoiseBurst({
      start: index * 1.875 + 1.1,
      duration: 0.18,
      amplitude: 0.028,
      attack: 0.014,
      release: 0.11,
      color: "band",
      seed: `evangelion-servo-${index}`,
    });
  }
  canvas.addTone({ start: 3.75, duration: 3.2, frequency: 184.997, amplitude: 0.011, wave: "triangle", attack: 0.8, release: 0.9, vibratoHz: 1.16, vibratoDepth: 0.016 });
  canvas.addTone({ start: 9.35, duration: 3.65, frequency: 207.652, amplitude: 0.01, wave: "triangle", attack: 0.9, release: 0.9, vibratoHz: 0.73, vibratoDepth: 0.013 });
  canvas.addMultiTap([
    { delay: 0.091, gain: 0.1 },
    { delay: 0.173, gain: 0.07 },
    { delay: 0.317, gain: 0.04 },
  ]);
}

export function buildAngels(canvas) {
  // 小二度与三全音持续音、类圣咏泛音和缓慢呼吸，不使用常规科幻琶音。
  canvas.addPad([38, 39, 45, 50, 57], 0.39, { brightness: 0.82, movement: 0.28, detunes: [-0.0017, 0.0019, 0.0004] });
  canvas.addLoopVoice({ frequency: midiToHz(26), amplitude: 0.07, wave: "sine", lfoCycles: 2, lfoDepth: 0.36, lfoPhase: 1.8 });
  canvas.addLoopVoice({ frequency: midiToHz(39), amplitude: 0.022, wave: "triangle", lfoCycles: 5, lfoDepth: 0.52 });
  canvas.addPeriodicNoise({ amplitude: 0.006, color: "air", seed: "angels-breath", lfoCycles: 2, lfoDepth: 0.62 });

  const choirNotes = [50, 51, 57, 62, 63, 69, 75];
  const formants = [1, 2, 3, 4, 6];
  const formantGains = [0.032, 0.018, 0.011, 0.0055, 0.0028];
  choirNotes.forEach((note, index) => {
    formants.forEach((ratio, partialIndex) => {
      canvas.addLoopVoice({
        frequency: midiToHz(note) * ratio,
        amplitude: formantGains[partialIndex] / Math.sqrt(choirNotes.length),
        wave: "sine",
        phase: index * 0.71 + partialIndex * 0.33,
        lfoCycles: 1 + ((index + partialIndex) % 4),
        lfoDepth: 0.58,
        lfoPhase: partialIndex * 0.9 + index * 0.2,
      });
    });
  });

  for (let index = 0; index < 5; index += 1) {
    canvas.addTone({
      start: index * 3.15 + 0.45,
      duration: 2.8,
      frequency: 392 * (index % 2 === 0 ? 1 : 1.059463),
      amplitude: 0.0085,
      wave: "triangle",
      attack: 0.9,
      release: 1.05,
      vibratoHz: 0.23,
      vibratoDepth: 0.008,
    });
  }
  canvas.addMultiTap([
    { delay: 0.347, gain: 0.18 },
    { delay: 0.613, gain: 0.12 },
    { delay: 1.013, gain: 0.075 },
    { delay: 1.517, gain: 0.045 },
  ]);
}

export function buildTokyo3(canvas) {
  // 128 BPM、冷色 16 分音符琶音；低层噪声与上升低频代表装甲都市抬起。
  const step = 60 / 128 / 4;
  canvas.addPad([35, 42, 47, 54], 0.3, { brightness: 0.49, movement: 0.12, detunes: [-0.0012, 0.0014] });
  canvas.addLoopVoice({ frequency: midiToHz(23), amplitude: 0.062, wave: "triangle", lfoCycles: 2, lfoDepth: 0.44 });
  canvas.addPeriodicNoise({ amplitude: 0.018, color: "rumble", seed: "tokyo3-lift", lfoCycles: 1, lfoDepth: 0.5 });

  const arpPattern = [59, 66, 71, 74, 71, 66, 62, 66, 59, 66, 71, 78, 74, 71, 66, 62];
  for (let index = 0; index < Math.floor(canvas.duration / step); index += 1) {
    addBell(canvas, {
      start: index * step,
      frequency: midiToHz(arpPattern[index % arpPattern.length]),
      amplitude: 0.013 + (index % 4 === 0 ? 0.005 : 0),
      duration: 0.54,
      seed: `tokyo3-arp-${index}`,
    });
  }

  const pulseSteps = [0, 4, 8, 12, 16, 22, 24, 28, 32];
  pulseSteps.forEach((stepIndex, index) => {
    canvas.addPulse({
      start: stepIndex * step,
      frequency: 68,
      endFrequency: 34,
      amplitude: 0.08 + (index % 3) * 0.012,
      duration: 0.35,
      click: 0.004,
    });
  });

  for (let index = 0; index < 6; index += 1) {
    canvas.addTone({
      start: 0.65 + index * 2.2,
      duration: 2.1,
      frequency: 1046.5 * (1 + (index % 2) * 0.1225),
      amplitude: 0.0065,
      wave: "sine",
      attack: 0.35,
      release: 0.75,
      vibratoHz: 0.36,
      vibratoDepth: 0.004,
    });
  }
  canvas.addMultiTap([
    { delay: 0.117, gain: 0.12 },
    { delay: 0.234, gain: 0.082 },
    { delay: 0.469, gain: 0.048 },
  ]);
}

export function buildRecords(canvas) {
  // 老放映机颤动、磁带底噪与距离感钢琴，构成两个时代的胶片走廊。
  canvas.addPad([36, 43, 48, 55], 0.22, { brightness: 0.31, movement: 0.2, detunes: [-0.0022, 0.0021] });
  canvas.addLoopVoice({ frequency: 60, amplitude: 0.018, wave: "triangle", lfoCycles: 1, lfoDepth: 0.58 });
  canvas.addLoopVoice({ frequency: 180, amplitude: 0.006, wave: "sine", lfoCycles: 2, lfoDepth: 0.42 });
  canvas.addPeriodicNoise({ amplitude: 0.015, color: "tape", seed: "records-tape-hiss", lfoCycles: 4, lfoDepth: 0.34 });
  canvas.addPeriodicNoise({ amplitude: 0.008, color: "rumble", seed: "records-projector-room", lfoCycles: 7, lfoDepth: 0.7 });

  for (let index = 0; index < 42; index += 1) {
    canvas.addNoiseBurst({
      start: index * 0.333,
      duration: 0.018,
      amplitude: 0.006 + (index % 7 === 0 ? 0.004 : 0),
      attack: 0.0006,
      release: 0.008,
      color: "band",
      seed: `records-projector-${index}`,
    });
  }

  const melody = [
    { time: 1.15, note: 60 },
    { time: 2.65, note: 65 },
    { time: 4.2, note: 68 },
    { time: 5.75, note: 63 },
    { time: 7.35, note: 67 },
    { time: 8.9, note: 72 },
    { time: 10.55, note: 68 },
    { time: 12.15, note: 63 },
  ];
  melody.forEach((event, index) => {
    addPianoNote(canvas, { start: event.time, note: event.note, amplitude: 0.074, duration: 3.4 });
    if (index % 2 === 0) {
      addPianoNote(canvas, { start: event.time + 0.035, note: event.note - 12, amplitude: 0.028, duration: 3.8 });
    }
  });
  canvas.addCrackle({ count: 28, seed: "records-crackle", amplitude: 0.009, span: 14 });
  canvas.addMultiTap([
    { delay: 0.083, gain: 0.11 },
    { delay: 0.197, gain: 0.09 },
    { delay: 0.401, gain: 0.062 },
    { delay: 0.739, gain: 0.038 },
  ]);
}

export function buildRelease(canvas) {
  // D 大调开放和声逐步收束，低频呼吸与长延迟形成红色海面的余响。
  canvas.addPad([38, 45, 50, 54, 57], 0.35, { brightness: 0.66, movement: 0.22, detunes: [-0.001, 0.0013] });
  canvas.addLoopVoice({ frequency: midiToHz(26), amplitude: 0.05, wave: "sine", lfoCycles: 1, lfoDepth: 0.38 });
  canvas.addPeriodicNoise({ amplitude: 0.007, color: "air", seed: "release-air", lfoCycles: 2, lfoDepth: 0.48 });

  const progression = [
    { start: 0.3, duration: 4.7, notes: [50, 54, 57, 62, 66], amplitude: 0.027 },
    { start: 4.65, duration: 4.6, notes: [48, 55, 60, 64, 67], amplitude: 0.025 },
    { start: 9.0, duration: 3.8, notes: [45, 52, 57, 61, 64], amplitude: 0.027 },
    { start: 12.65, duration: 3.2, notes: [50, 54, 57, 62, 69], amplitude: 0.024 },
  ];
  for (const chord of progression) {
    for (const note of chord.notes) {
      canvas.addTone({
        start: chord.start,
        duration: chord.duration,
        frequency: midiToHz(note),
        amplitude: chord.amplitude,
        wave: "triangle",
        attack: 1.15,
        release: 1.4,
        vibratoHz: 0.085,
        vibratoDepth: 0.0016,
      });
    }
  }

  const shimmer = [74, 78, 81, 86, 81, 78, 76, 81];
  shimmer.forEach((note, index) => {
    addBell(canvas, {
      start: 1.4 + index * 1.72,
      frequency: midiToHz(note),
      amplitude: 0.0105,
      duration: 3.4,
      seed: `release-shimmer-${index}`,
    });
  });

  canvas.addPulse({ start: 11.85, frequency: 48, endFrequency: 30, amplitude: 0.055, duration: 0.75, click: 0 });
  canvas.addMultiTap([
    { delay: 0.421, gain: 0.19 },
    { delay: 0.739, gain: 0.135 },
    { delay: 1.173, gain: 0.088 },
    { delay: 1.721, gain: 0.054 },
    { delay: 2.293, gain: 0.031 },
  ]);
}
