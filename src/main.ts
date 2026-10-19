import "./noto-serif-jp.css";
import "./styles.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SceneBGM } from "./bgm";
import { angels, eras, machines } from "./data";
import type { SceneManager } from "./scenes/SceneManager";
import type { AngelScene } from "./scenes/AngelScene";
import type { HangarScene } from "./scenes/HangarScene";
import type { RecordsScene } from "./scenes/RecordsScene";
import type { ReleaseScene } from "./scenes/ReleaseScene";
import type { SceneId, SceneModule } from "./scenes/types";
import { renderAngelPanel, renderEraPanel, renderMachinePanel, renderSite } from "./ui";

gsap.registerPlugin(ScrollTrigger);

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("缺少页面挂载节点");
app.innerHTML = renderSite();

const root = document.documentElement;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motionQuery.matches;
const canvas = document.querySelector<HTMLCanvasElement>("#scene-canvas");
const liveStatus = document.querySelector<HTMLElement>("[data-live-status]");
const bgm = new SceneBGM();
let sceneManager: SceneManager | undefined;
let sceneRequest = 0;

if (!canvas || reducedMotion) {
  root.classList.add("reduced-motion", "no-webgl");
  if (canvas) canvas.hidden = true;
}

const loadScene = async (): Promise<SceneManager | undefined> => {
  if (!canvas || reducedMotion || root.classList.contains("scene-fallback")) return undefined;
  if (sceneManager) return sceneManager;
  const request = ++sceneRequest;
  try {
    const { SceneManager: SceneManagerClass } = await import("./scenes/SceneManager");
    const manager = new SceneManagerClass(canvas);
    if (request !== sceneRequest || reducedMotion) {
      manager.dispose();
      return undefined;
    }
    sceneManager = manager;
    return manager;
  } catch {
    window.dispatchEvent(new CustomEvent("scene:fallback"));
    return undefined;
  }
};

let sceneReady: Promise<SceneManager | undefined> = loadScene();

window.addEventListener("scene:fallback", () => {
  root.classList.add("no-webgl");
  if (canvas) canvas.hidden = true;
  announce("3D 场景暂不可用，已切换到可读档案模式");
});

window.addEventListener("scene:context-lost", () => {
  announce("WebGL 图形上下文暂时中断，正在尝试恢复");
});

function announce(message: string): void {
  if (liveStatus) liveStatus.textContent = message;
}

async function activateSceneModule<T extends SceneModule>(id: SceneId): Promise<T | undefined> {
  void bgm.setChapter(id).then((playing) => updateSoundUi(playing));
  root.dataset.chapter = id;
  const manager = await sceneReady;
  if (!manager) return undefined;
  await manager.activate(id);
  return manager.getActiveModule<T>(id);
}

