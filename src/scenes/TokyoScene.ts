import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  FogExp2,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  type Texture,
  type WebGLRenderer,
} from "three";
import { asset } from "../data";
import type { SceneModule, SceneMountContext } from "./types";
import { disposeScene, loadTexture } from "./visual-utils";

interface Building {
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  delay: number;
}

export class TokyoScene implements SceneModule {
  readonly kind = "tokyo-3" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(50, 1, 0.1, 140);
  private readonly dummy = new Object3D();
  private readonly buildings: Building[] = [];
  private city?: InstancedMesh;
  private progress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private active = false;
  private reducedMotion = false;

  mount(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.reducedMotion = context.reducedMotion;
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 3.5, 18);
    this.scene.fog = new FogExp2(0x06111b, 0.018);
    renderer.setClearColor(0x040b12, 1);

    this.scene.add(new AmbientLight(0x8da4b8, 0.7));
    const moon = new DirectionalLight(0xb8d8ff, 1.9);
    moon.position.set(-8, 18, 10);
    this.scene.add(moon);
    const warning = new DirectionalLight(0xf05a36, 0.8);
    warning.position.set(10, 2, -12);
    this.scene.add(warning);

    this.createBackdrop();
    this.createCity(context.quality === "low" ? 70 : context.quality === "medium" ? 120 : 176);
    this.createStars(context.quality === "low" ? 120 : 320);
  }

  private createBackdrop(): void {
    const texture = loadTexture(asset("official/official-site-1_0.jpg"), "TOKYO-3 OFFICIAL IMAGE");
    const backdrop = new Mesh(
      new PlaneGeometry(52, 40),
      new MeshBasicMaterial({
        map: texture,
        color: 0x9ab8c5,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    backdrop.position.set(0, 9, -42);
    this.scene.add(backdrop);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  private createCity(count: number): void {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({
      color: 0x345565,
      roughness: 0.58,
      metalness: 0.18,
      emissive: 0x0b2634,
      emissiveIntensity: 1.35,
    });
    this.city = new InstancedMesh(geometry, material, count);
    this.city.instanceMatrix.setUsage(35048);

    let seed = 0x18f30b7a;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    for (let index = 0; index < count; index += 1) {
      const radius = 5 + Math.sqrt(random()) * 32;
      const angle = random() * Math.PI * 2;
      const height = 1.2 + Math.pow(random(), 2.2) * 12;
      const building: Building = {
        x: Math.cos(angle) * radius,
        y: -9,
        z: Math.sin(angle) * radius - 15,
        height,
        width: 0.55 + random() * 1.65,
        depth: 0.55 + random() * 1.65,
        delay: random() * 0.48,
      };
      this.buildings.push(building);
    }
    this.updateCity();
    this.scene.add(this.city);
  }

  private updateCity(): void {
    if (!this.city) return;
    this.buildings.forEach((building, index) => {
      const rise = Math.min(1, Math.max(0, (this.progress - building.delay) / (1 - building.delay + 0.001)));
      const eased = 1 - Math.pow(1 - rise, 3);
      this.dummy.position.set(building.x, building.y + building.height / 2 + eased * (8 + building.height), building.z);
      this.dummy.scale.set(building.width, building.height, building.depth);
      this.dummy.rotation.y = Math.atan2(building.x, building.z) * 0.1;
      this.dummy.updateMatrix();
      this.city?.setMatrixAt(index, this.dummy.matrix as Matrix4);
    });
    if (this.city) this.city.instanceMatrix.needsUpdate = true;
  }

  private createStars(count: number): void {
    const positions = new Float32Array(count * 3);
    let seed = 0x45a019fa;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 80;
      positions[index * 3 + 1] = 18 + random() * 42;
      positions[index * 3 + 2] = -10 - random() * 65;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new PointsMaterial({ color: 0xa6c8e7, size: 0.08, transparent: true, opacity: 0.42, depthWrite: false });
    this.scene.add(new Points(geometry, material));
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
    const eased = 1 - Math.pow(1 - this.progress, 2.4);
    this.camera.position.x = this.pointerX * 2.2;
    this.camera.position.y = 2.6 + eased * 6.5 - this.pointerY * 0.65;
    this.camera.position.z = 20 - eased * 10;
    this.camera.lookAt(this.pointerX * 1.8, 2.4 + eased * 3.4, -15 - eased * 2.5);
    if (this.city) {
      this.city.rotation.y = Math.sin(time * 0.025) * 0.015;
      this.city.scale.setScalar(1 + this.audioLevel * 0.016);
    }
    this.updateCity();
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.buildings.length = 0;
    disposeScene(this.scene);
  }
}
