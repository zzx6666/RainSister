import {
  BoxGeometry,
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
import { machines } from "../data";
import type { SceneModule, SceneMountContext } from "./types";
import { createImagePlane, disposeScene, loadTexture } from "./visual-utils";

interface MachineBay {
  root: Group;
  image: Mesh;
  scan: Mesh;
  targetX: number;
  index: number;
}

export class HangarScene implements SceneModule {
  readonly kind = "evangelion" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(46, 1, 0.1, 120);
  private readonly root = new Group();
  private readonly bays: MachineBay[] = [];
  private progress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private activeIndex = 1;
  private cameraX = 0;
  private active = false;
  private reducedMotion = false;

  mount(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.reducedMotion = context.reducedMotion;
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0.45, 13);
    this.scene.fog = new FogExp2(0x06100d, 0.031);
    renderer.setClearColor(0x050b09, 1);

    machines.forEach((machine, index) => {
      const root = new Group();
      const x = (index - (machines.length - 1) / 2) * 8.2;
      root.position.set(x, 0, -index * 1.2);

      const texture = loadTexture(machine.image, `EVA ${machine.code}`);
      const image = createImagePlane(texture, 5.6, 7.4, 0.62);
      image.position.set(0, 0.35, 0);
      root.add(image);

      const frame = new LineSegments(
        new EdgesGeometry(new PlaneGeometry(5.72, 7.52)),
        new LineBasicMaterial({
          color: machine.id === "eva-01" ? 0xb9e33e : 0xd4d0c3,
          transparent: true,
          opacity: machine.id === "eva-01" ? 0.68 : 0.22,
        }),
      );
      frame.position.z = 0.01;
      root.add(frame);

      const scan = new Mesh(
        new PlaneGeometry(5.45, 0.055),
        new MeshBasicMaterial({
          color: 0xb9e33e,
          transparent: true,
          opacity: 0.52,
          depthWrite: false,
        }),
      );
      scan.position.set(0, 2.9, 0.025);
      root.add(scan);

      for (let rail = 0; rail < 2; rail += 1) {
        const railMesh = new Mesh(
          new BoxGeometry(0.08, 8.6, 0.08),
          new MeshBasicMaterial({ color: rail ? 0x28372e : 0x546052 }),
        );
        railMesh.position.set(rail ? 3.25 : -3.25, 0.2, -0.2);
        root.add(railMesh);
      }

      this.bays.push({ root, image, scan, targetX: x, index });
      this.root.add(root);
    });

    for (let beam = 0; beam < 13; beam += 1) {
      const z = 7 - beam * 2.3;
      const floorBeam = new Mesh(
        new BoxGeometry(42, 0.035, 0.06),
        new MeshBasicMaterial({ color: beam % 3 === 0 ? 0xa8bb8c : 0x24312b }),
      );
      floorBeam.position.set(0, -4.25, z);
      this.root.add(floorBeam);

      const ceilingBeam = floorBeam.clone();
      ceilingBeam.position.y = 5.15;
      this.root.add(ceilingBeam);
    }

    this.scene.add(this.root);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  setActiveMachine(index: number): void {
    this.activeIndex = Math.min(this.bays.length - 1, Math.max(0, index));
  }

  setProgress(progress: number): void {
    this.progress = progress;
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
    const target = this.bays[this.activeIndex]?.targetX ?? 0;
    this.cameraX += (target - this.cameraX) * (this.reducedMotion ? 1 : 0.045);
    this.camera.position.x = this.cameraX + this.pointerX * 0.3;
    this.camera.position.y = 0.45 - this.pointerY * 0.18 + this.progress * 0.65;
    this.camera.position.z = 13 - this.progress * 2.2;
    this.camera.lookAt(this.cameraX, 0.1, -this.activeIndex * 1.2);

    this.bays.forEach((bay, index) => {
      bay.root.position.z = -index * 1.2 + (index === this.activeIndex ? this.progress * 1.1 : 0);
      bay.scan.position.y = 2.9 - ((time * 0.62 + index * 0.4) % 5.8);
      (bay.scan.material as MeshBasicMaterial).opacity = index === this.activeIndex ? 0.5 + this.audioLevel * 0.22 : 0.08;
      bay.image.rotation.y = (index - this.activeIndex) * 0.1 + this.pointerX * 0.014;
    });

    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.bays.length = 0;
    disposeScene(this.scene);
  }
}
