import { asset } from "./data";
import type { SceneId } from "./scenes/types";

const tracks: Record<SceneId, { src: string; title: string }> = {
  top: { src: asset("audio/bgm/01-initialize.wav"), title: "初始化脉冲" },
  children: { src: asset("audio/bgm/02-children.wav"), title: "适格者心跳" },
  evangelion: { src: asset("audio/bgm/03-evangelion.wav"), title: "机库机械拍" },
  angels: { src: asset("audio/bgm/04-angels.wav"), title: "使徒不协和场" },
  "tokyo-3": { src: asset("audio/bgm/05-tokyo-3.wav"), title: "第三新东京市上升" },
  records: { src: asset("audio/bgm/06-records.wav"), title: "年代胶片回声" },
  release: { src: asset("audio/bgm/07-release.wav"), title: "心之壁解除" },
};

const normalVolume = 0.38;
const duckedVolume = 0.1;

export class SceneBGM {
  private readonly players = new Map<SceneId, HTMLAudioElement>();
  private readonly fadeFrames = new Map<HTMLAudioElement, number>();
  private current?: HTMLAudioElement;
  private currentId: SceneId = "top";
  private enabled = false;
  private ducked = false;
  private transitionToken = 0;
  private readonly suspendReasons = new Set<"external" | "visibility">();
  private wasEnabledBeforeSuspend = false;
  onStateChange?: (enabled: boolean) => void;

  get isEnabled(): boolean {
    return this.enabled;
  }

  get isPlaying(): boolean {
    return this.enabled && Boolean(this.current && !this.current.paused);
  }

  get currentTitle(): string {
    return tracks[this.currentId].title;
  }

  async setEnabled(next: boolean): Promise<boolean> {
    if (!next) {
      this.suspendReasons.clear();
      this.wasEnabledBeforeSuspend = false;
      this.enabled = false;
      this.transitionToken += 1;
      this.fadeAllAndPause(360, true);
      return false;
    }

    const token = ++this.transitionToken;
    this.enabled = true;
    const audio = this.ensurePlayer(this.currentId);
    if (audio === this.current && !audio.paused) {
      this.fadeOutOthers(audio, 260);
      this.fadeAudio(audio, this.targetVolume(), 260);
      return true;
    }

    audio.volume = 0;
    try {
      await audio.play();
    } catch {
      if (token === this.transitionToken) this.failAndSilence();
      return this.enabled;
    }
    if (token !== this.transitionToken || !this.enabled) {
      audio.pause();
      return this.enabled;
    }

    this.current = audio;
    this.fadeOutOthers(audio, 620);
    this.fadeAudio(audio, this.targetVolume(), 620);
    return true;
  }

  async setChapter(id: SceneId): Promise<boolean> {
    this.currentId = id;
    if (!this.enabled) return false;

    const token = ++this.transitionToken;
    const next = this.ensurePlayer(id);
    if (next === this.current && !next.paused) {
      this.fadeOutOthers(next, 300);
      this.fadeAudio(next, this.targetVolume(), 300);
      return true;
    }

    next.volume = 0;
    try {
      await next.play();
    } catch {
      if (token === this.transitionToken) this.failAndSilence();
      return this.enabled;
    }
    if (token !== this.transitionToken || !this.enabled) {
      next.pause();
      return this.enabled;
    }

    this.current = next;
    this.fadeOutOthers(next, 760);
    this.fadeAudio(next, this.targetVolume(), 760);
    return true;
  }

  duck(active: boolean): void {
    this.ducked = active;
    if (!this.current || !this.enabled) return;
    this.fadeAudio(this.current, this.targetVolume(), 300);
  }

  suspend(reason: "external" | "visibility" = "external"): void {
    if (!this.enabled && !this.wasEnabledBeforeSuspend) return;
    this.suspendReasons.add(reason);
    if (!this.enabled) return;
    this.wasEnabledBeforeSuspend = true;
    this.enabled = false;
    this.transitionToken += 1;
    this.fadeAllAndPause(360, false);
    this.onStateChange?.(false);
  }

  resume(reason: "external" | "visibility" = "external"): void {
    this.suspendReasons.delete(reason);
    if (this.suspendReasons.size || !this.wasEnabledBeforeSuspend) return;
    this.wasEnabledBeforeSuspend = false;
    void this.setEnabled(true).then((playing) => this.onStateChange?.(playing));
  }

  level(): number {
    if (!this.enabled || !this.current || this.current.paused) return 0;
    const time = this.current.currentTime + performance.now() / 1000;
    const chapterPulse: Record<SceneId, number> = {
      top: 0.18,
      children: 0.24,
      evangelion: 0.4,
      angels: 0.13,
      "tokyo-3": 0.34,
      records: 0.16,
      release: 0.22,
    };
    return Math.min(
      1,
      chapterPulse[this.currentId] + Math.abs(Math.sin(time * 1.45)) * 0.16 + Math.abs(Math.sin(time * 0.37)) * 0.09,
    );
  }

  stop(): void {
    this.enabled = false;
    this.transitionToken += 1;
    this.suspendReasons.clear();
    this.wasEnabledBeforeSuspend = false;
    this.players.forEach((audio) => {
      this.cancelFade(audio);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });
    this.current = undefined;
  }

  private ensurePlayer(id: SceneId): HTMLAudioElement {
    const existing = this.players.get(id);
    if (existing) return existing;
    const audio = new Audio(tracks[id].src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audio.addEventListener("error", () => {
      if (audio !== this.current) return;
      this.enabled = false;
      this.failAndSilence();
      this.onStateChange?.(false);
    });
    audio.addEventListener("pause", () => {
      if (audio !== this.current || !this.enabled || audio.ended) return;
      this.enabled = false;
      this.onStateChange?.(false);
    });
    this.players.set(id, audio);
    return audio;
  }

  private targetVolume(): number {
    return this.ducked ? duckedVolume : normalVolume;
  }

  private fadeAudio(audio: HTMLAudioElement, target: number, duration: number, onDone?: () => void): void {
    this.cancelFade(audio);
    const started = performance.now();
    const initial = audio.volume;
    const tick = () => {
      const ratio = Math.min(1, (performance.now() - started) / Math.max(1, duration));
      const eased = 1 - Math.pow(1 - ratio, 3);
      audio.volume = Math.min(1, Math.max(0, initial + (target - initial) * eased));
      if (ratio < 1) {
        this.fadeFrames.set(audio, requestAnimationFrame(tick));
      } else {
        this.fadeFrames.delete(audio);
        onDone?.();
      }
    };
    this.fadeFrames.set(audio, requestAnimationFrame(tick));
  }

  private cancelFade(audio: HTMLAudioElement): void {
    const frame = this.fadeFrames.get(audio);
    if (frame) cancelAnimationFrame(frame);
    this.fadeFrames.delete(audio);
  }

  private fadeOutOthers(target: HTMLAudioElement, duration: number): void {
    this.players.forEach((audio) => {
      if (audio === target || audio.paused) return;
      this.fadeAudio(audio, 0, duration, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    });
  }

  private fadeAllAndPause(duration: number, resetTime: boolean): void {
    this.players.forEach((audio) => {
      if (audio.paused) {
        audio.volume = 0;
        if (resetTime) audio.currentTime = 0;
        return;
      }
      this.fadeAudio(audio, 0, duration, () => {
        audio.pause();
        if (resetTime) audio.currentTime = 0;
      });
    });
  }

  private failAndSilence(): void {
    this.enabled = false;
    this.fadeAllAndPause(300, true);
    this.onStateChange?.(false);
  }
}
