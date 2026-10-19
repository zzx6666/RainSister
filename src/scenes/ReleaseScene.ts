import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  FogExp2,
  Group,
  LineLoop,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  Vector3,
  type WebGLRenderer,
} from "three";
import { asset } from "../data";
import type { SceneModule, SceneMountContext } from "./types";
import { disposeScene, loadTexture } from "./visual-utils";

const seaVertex = `
  uniform float uTime;
  uniform float uAudio;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float wave = sin(position.x * 0.38 + uTime * 0.7) * 0.11;
    wave += sin(position.y * 0.54 - uTime * 0.52) * 0.07;
    wave += sin((position.x + position.y) * 0.17 + uTime * 0.34) * 0.09;
    transformed.z += wave + uAudio * 0.16;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const seaFragment = `
  uniform float uTime;
  uniform float uAudio;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    float horizon = smoothstep(0.0, 0.92, vUv.y);
    float red = 0.12 + horizon * 0.62 + vWave * 0.42 + uAudio * 0.06;
    float green = 0.008 + horizon * 0.035 + vWave * 0.05;
    float blue = 0.012 + horizon * 0.025;
    float lines = smoothstep(0.965, 1.0, sin((vUv.y * 150.0 + uTime * 0.4) * 3.14159) * 0.5 + 0.5);
    vec3 color = vec3(red, green, blue) + vec3(lines * 0.03, 0.0, 0.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class ReleaseScene implements SceneModule {
  readonly kind = "release" as const;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(50, 1, 0.1, 100);
  private readonly field = new Group();
  private readonly fieldMesh = new Mesh(
    new OctahedronGeometry(2.35, 1),
    new MeshBasicMaterial({
      color: 0xf1d9c5,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  private readonly rings: LineLoop[] = [];
  private readonly seaMaterial = new ShaderMaterial({
    vertexShader: seaVertex,
    fragmentShader: seaFragment,
    uniforms: { uTime: { value: 0 }, uAudio: { value: 0 } },
    side: DoubleSide,
    depthWrite: true,
  });
  private progress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private audioLevel = 0;
  private active = false;
  private reducedMotion = false;
  private releaseRequested = false;

  mount(renderer: WebGLRenderer, context: SceneMountContext): void {
    this.reducedMotion = context.reducedMotion;
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 1.6, 8.5);
    this.scene.fog = new FogExp2(0x090202, 0.026);
    renderer.setClearColor(0x080202, 1);

    const sea = new Mesh(new PlaneGeometry(64, 64, 72, 72), this.seaMaterial);
    sea.rotation.x = -Math.PI / 2.35;
    sea.position.set(0, -2.7, -10);
    this.scene.add(sea);

    const recordTexture = loadTexture(asset("official/official-site-3_0.jpg"), "FINAL RECORD");
    const record = new Mesh(
      new PlaneGeometry(23, 16),
      new MeshBasicMaterial({
        map: recordTexture,
        color: 0x8f5f59,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    record.position.set(1.8, 2.1, -16);
    this.scene.add(record);

    this.fieldMesh.rotation.set(0.22, 0.42, 0.12);
    this.field.add(this.fieldMesh);
    for (let index = 0; index < 3; index += 1) {
      const points: Vector3[] = [];
      const radius = 3 + index * 0.42;
      for (let segment = 0; segment < 88; segment += 1) {
        const angle = (segment / 88) * Math.PI * 2;
        points.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(angle * 4) * 0.09));
      }
      const ring = new LineLoop(
        new BufferGeometry().setFromPoints(points),
        new LineBasicMaterial({
          color: index === 1 ? 0xe7d1bd : 0xc62318,
          transparent: true,
          opacity: 0.22 - index * 0.04,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.rotation.set(index * 0.42, index * 0.36, 0.08);
      this.rings.push(ring);
      this.field.add(ring);
    }
    this.scene.add(this.field);
    this.createAsh(context.quality === "low" ? 220 : 620);
  }

  resize(context: SceneMountContext): void {
    this.camera.aspect = context.width / context.height;
    this.camera.updateProjectionMatrix();
  }

  private createAsh(count: number): void {
    const positions = new Float32Array(count * 3);
    let seed = 0xf390112a;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 18;
      positions[index * 3 + 1] = (random() - 0.5) * 10;
      positions[index * 3 + 2] = (random() - 0.5) * 14;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    this.scene.add(
      new Points(
        geometry,
        new PointsMaterial({
          color: 0xf1d1b8,
          size: 0.028,
          transparent: true,
          opacity: 0.42,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );
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

  release(): void {
    this.releaseRequested = true;
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
    this.seaMaterial.uniforms.uTime.value = time;
    this.seaMaterial.uniforms.uAudio.value = this.audioLevel;
    this.camera.position.x = this.pointerX * 0.32;
    this.camera.position.y = 1.6 - this.pointerY * 0.2;
    this.camera.position.z = 8.5 - this.progress * 5.8;
    this.camera.lookAt(0, 0, -2.5);

    const opening = Math.min(1, Math.max(this.progress * 1.45, this.releaseRequested ? 0.82 : 0));
    this.field.rotation.y = time * 0.075 + this.pointerX * 0.08;
    this.field.rotation.x = Math.sin(time * 0.11) * 0.035 - this.pointerY * 0.05;
    this.field.scale.setScalar((1 + this.audioLevel * 0.13) * (1 + opening * 0.52));
    (this.fieldMesh.material as MeshBasicMaterial).opacity = Math.max(0, 0.2 - opening * 0.165);
    this.rings.forEach((ring, index) => {
      ring.rotation.z = time * (index % 2 ? -0.02 : 0.014) + opening * (index + 1) * 0.16;
      (ring.material as LineBasicMaterial).opacity = Math.max(0, 0.22 - index * 0.04 - opening * 0.17);
    });
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.rings.length = 0;
    disposeScene(this.scene);
  }
}
