import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  FogExp2,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  type WebGLRenderer,
} from "three";
import { asset } from "../data";
import type { SceneModule, SceneMountContext } from "./types";
import { createImagePlane, disposeScene, loadTexture } from "./visual-utils";

export class ATFieldScene implements SceneModule {
  readonly kind = "top" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(52, 1, 0.1, 80);
  private readonly field = new Group();
  private readonly particles: Points[] = [];
  private readonly rings: Line[] = [];
  private heroImage?: Mesh;
  private progress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private active = false;
  private reducedMotion = false;

  mount(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.rendererSetup(renderer, context);
    this.scene.fog = new FogExp2(0x080807, 0.038);
    this.camera.position.set(0, 0, 7.4);

    const outerGeometry = new OctahedronGeometry(2.65, 1);
    const outerMaterial = new MeshBasicMaterial({
      color: 0xe52c1e,
      wireframe: true,
      transparent: true,
      opacity: 0.48,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const outer = new Mesh(outerGeometry, outerMaterial);
    outer.rotation.set(0.24, 0.52, 0.1);
    this.field.add(outer);

    const innerGeometry = new OctahedronGeometry(1.88, 0);
    const innerMaterial = new MeshBasicMaterial({
      color: 0xff6e35,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const inner = new Mesh(innerGeometry, innerMaterial);
    inner.rotation.set(-0.38, 0.18, 0.5);
    this.field.add(inner);

    for (let index = 0; index < 3; index += 1) {
      const points: number[] = [];
      const radius = 3.25 + index * 0.48;
      for (let segment = 0; segment <= 96; segment += 1) {
        const angle = (segment / 96) * Math.PI * 2;
        points.push(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 3) * 0.08);
      }
      const linePoints: Vector3[] = [];
      for (let pointIndex = 0; pointIndex < points.length; pointIndex += 3) {
        linePoints.push(new Vector3(points[pointIndex], points[pointIndex + 1], points[pointIndex + 2]));
      }
      const geometry = new BufferGeometry().setFromPoints(linePoints);
      const line = new Line(
        geometry,
        new LineBasicMaterial({
          color: index === 1 ? 0xf0a45e : 0x8f1613,
          transparent: true,
          opacity: 0.35 - index * 0.06,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      line.rotation.x = index * 0.58;
      line.rotation.y = index * 0.46;
      this.rings.push(line);
      this.field.add(line);
    }

    this.scene.add(this.field);
    const heroTexture = loadTexture(asset("official/trailer-2_0.jpg"), "EVANGELION INITIALIZE");
    this.heroImage = createImagePlane(heroTexture, 8.8, 4.95, 0);
    this.heroImage.position.set(0, 0.1, -3.5);
    (this.heroImage.material as MeshBasicMaterial).color.setHex(0x9b948b);
    this.scene.add(this.heroImage);
    this.addParticles(context.quality === "low" ? 520 : context.quality === "medium" ? 1100 : 1900);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  private rendererSetup(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.reducedMotion = context.reducedMotion;
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
    renderer.setClearColor(0x050504, 1);
  }

  private addParticles(count: number): void {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    let seed = 0x71a5c0de;

    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    for (let index = 0; index < count; index += 1) {
      const radius = 3.4 + next() * 10;
      const theta = next() * Math.PI * 2;
      const phi = Math.acos(next() * 2 - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[index * 3 + 2] = radius * Math.cos(phi) - 4;
      phases[index] = next();
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("phase", new BufferAttribute(phases, 1));
    const material = new PointsMaterial({
      color: 0xd7d0c3,
      size: 0.024,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const points = new Points(geometry, material);
    this.particles.push(points);
    this.scene.add(points);
  }

  setProgress(progress: number): void {
    this.progress = progress;
  }

  setPointer(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
  }

  setAudioLevel(level: number): void {
    this.audioLevel = Math.min(1, Math.max(0, level));
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
    const aperture = Math.min(1, this.progress * 1.4);
    this.camera.position.z = 7.4 - aperture * 6.4;
    this.camera.position.x += (this.pointerX * 0.36 - this.camera.position.x) * 0.035;
    this.camera.position.y += (-this.pointerY * 0.24 - this.camera.position.y) * 0.035;
    this.camera.lookAt(0, 0, -0.8);

    const pulse = 1 + this.audioLevel * 0.14;
    this.field.scale.setScalar(pulse * (1 + this.progress * 0.18));
    this.field.rotation.y = time * 0.07 + this.progress * 0.65 + this.pointerX * 0.08;
    this.field.rotation.x = Math.sin(time * 0.11) * 0.05 - this.pointerY * 0.05;
    if (this.heroImage) {
      const material = this.heroImage.material as MeshBasicMaterial;
      material.opacity = Math.min(0.34, Math.max(0, (this.progress - 0.18) * 0.55));
      this.heroImage.position.x = this.pointerX * 0.16;
      this.heroImage.position.y = 0.1 - this.pointerY * 0.08;
    }
    this.rings.forEach((ring, index) => {
      ring.rotation.z = time * (0.012 + index * 0.008) * (index % 2 ? -1 : 1);
    });
    this.particles.forEach((points, index) => {
      points.rotation.y = time * (0.004 + index * 0.002);
    });
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    disposeScene(this.scene);
  }
}
