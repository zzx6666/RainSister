document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const localTime = document.querySelector("#localTime");
const syncValue = document.querySelector("#syncValue");
const syncBar = document.querySelector("#syncBar");

function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function tickClock() {
  if (!localTime) return;
  const now = new Date();
  localTime.textContent = `T+${formatClock(now)}`;
  localTime.setAttribute("datetime", now.toISOString());
}

tickClock();
window.setInterval(tickClock, 1000);

let syncFrame = 0;

function updateSync() {
  syncFrame = 0;
  if (!syncValue || !syncBar) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  const value = progress * 100;

  syncValue.textContent = value.toFixed(2).padStart(6, "0");
  syncBar.style.width = `${value}%`;
}

function queueSync() {
  if (syncFrame) return;
  syncFrame = window.requestAnimationFrame(updateSync);
}

updateSync();
window.addEventListener("scroll", queueSync, { passive: true });
window.addEventListener("resize", queueSync);

// Subtle parallax on the lineup keeps the hero from feeling like a flat plate.
const hero = document.querySelector(".hero");
const lineup = document.querySelector(".hero__lineup");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

if (hero && lineup && finePointer.matches && !reducedMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    lineup.style.setProperty("--px", x.toFixed(2));
    lineup.style.setProperty("--py", y.toFixed(2));
  });

  hero.addEventListener("pointerleave", () => {
    lineup.style.setProperty("--px", "0");
    lineup.style.setProperty("--py", "0");
  });
}

// Reveal each roster once; the hidden state is only applied after JS is available.
const rosters = [...document.querySelectorAll(".roster")];

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const rosterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-live");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  rosters.forEach((roster) => rosterObserver.observe(roster));
} else {
  rosters.forEach((roster) => roster.classList.add("is-live"));
}

// Keep the navigation in sync with the current dossier chapter.
const navLinks = [...document.querySelectorAll(".topbar__nav a")];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && navSections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );

  navSections.forEach((section) => navObserver.observe(section));
}

// Shared Japanese voice player.
const voiceAudio = document.querySelector("#voiceAudio");
const voiceButtons = [...document.querySelectorAll(".voice__button")];
const voiceStatus = document.querySelector("#voiceStatus");
let activeVoiceButton = null;

function resetVoiceButton(button) {
  if (!button) return;
  const label = button.dataset.voiceLabel || "角色";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `播放${label}日语台词`);
}

function resetVoices() {
  voiceButtons.forEach(resetVoiceButton);
  activeVoiceButton = null;
}

voiceButtons.forEach((button) => {
  const label = button.dataset.voiceLabel || "角色";
  resetVoiceButton(button);

  button.addEventListener("click", async () => {
    const source = button.dataset.audio;
    if (!source || !voiceAudio) return;

    if (activeVoiceButton === button && !voiceAudio.paused) {
      voiceAudio.pause();
      return;
    }

    voiceAudio.pause();
    resetVoices();

    if (ambientAudio && !ambientAudio.paused) ambientAudio.pause();

    if (voiceAudio.getAttribute("src") !== source) {
      voiceAudio.setAttribute("src", source);
      voiceAudio.load();
    }

    activeVoiceButton = button;
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", `暂停${label}日语台词`);
    if (voiceStatus) voiceStatus.textContent = `正在播放${label}的日语台词。`;

    try {
      await voiceAudio.play();
    } catch {
      resetVoices();
      if (voiceStatus) voiceStatus.textContent = "语音播放失败，请检查浏览器是否允许播放音频。";
    }
  });
});

if (voiceAudio) {
  voiceAudio.addEventListener("pause", () => {
    if (!activeVoiceButton) return;
    resetVoiceButton(activeVoiceButton);
    activeVoiceButton = null;
  });

  voiceAudio.addEventListener("ended", () => {
    if (voiceStatus) voiceStatus.textContent = "日语台词播放结束。";
  });

  voiceAudio.addEventListener("error", () => {
    resetVoices();
    if (voiceStatus) voiceStatus.textContent = "无法读取该角色语音文件。";
  });
}

// Ambient room tone and waveform.
const ambientAudio = document.querySelector("#ambientAudio");
const ambientToggle = document.querySelector("#ambientToggle");
const soundToggle = document.querySelector("#soundToggle");
const soundState = document.querySelector("#soundState");
const ambientTime = document.querySelector("#ambientTime");
const waveform = document.querySelector("#waveform");
let ambientDuration = 18;

function makeBars(container, count, seed) {
  if (!container) return [];
  const bars = [];
  let state = seed;

  for (let index = 0; index < count; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const random = state / 0xffffffff;
    const envelope = 0.2 + Math.sin((index / count) * Math.PI) * 0.72;
    const height = 10 + random * 42 * envelope + Math.sin(index * 0.8) * 7;
    const bar = document.createElement("span");
    bar.style.height = `${Math.max(5, Math.min(100, height))}%`;
    container.append(bar);
    bars.push(bar);
  }

  return bars;
}

const waveBars = makeBars(waveform, 70, 29);

