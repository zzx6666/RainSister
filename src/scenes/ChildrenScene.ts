import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  EdgesGeometry,
  FogExp2,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  type Texture,
  type WebGLRenderer,
} from "three";
import { asset, characters } from "../data";
import type { SceneModule, SceneMountContext } from "./types";
import { createImagePlane, disposeScene, loadTexture } from "./visual-utils";

interface FloatingPlate {
  mesh: Mesh;
  baseY: number;
  baseX: number;
  phase: number;
}

export class ChildrenScene implements SceneModule {
  readonly kind = "children" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(50, 1, 0.1, 90);
  private readonly root = new Group();
  private readonly plates: FloatingPlate[] = [];
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
    this.camera.position.set(0, 0, 9);
    this.scene.fog = new FogExp2(0x0a0b08, 0.027);
    renderer.setClearColor(0x090a07, 1);

    const groupTexture = loadTexture(asset("characters/group.png"), "CHILDREN");
    const groupPlate = createImagePlane(groupTexture, 9.6, 5.4, 0.18);
    groupPlate.position.set(0, 0.15, -15);
    this.root.add(groupPlate);
    this.plates.push({ mesh: groupPlate, baseX: 0, baseY: 0.15, phase: 0 });

    const pilotIds = new Set(["shinji", "rei", "asuka", "kaworu"]);
    const pilots = characters.filter((character) => pilotIds.has(character.id));
    pilots.forEach((character, index) => {
      const texture = loadTexture(character.portrait, character.nameEn);
      const plane = createImagePlane(texture, 3.7, 4.85, 0.68);
      const x = index % 2 === 0 ? -3.6 : 3.55;
      const y = index < 2 ? 0.58 : -0.62;
      const z = -4.2 - index * 4.2;
      plane.position.set(x, y, z);
      plane.userData.characterId = character.id;
      this.root.add(plane);
      this.addFrame(3.7, 4.85, plane.position, plane.rotation.x);
      this.plates.push({ mesh: plane, baseX: x, baseY: y, phase: index * 0.8 + 0.6 });
    });

    this.addParticles(context.quality === "low" ? 140 : 280);
    this.scene.add(this.root);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  private addFrame(width: number, height: number, position: Mesh["position"], rotationX: number): void {
    const frame = new LineSegments(
      new EdgesGeometry(new PlaneGeometry(width + 0.08, height + 0.08)),
      new LineBasicMaterial({ color: 0x9fc68a, transparent: true, opacity: 0.2 }),
    );
    frame.position.copy(position);
    frame.rotation.x = rotationX;
    this.root.add(frame);
  }

  private addParticles(count: number): void {
    const positions = new Float32Array(count * 3);
    let seed = 0x9a17f13c;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 24;
      positions[index * 3 + 1] = (random() - 0.5) * 12;
      positions[index * 3 + 2] = -random() * 30;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0xd5e7bc,
      size: 0.035,
      transparent: true,
      opacity: 0.28,
      blending: AdditiveBlending,
      depthWrite: false,
    });
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
    this.camera.position.z = 9 - this.progress * 25;
    this.camera.position.x += (this.pointerX * 0.72 - this.camera.position.x) * 0.035;
    this.camera.position.y += (-this.pointerY * 0.5 - this.camera.position.y) * 0.035;
    this.camera.lookAt(this.pointerX * 0.45, -this.pointerY * 0.24, this.camera.position.z - 8);

    this.plates.forEach((plate, index) => {
      const drift = this.reducedMotion ? 0 : Math.sin(time * 0.32 + plate.phase) * (index === 0 ? 0.025 : 0.13);
      plate.mesh.position.y = plate.baseY + drift + this.audioLevel * 0.025;
      plate.mesh.position.x = plate.baseX + this.pointerX * (0.06 + index * 0.018);
      plate.mesh.rotation.z = (this.pointerX * 0.018 + Math.sin(time * 0.16 + plate.phase) * 0.008) as number;
    });
    this.root.rotation.y = this.pointerX * 0.025;
    this.root.position.z = -this.progress * 1.8;
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.plates.length = 0;
    disposeScene(this.scene);
  }
}