function formatClock(): void {
  const clock = document.querySelector<HTMLElement>("[data-clock]");
  if (!clock) return;
  const now = new Date();
  clock.textContent = `T+${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

formatClock();
window.setInterval(formatClock, 1000);

const syncValue = document.querySelector<HTMLElement>("[data-sync-value]");
const syncBar = document.querySelector<HTMLElement>("[data-sync-bar]");
const railProgress = document.querySelector<HTMLElement>("[data-rail-progress]");

function updatePageProgress(): void {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  if (syncValue) syncValue.textContent = (progress * 100).toFixed(2).padStart(6, "0");
  if (syncBar) syncBar.style.width = `${progress * 100}%`;
  if (railProgress) railProgress.style.transform = `scaleY(${progress})`;
}

window.addEventListener("scroll", updatePageProgress, { passive: true });
window.addEventListener("resize", updatePageProgress);
updatePageProgress();

const sections = [...document.querySelectorAll<HTMLElement>(".scene-section[data-scene]")];
sections.forEach((section) => {
  const id = section.dataset.scene as SceneId;
  ScrollTrigger.create({
    trigger: section,
    start: "top 78%",
    end: "bottom 22%",
    onToggle: (self) => {
      if (self.isActive) void activateSceneModule(id);
    },
  });
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => sceneManager?.setProgress(id, self.progress),
  });
});

function syncActiveSceneToViewport(): void {
  const midline = window.innerHeight * 0.48;
  const activeSection = sections.find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= midline && bounds.bottom > midline;
  });
  if (!activeSection) return;
  const id = activeSection.dataset.scene as SceneId;
  const bounds = activeSection.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (midline - bounds.top) / Math.max(1, bounds.height)));
  void sceneReady.then(async (manager) => {
    await activateSceneModule(id);
    if (!manager) return;
    manager.setProgress(id, progress);
  });
  chapterLinks.forEach((link) => {
    const active = link.dataset.chapterLink === id;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

window.addEventListener("hashchange", () => window.setTimeout(syncActiveSceneToViewport, 240));
window.addEventListener("pageshow", () => window.setTimeout(syncActiveSceneToViewport, 0));

motionQuery.addEventListener("change", (event) => {
  reducedMotion = event.matches;
  root.classList.toggle("reduced-motion", reducedMotion);
  if (reducedMotion) {
    ++sceneRequest;
    root.classList.add("no-webgl");
    if (canvas) canvas.hidden = true;
    sceneManager?.dispose();
    sceneManager = undefined;
    sceneReady = Promise.resolve(undefined);
  } else if (canvas && !root.classList.contains("scene-fallback")) {
    root.classList.remove("no-webgl");
    canvas.hidden = false;
    sceneReady = loadScene();
    void sceneReady.then(() => syncActiveSceneToViewport());
  }
  ScrollTrigger.refresh();
});

const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-chapter-link]")];
sections.forEach((section) => {
  const id = section.id;
  ScrollTrigger.create({
    trigger: section,
    start: "top 45%",
    end: "bottom 45%",
    onToggle: (self) => {
      if (!self.isActive) return;
      chapterLinks.forEach((link) => {
        const active = link.dataset.chapterLink === id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
  });
});

window.addEventListener(
  "pointermove",
  (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    sceneManager?.setPointer(x, y);
  },
  { passive: true },
);

window.setInterval(() => sceneManager?.setAudioLevel(bgm.level()), 55);

const soundToggle = document.querySelector<HTMLButtonElement>("[data-sound-toggle]");
const audioState = document.querySelector<HTMLElement>("[data-audio-state]");
const trackStatus = document.querySelector<HTMLElement>("[data-track-status]");
let soundRequestId = 0;

function updateSoundUi(playing: boolean): void {
  soundToggle?.setAttribute("aria-pressed", String(playing));
  if (soundToggle) {
    const label = soundToggle.querySelector("span");
    if (label) label.textContent = playing ? "BGM ON" : "BGM OFF";
  }
  if (audioState) audioState.textContent = playing ? `BGM / ${bgm.currentTitle}` : "BGM / STANDBY";
  if (trackStatus) trackStatus.textContent = playing ? `BGM / ${bgm.currentTitle}` : "BGM / STANDBY";
  root.classList.toggle("sound-is-on", playing);
}

bgm.onStateChange = (enabled) => {
  updateSoundUi(enabled);
  if (!enabled) announce("背景音乐已停止");
};

async function setAmbient(next: boolean): Promise<boolean> {
  const requestId = ++soundRequestId;
  const playing = await bgm.setEnabled(next);
  if (requestId !== soundRequestId) return playing;
  updateSoundUi(playing);
  if (playing && activeVoiceButton) bgm.duck(true);
  if (next && !playing) announce("浏览器未允许背景音乐播放，请再次点击 BGM 开关");
  else announce(playing ? `背景音乐已开启：${bgm.currentTitle}` : "背景音乐已关闭");
  return playing;
}

soundToggle?.addEventListener("click", () => {
  void setAmbient(!bgm.isEnabled);
});

document.querySelector<HTMLButtonElement>("[data-start-sync]")?.addEventListener("click", async () => {
  await setAmbient(true);
  document.querySelector("#children")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
});

document.querySelector<HTMLButtonElement>("[data-silent-browse]")?.addEventListener("click", () => {
  if (bgm.isPlaying) void setAmbient(false);
  document.querySelector("#children")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
});

const voiceAudio = document.querySelector<HTMLAudioElement>("[data-voice-audio]");
let activeVoiceButton: HTMLButtonElement | null = null;
let switchingVoice = false;
let voiceRequestId = 0;

function resetVoice(button: HTMLButtonElement | null = activeVoiceButton): void {
  if (!button) return;
  const name = button.dataset.voiceName ?? "角色";
  button.classList.remove("is-playing");
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", `播放${name}的日语合成台词`);
  const label = button.querySelector<HTMLElement>(".voice-button__label");
  if (label) label.textContent = "合成朗读";
}

function finishVoice(): void {
  resetVoice(activeVoiceButton);
  activeVoiceButton = null;
  bgm.duck(false);
}

document.querySelectorAll<HTMLButtonElement>(".voice-button").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!voiceAudio) return;
    const source = button.dataset.audio;
    const name = button.dataset.voiceName ?? "角色";
    if (!source) return;
    if (activeVoiceButton === button && !voiceAudio.paused) {
      voiceRequestId += 1;
      voiceAudio.pause();
      finishVoice();
      return;
    }

    const requestId = ++voiceRequestId;
    switchingVoice = true;
    if (activeVoiceButton && activeVoiceButton !== button) voiceAudio.pause();
    resetVoice(activeVoiceButton);
    activeVoiceButton = button;
    voiceAudio.src = source;
    button.classList.add("is-playing");
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", `暂停${name}的日语合成台词`);
    const label = button.querySelector<HTMLElement>(".voice-button__label");
    if (label) label.textContent = "暂停合成";
    bgm.duck(true);
    try {
      await voiceAudio.play();
      if (requestId !== voiceRequestId) return;
      announce(`${name}的日语合成台词开始播放`);
    } catch {
      if (requestId !== voiceRequestId) return;
      finishVoice();
      announce(`${name}的音频无法播放，请检查浏览器声音权限`);
    } finally {
      if (requestId === voiceRequestId) {
        window.setTimeout(() => {
          if (requestId === voiceRequestId) switchingVoice = false;
        }, 0);
      }
    }
  });
});

voiceAudio?.addEventListener("ended", () => {
  voiceRequestId += 1;
  finishVoice();
});

voiceAudio?.addEventListener("error", () => {
  if (!activeVoiceButton) return;
  const name = activeVoiceButton.dataset.voiceName ?? "角色";
  voiceRequestId += 1;
  finishVoice();
  announce(`${name}的音频加载失败`);
});

voiceAudio?.addEventListener("pause", () => {
  if (switchingVoice || !activeVoiceButton || voiceAudio.ended) return;
  voiceRequestId += 1;
  finishVoice();
});

document.querySelectorAll<HTMLButtonElement>(".continuity-card").forEach((card) => {
  let startX = 0;
  let dragging = false;

  card.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX = event.clientX;
    dragging = true;
    card.classList.add("is-dragging");
    card.setPointerCapture?.(event.pointerId);
  });

  card.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const angle = Math.max(-18, Math.min(18, (event.clientX - startX) / 5));
    card.style.setProperty("--drag-angle", `${angle}deg`);
  });

  const endDrag = () => {
    dragging = false;
    card.classList.remove("is-dragging");
    card.style.removeProperty("--drag-angle");
  };
  card.addEventListener("pointerup", endDrag);
  card.addEventListener("pointercancel", endDrag);
  card.addEventListener("pointerleave", endDrag);

  card.addEventListener("click", () => {
    const flipped = card.getAttribute("aria-pressed") !== "true";
    card.setAttribute("aria-pressed", String(flipped));
    card.classList.toggle("is-rebuild", flipped);
  });
});

const machineMount = document.querySelector<HTMLElement>("[data-machine-mount]");
const machineButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-machine]")];
machineButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const index = Number(button.dataset.machine ?? 1);
    const machine = machines[index];
    if (!machine || !machineMount) return;
    machineButtons.forEach((item) => {
      item.setAttribute("aria-selected", String(item === button));
      item.tabIndex = item === button ? 0 : -1;
    });
    machineMount.setAttribute("aria-labelledby", button.id);
    machineMount.innerHTML = renderMachinePanel(index);
    const scene = await activateSceneModule<HangarScene>("evangelion");
    scene?.setActiveMachine(index);
    announce(`已切换到 ${machine.name}`);
    if (!reducedMotion) {
      gsap.fromTo(machineMount.firstElementChild, { opacity: 0.25, x: 24 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" });
    }
  });
});

const angelMount = document.querySelector<HTMLElement>("[data-angel-mount]");
const angelButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-angel]")];
const angelSection = document.querySelector<HTMLElement>("#angels");
let activeAngel = 0;
let fieldNeutralized = false;

function resetField(): void {
  fieldNeutralized = false;
  angelSection?.classList.remove("is-neutralized");
  const button = document.querySelector<HTMLButtonElement>("[data-neutralize]");
  if (button) {
    button.querySelector("span")!.textContent = "中和 AT 力场";
    button.setAttribute("aria-pressed", "false");
  }
  const readout = document.querySelector<HTMLElement>("[data-field-readout]");
  if (readout) readout.textContent = "PATTERN: ORANGE / BOUNDARY: 100%";
}

async function neutralizeField(): Promise<void> {
  if (!angelSection || fieldNeutralized) return;
  const scene = await activateSceneModule<AngelScene>("angels");
  if (!scene) return;
  fieldNeutralized = true;
  scene.neutralize();
  angelSection.classList.add("is-neutralized");
  const button = document.querySelector<HTMLButtonElement>("[data-neutralize]");
  if (button) {
    button.querySelector("span")!.textContent = "重新聚合 AT 力场";
    button.setAttribute("aria-pressed", "true");
  }
  const readout = document.querySelector<HTMLElement>("[data-field-readout]");
  if (readout) readout.textContent = "BOUNDARY: 000% / ARCHIVE EXPOSED";
  const status = document.querySelector<HTMLElement>("[data-angel-status]");
  if (status) status.textContent = "AT FIELD / NEUTRALIZED";
  announce(`${angels[activeAngel]?.name ?? "使徒"}的 AT 力场已中和`);
}

async function reaggregateField(): Promise<void> {
  const scene = await activateSceneModule<AngelScene>("angels");
  scene?.setAngel(activeAngel);
  resetField();
  announce("AT 力场已重新聚合");
}

angelButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const index = Number(button.dataset.angel ?? 0);
    const angel = angels[index];
    if (!angel || !angelMount) return;
    activeAngel = index;
    angelButtons.forEach((item) => {
      item.setAttribute("aria-selected", String(item === button));
      item.tabIndex = item === button ? 0 : -1;
    });
    if (angelMount) angelMount.setAttribute("aria-labelledby", button.id);
    angelMount.innerHTML = renderAngelPanel(index);
    resetField();
    const scene = await activateSceneModule<AngelScene>("angels");
    scene?.setAngel(index);
    announce(`已选择 ${angel.name}`);
  });
});

document.querySelector<HTMLButtonElement>("[data-neutralize]")?.addEventListener("click", () => {
  if (fieldNeutralized) void reaggregateField();
  else void neutralizeField();
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof Element ? event.target : undefined;
  if (event.key !== "Enter" || target?.closest("button, a, input, textarea, select, summary, [contenteditable='true'], [role='tab']")) return;
  const rect = angelSection?.getBoundingClientRect();
  if (rect && rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4) {
    event.preventDefault();
    void neutralizeField();
  }
});

ScrollTrigger.create({
  trigger: "#tokyo-3",
  start: "top bottom",
  end: "bottom top",
  onUpdate: (self) => {
    const value = Math.round(self.progress * 1000) / 10;
    const readout = document.querySelector<HTMLElement>("[data-tokyo-value]");
    const bar = document.querySelector<HTMLElement>("[data-tokyo-bar]");
    if (readout) readout.textContent = value.toFixed(1).padStart(4, "0");
    if (bar) bar.style.height = `${self.progress * 100}%`;
  },
});

const eraMount = document.querySelector<HTMLElement>("[data-era-mount]");
const eraButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-era]")];
eraButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const eraIndex = eras.findIndex((item) => item.id === button.dataset.era);
    const era = eras[eraIndex];
    if (!era || !eraMount) return;
    eraButtons.forEach((item) => {
      item.setAttribute("aria-selected", String(item === button));
      item.tabIndex = item === button ? 0 : -1;
    });
    eraMount.setAttribute("aria-labelledby", button.id);
    eraMount.innerHTML = renderEraPanel(era);
    const scene = await activateSceneModule<RecordsScene>("records");
    scene?.focusEra(eraIndex);
    announce(`已切换到 ${era.year} ${era.titleZh}`);
    if (!reducedMotion) {
      gsap.fromTo(eraMount.firstElementChild, { opacity: 0.15, clipPath: "inset(0 0 0 100%)" }, { opacity: 1, clipPath: "inset(0 0 0 0)", duration: 0.65, ease: "power3.out" });
    }
  });
});

document.querySelectorAll<HTMLElement>('[role="tablist"]').forEach((tabList) => {
  tabList.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const tabs = [...tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    if (!tabs.length) return;
    const current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"));
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? (current - 1 + tabs.length) % tabs.length
            : (current + 1) % tabs.length;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
});

const trailerDialog = document.querySelector<HTMLDialogElement>("[data-trailer-dialog]");
const trailerFrame = document.querySelector<HTMLElement>("[data-trailer-frame]");
const trailerTitle = document.querySelector<HTMLElement>("#trailer-title");
const trailerExternal = document.querySelector<HTMLAnchorElement>("[data-trailer-external]");

function closeTrailer(): void {
  trailerDialog?.close();
}

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const trigger = target.closest<HTMLButtonElement>("[data-trailer]");
  if (trigger) {
    const videoId = trigger.dataset.trailer;
    if (!videoId || !trailerDialog || !trailerFrame) return;
    voiceRequestId += 1;
    voiceAudio?.pause();
    finishVoice();
    if (trailerTitle) trailerTitle.textContent = `${trigger.dataset.trailerTitle ?? "官方"}预告`;
    if (trailerExternal) {
      trailerExternal.href = `https://www.youtube.com/watch?v=${videoId}`;
      trailerExternal.textContent = "在 YouTube 打开";
    }
    trailerFrame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" title="官方预告" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    bgm.suspend("external");
    trailerDialog.showModal();
  }
  if (target.closest("[data-close-trailer]")) closeTrailer();
});

