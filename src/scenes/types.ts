import type { WebGLRenderer } from "three";

export type QualityTier = "high" | "medium" | "low";
export type SceneId = "top" | "children" | "evangelion" | "angels" | "tokyo-3" | "records" | "release";

export interface SceneMountContext {
  width: number;
  height: number;
  pixelRatio: number;
  quality: QualityTier;
  reducedMotion: boolean;
}

export interface SceneModule {
  readonly kind: SceneId;
  mount(renderer: WebGLRenderer, context: SceneMountContext): void;
  resize?(context: SceneMountContext): void;
  setProgress(progress: number): void;
  setPointer(x: number, y: number): void;
  setAudioLevel(level: number): void;
  activate(): void;
  deactivate(): void;
  render(renderer: WebGLRenderer, elapsed: number): void;
  dispose(): void;
}
