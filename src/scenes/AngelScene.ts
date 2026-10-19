import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  FogExp2,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  type WebGLRenderer,
} from "three";
import type { SceneModule, SceneMountContext } from "./types";
import { disposeScene } from "./visual-utils";

interface Shard {
  mesh: Mesh;
  direction: Vector3;
  phase: number;
}

const angelColors = [0xe52c1e, 0x6ca6ff, 0xff8c36, 0xe8e4d9];

export class AngelScene implements SceneModule {
  readonly kind = "angels" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(50, 1, 0.1, 80);
  private readonly root = new Group();
  private readonly shards: Shard[] = [];
  private readonly shellMaterial = new MeshBasicMaterial({
    color: angelColors[0],
    wireframe: true,
    transparent: true,
    opacity: 0.34,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  private shell = new Mesh(new IcosahedronGeometry(2.55, 1), this.shellMaterial);
  private rings: Line[] = [];
  private progress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private shatterTarget = 0;
  private shatter = 0;
  private active = false;
  private reducedMotion = false;
  private angelIndex = 0;

  mount(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.reducedMotion = context.reducedMotion;
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 8.2);
    this.scene.fog = new FogExp2(0x090504, 0.036);
    renderer.setClearColor(0x080403, 1);

    this.shell.rotation.set(0.1, 0.3, 0.16);
    this.root.add(this.shell);
    this.createShards(context.quality === "low" ? 1 : 2);
    this.createRings();
    this.createParticles(context.quality === "low" ? 360 : 900);
    this.scene.add(this.root);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  private createShards(detail: number): void {
    const source = new IcosahedronGeometry(2.54, detail).toNonIndexed();
    const positions = source.getAttribute("position");
    const fragmentMaterial = new MeshBasicMaterial({
      color: angelColors[0],
      wireframe: true,
      transparent: true,
      opacity: 0.14,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    for (let index = 0; index < positions.count; index += 3) {
      const vertices = [0, 1, 2].map((offset) => new Vector3().fromBufferAttribute(positions, index + offset));
      const center = vertices.reduce((sum, vertex) => sum.add(vertex), new Vector3()).multiplyScalar(1 / 3);
      const fragmentPositions = new Float32Array(vertices.flatMap((vertex) => [vertex.x, vertex.y, vertex.z]));
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(fragmentPositions, 3));

      const mesh = new Mesh(geometry, fragmentMaterial);
      mesh.userData.baseRotation = new Vector3(
        (index % 7) * 0.07,
        (index % 11) * 0.05,
        (index % 5) * 0.09,
      );
      this.root.add(mesh);
      this.shards.push({
        mesh,
        direction: center.clone().normalize(),
        phase: (index % 13) / 13,
      });
    }

    source.dispose();
  }

  private createRings(): void {
    for (let ringIndex = 0; ringIndex < 4; ringIndex += 1) {
      const points: Vector3[] = [];
      const radius = 3.4 + ringIndex * 0.34;
      for (let segment = 0; segment <= 72; segment += 1) {
        const angle = (segment / 72) * Math.PI * 2;
        const ripple = Math.sin(angle * 5 + ringIndex) * 0.12;
        points.push(new Vector3(Math.cos(angle) * (radius + ripple), Math.sin(angle) * radius, 0));
      }
      const ring = new Line(
        new BufferGeometry().setFromPoints(points),
        new LineBasicMaterial({
          color: 0xa51b14,
          transparent: true,
          opacity: 0.25 - ringIndex * 0.035,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.rotation.set(ringIndex * 0.54, ringIndex * 0.32, 0.12);
      this.rings.push(ring);
      this.root.add(ring);
    }
  }

  private createParticles(count: number): void {
    const positions = new Float32Array(count * 3);
    let seed = 0x44103f22;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 18;
      positions[index * 3 + 1] = (random() - 0.5) * 13;
      positions[index * 3 + 2] = (random() - 0.5) * 18;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0xd8a18d,
      size: 0.035,
      transparent: true,
      opacity: 0.34,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.scene.add(new Points(geometry, material));
  }

  setAngel(index: number): void {
    this.angelIndex = Math.min(angelColors.length - 1, Math.max(0, index));
    const color = new Color(angelColors[this.angelIndex]);
    this.shellMaterial.color.copy(color);
    this.shards[0]?.mesh.material instanceof MeshBasicMaterial && this.shards[0].mesh.material.color.copy(color);
    this.shatterTarget = 0;
    this.shatter = 0;
  }

  neutralize(): void {
    this.shatterTarget = 1;
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
    this.shatter += (this.shatterTarget - this.shatter) * (this.reducedMotion ? 1 : 0.055);
    this.camera.position.z = 8.2 - this.progress * 4.8 + this.shatter * 1.4;
    this.camera.position.x += (this.pointerX * 0.56 - this.camera.position.x) * 0.03;
    this.camera.position.y += (-this.pointerY * 0.34 - this.camera.position.y) * 0.03;
    this.camera.lookAt(0, 0, 0);

    const pulse = 1 + this.audioLevel * 0.18;
    this.root.rotation.y = time * 0.08 + this.pointerX * 0.1;
    this.root.rotation.x = Math.sin(time * 0.13) * 0.04 - this.pointerY * 0.06;
    this.shell.scale.setScalar(pulse * (1 + this.shatter * 0.38));
    this.shellMaterial.opacity = Math.max(0, 0.34 - this.shatter * 0.32);

    this.shards.forEach((shard) => {
      const base = shard.mesh.userData.baseRotation as Vector3;
      const drift = shard.direction.clone().multiplyScalar(this.shatter * (2.6 + shard.phase * 2.4));
      shard.mesh.position.copy(drift);
      shard.mesh.rotation.set(
        base.x + this.shatter * (0.8 + shard.phase),
        base.y + this.shatter * (1.2 - shard.phase),
        base.z + this.shatter * 0.9,
      );
      const material = shard.mesh.material as MeshBasicMaterial;
      material.opacity = this.shatter > 0.03 ? 0.38 * (1 - this.shatter * 0.72) : 0.14;
    });

    this.rings.forEach((ring, index) => {
      ring.rotation.z = time * (index % 2 ? -0.018 : 0.012) + this.shatter * (index + 1) * 0.04;
      (ring.material as LineBasicMaterial).opacity = Math.max(0, 0.25 - index * 0.035 - this.shatter * 0.2);
    });
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.shards.length = 0;
    this.rings.length = 0;
    disposeScene(this.scene);
  }
}