trailerDialog?.addEventListener("click", (event) => {
  if (event.target === trailerDialog) closeTrailer();
});
trailerDialog?.addEventListener("cancel", () => {
  if (trailerFrame) trailerFrame.innerHTML = "";
  bgm.resume("external");
});
trailerDialog?.addEventListener("close", () => {
  if (trailerFrame) trailerFrame.innerHTML = "";
  bgm.resume("external");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) bgm.suspend("visibility");
  else bgm.resume("visibility");
});

document.querySelector<HTMLButtonElement>("[data-release-field]")?.addEventListener("click", () => {
  void activateSceneModule<ReleaseScene>("release").then((scene) => scene?.release());
  document.querySelector("#release-end")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  announce("AT 力场解除，进入终幕");
});

if (!reducedMotion) {
  const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  heroTimeline
    .from(".hero__jp", { yPercent: 18, opacity: 0, duration: 1.15 })
    .from(".hero__cn", { scaleX: 0.82, transformOrigin: "left center", opacity: 0, duration: 0.9 }, "-=0.72")
    .from(".hero__dek, .hero__actions, .hero__telemetry", { y: 28, opacity: 0, stagger: 0.09, duration: 0.72 }, "-=0.52")
    .from(".hud, .chapter-rail", { y: -12, opacity: 0, duration: 0.6 }, "-=0.8");

  gsap.utils.toArray<HTMLElement>(".roster--nerv .character").forEach((card) => {
    gsap.from(card, {
      y: 56,
      opacity: 0,
      duration: 0.82,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 86%", once: true },
    });
  });

  gsap.utils.toArray<HTMLElement>(".roster--seele .character").forEach((card, index) => {
    gsap.from(card, {
      x: index % 2 === 0 ? -56 : 56,
      opacity: 0,
      filter: "blur(8px)",
      duration: 0.6,
      ease: "steps(5)",
      scrollTrigger: { trigger: card, start: "top 86%", once: true },
    });
  });

  gsap.from(".chapter-heading", {
    opacity: 0,
    y: 35,
    stagger: 0.06,
    duration: 0.7,
    ease: "power2.out",
    scrollTrigger: { trigger: "#children", start: "top 78%", once: true },
  });
}

root.classList.add("is-ready");
requestAnimationFrame(() => {
  ScrollTrigger.refresh();
  syncActiveSceneToViewport();
});
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  syncActiveSceneToViewport();
});
void document.fonts?.ready.then(() => {
  ScrollTrigger.refresh();
  syncActiveSceneToViewport();
});

window.addEventListener("beforeunload", () => {
  bgm.stop();
  sceneManager?.dispose();
});