function formatDuration(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function setAmbientUi(isPlaying) {
  const label = isPlaying ? "暂停 LCL 环境声" : "播放 LCL 环境声";
  [ambientToggle, soundToggle].forEach((button) => {
    if (!button) return;
    button.setAttribute("aria-pressed", String(isPlaying));
    button.setAttribute("aria-label", label);
  });
  if (soundState) soundState.textContent = isPlaying ? "SOUND ON" : "SOUND OFF";
  if (ambientToggle) {
    const labelNode = ambientToggle.querySelector("span");
    if (labelNode) labelNode.textContent = isPlaying ? "PAUSE" : "PLAY";
  }
}

function updateAmbientProgress() {
  if (!waveform) return;
  const current = ambientAudio ? ambientAudio.currentTime : 0;
  const ratio = ambientDuration > 0 ? current / ambientDuration : 0;
  const playedCount = Math.round(waveBars.length * Math.min(1, Math.max(0, ratio)));

  if (ambientTime) {
    ambientTime.textContent = `${formatDuration(current)} / ${formatDuration(ambientDuration)}`;
  }

  waveform.setAttribute("aria-valuenow", String(Math.round(current)));
  waveBars.forEach((bar, index) => {
    bar.classList.toggle("is-played", index < playedCount);
  });
}

async function toggleAmbient() {
  if (!ambientAudio) return;

  if (ambientAudio.paused) {
    if (voiceAudio && !voiceAudio.paused) voiceAudio.pause();
    try {
      await ambientAudio.play();
    } catch {
      setAmbientUi(false);
    }
  } else {
    ambientAudio.pause();
  }
}

if (ambientAudio) {
  ambientAudio.volume = 0.32;
  ambientAudio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(ambientAudio.duration) && ambientAudio.duration > 0) {
      ambientDuration = ambientAudio.duration;
    }
    waveform?.setAttribute("aria-valuemax", String(Math.round(ambientDuration)));
    updateAmbientProgress();
  });
  ambientAudio.addEventListener("play", () => setAmbientUi(true));
  ambientAudio.addEventListener("pause", () => setAmbientUi(false));
  ambientAudio.addEventListener("timeupdate", updateAmbientProgress);
}

ambientToggle?.addEventListener("click", toggleAmbient);
soundToggle?.addEventListener("click", toggleAmbient);

function seekAmbient(ratio) {
  if (!ambientAudio) return;
  ambientAudio.currentTime = Math.min(1, Math.max(0, ratio)) * ambientDuration;
  updateAmbientProgress();
}

waveform?.addEventListener("click", (event) => {
  const bounds = waveform.getBoundingClientRect();
  seekAmbient((event.clientX - bounds.left) / bounds.width);
});

waveform?.addEventListener("keydown", (event) => {
  if (!ambientAudio) return;

  if (event.code === "Space") {
    event.preventDefault();
    toggleAmbient();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    seekAmbient((ambientAudio.currentTime + 2) / ambientDuration);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    seekAmbient((ambientAudio.currentTime - 2) / ambientDuration);
  } else if (event.key === "Home") {
    event.preventDefault();
    seekAmbient(0);
  } else if (event.key === "End") {
    event.preventDefault();
    seekAmbient(1);
  }
});

// MAGI visual record: muted autoplay when visible, explicit play/pause otherwise.
const recordVideo = document.querySelector("#recordVideo");
const recordFrame = document.querySelector(".record__frame");
const videoToggle = document.querySelector("#videoToggle");
const videoToggleLine = document.querySelector("#videoToggleLine");
const videoSeek = document.querySelector("#videoSeek");
const videoTime = document.querySelector("#videoTime");
let userPausedVideo = false;

function setVideoUi(isPlaying) {
  const label = isPlaying ? "暂停雨夜记录" : "播放雨夜记录";
  [videoToggle, videoToggleLine].forEach((button) => {
    if (!button) return;
    button.setAttribute("aria-pressed", String(isPlaying));
    button.setAttribute("aria-label", label);
  });
  const lineLabel = videoToggleLine?.querySelector("span");
  if (lineLabel) lineLabel.textContent = isPlaying ? "PAUSE" : "PLAY";
  recordFrame?.classList.toggle("is-playing", isPlaying);
}

function updateVideoProgress() {
  if (!recordVideo || !Number.isFinite(recordVideo.duration) || recordVideo.duration <= 0) return;
  const progress = (recordVideo.currentTime / recordVideo.duration) * 100;
  if (videoSeek) videoSeek.value = String(progress);
  if (videoTime) {
    videoTime.textContent = `${formatDuration(recordVideo.currentTime)} / ${formatDuration(recordVideo.duration)}`;
  }
}

videoToggle?.addEventListener("click", async () => {
  if (!recordVideo) return;
  if (recordVideo.paused) {
    userPausedVideo = false;
    try {
      await recordVideo.play();
    } catch {
      setVideoUi(false);
    }
  } else {
    userPausedVideo = true;
    recordVideo.pause();
  }
});

videoToggleLine?.addEventListener("click", async () => {
  if (!recordVideo) return;
  if (recordVideo.paused) {
    userPausedVideo = false;
    try {
      await recordVideo.play();
    } catch {
      setVideoUi(false);
    }
  } else {
    userPausedVideo = true;
    recordVideo.pause();
  }
});

if (recordVideo) {
  recordVideo.addEventListener("loadedmetadata", updateVideoProgress);
  recordVideo.addEventListener("timeupdate", updateVideoProgress);
  recordVideo.addEventListener("play", () => setVideoUi(true));
  recordVideo.addEventListener("pause", () => setVideoUi(false));
}

videoSeek?.addEventListener("input", () => {
  if (!recordVideo || !Number.isFinite(recordVideo.duration) || recordVideo.duration <= 0) return;
  recordVideo.currentTime = (Number(videoSeek.value) / 100) * recordVideo.duration;
  updateVideoProgress();
});

if (recordVideo && !reducedMotion.matches && "IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !userPausedVideo) {
          recordVideo.play().catch(() => {});
        } else if (!entry.isIntersecting) {
          recordVideo.pause();
        }
      });
    },
    { threshold: 0.35 }
  );
  videoObserver.observe(recordVideo);
}
