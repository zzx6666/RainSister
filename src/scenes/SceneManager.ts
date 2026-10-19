import { SRGBColorSpace, WebGLRenderer } from "three";
import type { QualityTier, SceneId, SceneModule } from "./types";

export type { SceneId } from "./types";

type ModuleFactory = () => Promise<SceneModule>;

const factories: Record<SceneId, ModuleFactory> = {
  top: async () => new (await import("./ATFieldScene")).ATFieldScene(),
  children: async () => new (await import("./ChildrenScene")).ChildrenScene(),
  evangelion: async () => new (await import("./HangarScene")).HangarScene(),
  angels: async () => new (await import("./AngelScene")).AngelScene(),
  "tokyo-3": async () => new (await import("./TokyoScene")).TokyoScene(),
  records: async () => new (await import("./RecordsScene")).RecordsScene(),
  release: async () => new (await import("./ReleaseScene")).ReleaseScene(),
};

export class SceneManager {
  readonly renderer: WebGLRenderer;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private quality: QualityTier;
  private activeId: SceneId = "top";
  private activeModule?: SceneModule;
  private readonly progress = new Map<SceneId, number>();
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private frameHandle = 0;
  private startTime = performance.now();
  private frameCount = 0;
  private sampleStart = performance.now();
  private activationToken = 0;
  private fallback = false;
  private hiddenAt = 0;
  private resizeTimer = 0;
  private contextRecoveryTimer = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.quality = this.detectQuality();
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: false,
      antialias: this.quality === "high",
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setPixelRatio(this.targetPixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.canvas.dataset.quality = this.quality;
    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
    void this.activate("top");
    this.loop();
  }

  private detectQuality(): QualityTier {
    if (this.reducedMotion) return "low";
    const coarse = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    if (coarse || memory <= 4) return "low";
    if (window.innerWidth > 1500 && window.devicePixelRatio <= 2) return "high";
    return "medium";
  }

  private targetPixelRatio(): number {
    if (this.quality === "low") return 1;
    if (this.quality === "medium") return Math.min(1.25, window.devicePixelRatio || 1);
    return Math.min(1.5, window.devicePixelRatio || 1);
  }

  private context() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: this.targetPixelRatio(),
      quality: this.quality,
      reducedMotion: this.reducedMotion,
    };
  }

  async activate(id: SceneId): Promise<void> {
    if (this.fallback) return;
    if (this.activeId === id && this.activeModule?.kind === id) return;
    const token = ++this.activationToken;

    if (this.activeModule) {
      this.activeModule.deactivate();
      this.activeModule.dispose();
      this.activeModule = undefined;
    }
    this.activeId = id;
    document.documentElement.dataset.chapter = id;

    let module: SceneModule;
    try {
      module = await factories[id]();
    } catch {
      this.enterFallback();
      return;
    }

    if (token !== this.activationToken) {
      module.dispose();
      return;
    }

    try {
      module.mount(this.renderer, this.context());
      module.setProgress(this.progress.get(id) ?? 0);
      module.setPointer(this.pointerX, this.pointerY);
      module.setAudioLevel(this.audioLevel);
      module.activate();
      this.activeModule = module;
    } catch {
      module.dispose();
      this.enterFallback();
    }
  }

  setProgress(id: SceneId, value: number): void {
    this.progress.set(id, Math.min(1, Math.max(0, value)));
    if (id === this.activeId) this.activeModule?.setProgress(this.progress.get(id) ?? 0);
  }

  setPointer(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
    this.activeModule?.setPointer(x, y);
  }

  setAudioLevel(level: number): void {
    this.audioLevel = Math.min(1, Math.max(0, level));
    this.activeModule?.setAudioLevel(this.audioLevel);
  }

  getActiveModule<T extends SceneModule>(id: SceneId): T | undefined {
    if (this.activeId !== id || this.activeModule?.kind !== id) return undefined;
    return this.activeModule as T;
  }

  private handleResize = (): void => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.renderer.setPixelRatio(this.targetPixelRatio());
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.activeModule?.resize?.(this.context());
    }, 180);
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.hiddenAt = performance.now();
      cancelAnimationFrame(this.frameHandle);
      return;
    }
    if (this.hiddenAt > 0) this.startTime += performance.now() - this.hiddenAt;
    this.hiddenAt = 0;
    this.frameCount = 0;
    this.sampleStart = performance.now();
    this.loop();
  };

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    document.documentElement.classList.add("webgl-lost");
    cancelAnimationFrame(this.frameHandle);
    window.dispatchEvent(new CustomEvent("scene:context-lost"));
    window.clearTimeout(this.contextRecoveryTimer);
    this.contextRecoveryTimer = window.setTimeout(() => {
      if (document.documentElement.classList.contains("webgl-lost")) this.enterFallback();
    }, 3000);
  };

  private handleContextRestored = (): void => {
    window.clearTimeout(this.contextRecoveryTimer);
    document.documentElement.classList.remove("webgl-lost");
    if (this.activeModule) {
      this.activeModule.dispose();
      this.activeModule = undefined;
    }
    this.renderer.setPixelRatio(this.targetPixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.sampleStart = performance.now();
    this.frameCount = 0;
    void this.activate(this.activeId);
    this.loop();
  };

  private loop = (): void => {
    if (document.hidden) return;
    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;
    try {
      this.activeModule?.render(this.renderer, elapsed);
    } catch {
      this.enterFallback();
      return;
    }
    this.frameCount += 1;

    if (now - this.sampleStart >= 2000) {
      const fps = (this.frameCount * 1000) / (now - this.sampleStart);
      if (fps < 45 && this.quality !== "low") this.degradeQuality();
      this.frameCount = 0;
      this.sampleStart = now;
    }
    this.frameHandle = requestAnimationFrame(this.loop);
  };

  private degradeQuality(): void {
    this.quality = "low";
    this.canvas.dataset.quality = this.quality;
    this.renderer.setPixelRatio(1);
    const current = this.activeId;
    if (this.activeModule) {
      this.activeModule.dispose();
      this.activeModule = undefined;
      void this.activate(current);
    }
  }

  private enterFallback(): void {
    if (this.fallback) return;
    this.fallback = true;
    cancelAnimationFrame(this.frameHandle);
    this.activeModule?.deactivate();
    this.activeModule?.dispose();
    this.activeModule = undefined;
    document.documentElement.classList.add("no-webgl", "scene-fallback");
    this.canvas.hidden = true;
    window.dispatchEvent(new CustomEvent("scene:fallback"));
  }

  dispose(): void {
    cancelAnimationFrame(this.frameHandle);
    window.clearTimeout(this.resizeTimer);
    window.clearTimeout(this.contextRecoveryTimer);
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.activeModule?.dispose();
    this.activeModule = undefined;
    this.renderer.dispose();
  }
}
