import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";

const loader = new TextureLoader();

export function loadTexture(url: string, label: string): Texture {
  const texture = makeFallbackTexture(label);
  if (!url) return texture;

  loader.load(
    url,
    (loaded) => {
      texture.image = loaded.image;
      texture.colorSpace = SRGBColorSpace;
      texture.minFilter = LinearFilter;
      texture.needsUpdate = true;
      loaded.dispose();
    },
    undefined,
    () => {
      texture.needsUpdate = true;
    },
  );
  return texture;
}

export function makeFallbackTexture(label: string, accent = "#c62018"): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const context = canvas.getContext("2d");

  if (context) {
    context.fillStyle = "#080807";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = accent;
    context.lineWidth = 3;
    context.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);
    context.fillStyle = "#e9e6dc";
    context.font = "700 54px 'Archivo Narrow', sans-serif";
    context.fillText(label.toUpperCase(), 72, canvas.height / 2);
    context.fillStyle = accent;
    context.font = "20px 'Archivo Narrow', sans-serif";
    context.fillText("ARCHIVE MATERIAL / NO LOCAL RECORD", 74, canvas.height / 2 + 44);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createImagePlane(texture: Texture, width: number, height: number, opacity = 0.82): Mesh {
  const geometry = new PlaneGeometry(width, height);
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    side: DoubleSide,
    depthWrite: false,
  });
  return new Mesh(geometry, material);
}

export function disposeScene(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  root.traverse((object) => {
    const renderable = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    if (renderable.geometry) geometries.add(renderable.geometry);
    const objectMaterials = renderable.material
      ? Array.isArray(renderable.material)
        ? renderable.material
        : [renderable.material]
      : [];
    objectMaterials.forEach((material) => {
      materials.add(material);
      const map = (material as Material & { map?: Texture }).map;
      if (map) textures.add(map);
      const uniforms = (material as Material & { uniforms?: Record<string, { value?: unknown }> }).uniforms;
      Object.values(uniforms ?? {}).forEach((uniform) => {
        if (uniform.value instanceof Texture) textures.add(uniform.value);
      });
    });
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  root.clear();
}
