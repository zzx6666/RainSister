import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  FogExp2,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  type Texture,
  type WebGLRenderer,
} from "three";
import { eras } from "../data";
import type { SceneModule, SceneMountContext } from "./types";
import { createImagePlane, disposeScene, loadTexture } from "./visual-utils";

interface EraPlate {
  group: Group;
  image: Mesh;
  glow: Mesh;
  index: number;
}

export class RecordsScene implements SceneModule {
  readonly kind = "records" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(48, 1, 0.1, 100);
  private readonly root = new Group();
  private readonly plates: EraPlate[] = [];
  private progress = 0;
  private targetProgress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private active = false;
  private reducedMotion = false;

  mount(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.reducedMotion = context.reducedMotion;
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 8);
    this.scene.fog = new FogExp2(0x070506, 0.035);
    renderer.setClearColor(0x080506, 1);

    eras.forEach((era, index) => {
      const group = new Group();
      const side = index % 2 === 0 ? -1 : 1;
      group.position.set(side * (0.85 + (index % 3) * 0.28), index % 2 === 0 ? -0.28 : 0.34, -index * 4.1);
      group.rotation.y = side * 0.075;

      const texture = loadTexture(era.image, `${era.year} ${era.chronology}`);
      const image = createImagePlane(texture, 6.4, 3.6, era.image ? 0.82 : 0.54);
      group.add(image);

      const frame = new LineSegments(
        new EdgesGeometry(new PlaneGeometry(6.54, 3.74)),
        new LineBasicMaterial({
          color: new Color(era.year === "1995" || era.year === "1997" ? 0xe42c20 : 0xe7ddcc),
          transparent: true,
          opacity: 0.34,
        }),
      );
      group.add(frame);

      const glow = new Mesh(
        new PlaneGeometry(5.95, 0.045),
        new MeshBasicMaterial({ color: 0xe52c1e, transparent: true, opacity: 0.2, depthWrite: false }),
      );
      glow.position.set(0, -1.48, 0.02);
      group.add(glow);

      const spine = new Mesh(
        new BoxGeometry(0.055, 3.7, 0.055),
        new MeshBasicMaterial({ color: index % 2 === 0 ? 0xc52318 : 0xdbd3c4 }),
      );
      spine.position.set(side * 3.28, 0, -0.02);
      group.add(spine);

      this.root.add(group);
      this.plates.push({ group, image, glow, index });
    });

    for (let marker = 0; marker < 9; marker += 1) {
      const tick = new Mesh(
        new BoxGeometry(marker % 3 === 0 ? 0.12 : 0.05, marker % 3 === 0 ? 0.55 : 0.23, 0.02),
        new MeshBasicMaterial({ color: marker % 3 === 0 ? 0xe52c1e : 0x55504a }),
      );
      tick.position.set(marker % 2 === 0 ? -7.4 : 7.4, marker * 0.26 - 1.1, -marker * 2.6);
      this.root.add(tick);
    }

    this.scene.add(this.root);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  setProgress(progress: number): void {
    this.targetProgress = progress;
  }

  focusEra(index: number): void {
    this.targetProgress = Math.min(1, Math.max(0, index / Math.max(1, eras.length - 1)));
  }

  setPointer(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
  }

  setAudioLevel(level: number): void {
    this.audioLevel = level;
  }

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  render(renderer: WebGLRenderer, elapsed: number): void {
    if (!this.active) return;
    const time = this.reducedMotion ? 0 : elapsed;
    this.progress += (this.targetProgress - this.progress) * (this.reducedMotion ? 0.18 : 0.055);
    if (Math.abs(this.targetProgress - this.progress) < 0.0005) this.progress = this.targetProgress;
    const corridorTravel = this.progress * 24;
    this.camera.position.set(this.pointerX * 0.45, -this.pointerY * 0.3, 8 - corridorTravel);
    this.camera.lookAt(0, 0, this.camera.position.z - 8);

    this.plates.forEach((plate) => {
      const distance = Math.abs(plate.group.position.z - this.camera.position.z);
      const near = Math.max(0.28, 1 - distance / 9);
      (plate.image.material as MeshBasicMaterial).opacity = (plate.image.material as MeshBasicMaterial).map
        ? 0.35 + near * 0.52
        : 0.3 + near * 0.3;
      plate.glow.position.x = Math.sin(time * 0.8 + plate.index) * 1.3;
      (plate.glow.material as MeshBasicMaterial).opacity = 0.12 + near * 0.18 + this.audioLevel * 0.08;
      plate.group.rotation.z = this.pointerX * 0.006;
    });
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.plates.length = 0;
    disposeScene(this.scene);
  }
}
