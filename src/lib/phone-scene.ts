import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { geometry, type Design } from './catalog';
import { phoneProfile } from './phone-profiles';

// Dimensions are visual proportions in scene units, not production measurements.
function roundedPath<T extends THREE.Path>(
  path: T,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): T {
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

function createPhone(design: Design, canvas: HTMLCanvasElement) {
  const model = new THREE.Group(),
    g = geometry(design.modelId, design.templateVersion),
    h = g.height / 100;
  const profile = phoneProfile(design.modelId);
  const calibrated = design.templateVersion === 2;
  const clear = design.materialId === 'clear',
    gloss = design.materialId === 'gloss';
  const color = new THREE.Color(design.color);
  const shell = new THREE.MeshPhysicalMaterial({
    color,
    roughness: gloss ? 0.2 : clear ? 0.16 : design.materialId === 'matte' ? 0.68 : 0.48,
    metalness: 0,
    clearcoat: gloss ? 1 : clear ? 1 : 0.2,
    clearcoatRoughness: 0.18,
    transmission: clear ? 0.52 : 0,
    thickness: 0.12,
    ior: 1.46,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: clear ? '#c2c9cb' : color.clone().multiplyScalar(0.7),
    metalness: 0.65,
    roughness: 0.28,
  });
  const black = new THREE.MeshPhysicalMaterial({
    color: '#111519',
    metalness: 0.32,
    roughness: 0.22,
    clearcoat: 1,
  });
  function box(
    w: number,
    height: number,
    d: number,
    r: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const mesh: THREE.Mesh = new THREE.Mesh(new RoundedBoxGeometry(w, height, d, 4, r), material);
    mesh.position.set(x, y, z);
    model.add(mesh);
    return mesh;
  }
  // The phone chassis is visible through the camera opening and the translucent bumper.
  const chassis = box(
    2.6,
    h - 0.2,
    0.25,
    0.11,
    new THREE.MeshPhysicalMaterial({
      color: profile.frame === 'titanium' ? '#8d8b82' : '#c0c6c7',
      metalness: 0.9,
      roughness: profile.frame === 'steel' ? 0.14 : 0.38,
    }),
    0,
    0,
    -0.03,
  );
  chassis.geometry.dispose();
  chassis.geometry = new THREE.ExtrudeGeometry(
    roundedPath(new THREE.Shape(), -1.3, -h / 2 + 0.1, 2.6, h - 0.2, 0.35),
    { depth: 0.25, bevelEnabled: false, curveSegments: 24 },
  );
  chassis.position.z = -0.19;
  const shape = roundedPath(new THREE.Shape(), -1.34, -h / 2 + 0.06, 2.68, h - 0.12, 0.38);
  const cx = (21 + g.cameraWidth / 2) / 100 - 1.4,
    cy = h / 2 - (21 + g.cameraHeight / 2) / 100;
  shape.holes.push(
    roundedPath(
      new THREE.Path(),
      -0.0 + 21 / 100 - 1.4,
      h / 2 - (g.cameraHeight + 21) / 100,
      g.cameraWidth / 100,
      g.cameraHeight / 100,
      g.cameraRadius / 100,
    ),
  );
  if (g.flashHole) {
    const hole = new THREE.Path();
    hole.absarc(g.flash[0] / 100 - 1.4, h / 2 - g.flash[1] / 100, 0.1, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const shellGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.045,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 14,
  });
  const body = new THREE.Mesh(shellGeometry, shell);
  body.position.z = -0.14;
  model.add(body);
  // Artwork uses the exact same clipped SVG as the editor and PNG export.
  const face = new THREE.ShapeGeometry(shape, 24);
  const positions = face.attributes.position;
  const uv = new Float32Array(positions.count * 2);
  for (let i = 0; i < positions.count; i++) {
    uv[i * 2] = (positions.getX(i) + 1.4) / 2.8;
    uv[i * 2 + 1] = (positions.getY(i) + h / 2) / h;
  }
  face.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const printMaterial = new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    roughness: gloss ? 0.21 : 0.63,
    clearcoat: gloss ? 1 : 0.12,
    clearcoatRoughness: 0.2,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const artwork = new THREE.Mesh(face, printMaterial);
  artwork.position.z = 0.167;
  model.add(artwork);
  // A raised, machined camera island with separate metal rings and optical glass.
  const island = box(
    g.cameraWidth / 100 - 0.07,
    g.cameraHeight / 100 - 0.07,
    0.135,
    0.08,
    new THREE.MeshPhysicalMaterial({
      color: color.clone().lerp(new THREE.Color('#d9ded5'), 0.18),
      roughness: 0.32,
      metalness: 0.12,
      clearcoat: 0.45,
    }),
    cx,
    cy,
    0.17,
  );
  island.geometry.dispose();
  island.geometry = new THREE.ExtrudeGeometry(
    roundedPath(
      new THREE.Shape(),
      -g.cameraWidth / 200 + 0.035,
      -g.cameraHeight / 200 + 0.035,
      g.cameraWidth / 100 - 0.07,
      g.cameraHeight / 100 - 0.07,
      Math.max(0.08, g.cameraRadius / 100 - 0.035),
    ),
    {
      depth: 0.1,
      bevelEnabled: true,
      bevelSize: 0.016,
      bevelThickness: 0.018,
      bevelSegments: 3,
      curveSegments: 24,
    },
  );
  island.position.z = 0.14;
  const lensPoints = g.lenses;
  function disc(
    radius: number,
    depth: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 64), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    model.add(mesh);
    return mesh;
  }
  const lensMetal = new THREE.MeshStandardMaterial({
    color: '#777f7e',
    metalness: 1,
    roughness: 0.2,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#091623',
    metalness: 0.38,
    roughness: 0.075,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    iridescence: 0.25,
  });
  for (const [px, py] of lensPoints) {
    const start = model.children.length;
    const x = px / 100 - 1.4,
      y = h / 2 - py / 100;
    disc(0.242, 0.065, metal, x, y, 0.262);
    disc(0.222, 0.084, lensMetal, x, y, 0.287);
    disc(0.195, 0.085, black, x, y, 0.3);
    disc(0.162, 0.02, glass, x, y, 0.348);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.174, 0.008, 8, 64), lensMetal);
    ring.position.set(x, y, 0.358);
    model.add(ring);
    disc(
      0.105,
      0.005,
      new THREE.MeshPhysicalMaterial({
        color: '#163943',
        metalness: 0.75,
        roughness: 0.14,
        clearcoat: 1,
      }),
      x,
      y,
      0.362,
    );
    disc(
      0.06,
      0.006,
      new THREE.MeshPhysicalMaterial({
        color: '#050b15',
        roughness: 0.05,
        metalness: 0.3,
        clearcoat: 1,
      }),
      x,
      y,
      0.367,
    );
    disc(
      0.028,
      0.002,
      new THREE.MeshBasicMaterial({ color: '#8fb8c9', transparent: true, opacity: 0.36 }),
      x - 0.045,
      y + 0.045,
      0.372,
    );
    const factor = g.lensRadius / 24.2;
    for (const lens of model.children.slice(start)) {
      lens.position.x = x + (lens.position.x - x) * factor;
      lens.position.y = y + (lens.position.y - y) * factor;
      lens.scale.set(factor, factor, factor);
    }
  }
  const flashX = g.flash[0] / 100 - 1.4,
    flashY = h / 2 - g.flash[1] / 100;
  disc(
    0.07,
    0.017,
    new THREE.MeshStandardMaterial({ color: '#e8e5d5', roughness: 0.38 }),
    flashX,
    flashY,
    0.261,
  );
  disc(
    0.047,
    0.018,
    new THREE.MeshStandardMaterial({ color: '#fff4db', roughness: 0.5 }),
    flashX,
    flashY,
    0.271,
  );
  if (g.pro)
    disc(0.08, 0.015, black, flashX, h / 2 - (21 + g.cameraHeight - g.lensRadius - 3) / 100, 0.261);
  disc(
    0.018,
    0.008,
    black,
    g.pro ? flashX + 0.1 : g.lenses[0][0] / 100 - 1.4,
    h / 2 - (g.pro ? 21 + g.cameraHeight / 2 + 17 : 21 + g.cameraHeight - 16) / 100,
    0.26,
  );
  // Side controls and antenna seams make depth legible at three-quarter angles.
  box(0.075, 0.55, 0.15, 0.035, shell, -1.387, 0.45, -0.015);
  box(0.075, 0.32, 0.15, 0.03, shell, 1.387, 0.72, -0.015);
  box(0.075, 0.32, 0.15, 0.03, shell, 1.387, 0.28, -0.015);
  box(0.073, profile.actionButton ? 0.23 : 0.15, 0.13, 0.025, metal, 1.388, 1.24, -0.015);
  if (!profile.actionButton)
    box(
      0.08,
      0.08,
      0.035,
      0.012,
      new THREE.MeshBasicMaterial({ color: '#b2663c' }),
      1.395,
      1.24,
      0.015,
    );
  if (profile.cameraControl) {
    box(0.079, 0.47, 0.18, 0.03, metal, -1.387, -1.13, -0.015);
    box(0.082, 0.36, 0.1, 0.024, black, -1.395, -1.13, -0.015);
  }
  for (const side of [-1, 1])
    for (const y of [h / 2 - 0.6, -h / 2 + 0.6])
      box(
        0.018,
        0.022,
        0.25,
        0.004,
        new THREE.MeshStandardMaterial({ color: '#717570', roughness: 0.7 }),
        side * 1.352,
        y,
        -0.03,
      );
  const screen = box(
    2.54,
    h - 0.24,
    0.022,
    0.01,
    new THREE.MeshPhysicalMaterial({
      color: '#10171b',
      roughness: 0.16,
      metalness: 0.1,
      clearcoat: 1,
    }),
    0,
    0,
    -0.225,
  );
  screen.geometry.dispose();
  screen.geometry = new THREE.ExtrudeGeometry(
    roundedPath(new THREE.Shape(), -1.27, -h / 2 + 0.12, 2.54, h - 0.24, 0.32),
    { depth: 0.014, bevelEnabled: false, curveSegments: 20 },
  );
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 1024;
  const ctx = screenCanvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, '#101b21');
  grad.addColorStop(0.48, '#526d67');
  grad.addColorStop(1, '#172525');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);
  ctx.strokeStyle = '#c3d6c02b';
  ctx.lineWidth = 70;
  ctx.beginPath();
  ctx.ellipse(280, 620, 195, 430, 0.6, 0, Math.PI * 2);
  ctx.stroke();
  const frontTexture = new THREE.CanvasTexture(screenCanvas);
  frontTexture.colorSpace = THREE.SRGBColorSpace;
  const frontShape = new THREE.ShapeGeometry(
    roundedPath(new THREE.Shape(), -1.24, -h / 2 + 0.15, 2.48, h - 0.3, 0.3),
    20,
  );
  const p = frontShape.attributes.position,
    uvs = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uvs[i * 2] = 1 - (p.getX(i) + 1.24) / 2.48;
    uvs[i * 2 + 1] = (p.getY(i) + h / 2 - 0.15) / (h - 0.3);
  }
  frontShape.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  const front = new THREE.Mesh(
    frontShape,
    new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      roughness: 0.23,
      metalness: 0,
      clearcoat: 1,
      side: THREE.DoubleSide,
    }),
  );
  front.position.z = -0.245;
  model.add(front);
  const notch = profile.front === 'notch';
  const sensor = box(
    notch ? 0.98 : 0.71,
    notch ? 0.24 : 0.19,
    0.025,
    0.012,
    black,
    0,
    h / 2 - (notch ? 0.25 : 0.36),
    -0.229,
  );
  sensor.geometry.dispose();
  sensor.geometry = new THREE.ExtrudeGeometry(
    roundedPath(
      new THREE.Shape(),
      notch ? -0.49 : -0.355,
      notch ? -0.12 : -0.095,
      notch ? 0.98 : 0.71,
      notch ? 0.24 : 0.19,
      notch ? 0.09 : 0.095,
    ),
    { depth: 0.025, bevelEnabled: false, curveSegments: 20 },
  );
  sensor.position.z = -0.28;
  disc(0.033, 0.006, glass, 0.22, h / 2 - (notch ? 0.27 : 0.36), -0.284);
  box(0.33, 0.016, 0.012, 0.004, metal, 0, h / 2 - 0.145, -0.284);
  box(
    0.75,
    0.027,
    0.025,
    0.008,
    new THREE.MeshBasicMaterial({ color: '#c8d2cc' }),
    0,
    -h / 2 + 0.29,
    -0.28,
  );
  // Speaker perforations and connector along the bottom edge.
  const port = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      profile.port === 'usb-c' ? 0.043 : 0.028,
      profile.port === 'usb-c' ? 0.25 : 0.2,
      4,
      12,
    ),
    black,
  );
  port.rotation.z = Math.PI / 2;
  port.position.set(0, -h / 2 - 0.011, 0);
  model.add(port);
  for (const side of [-1, 1])
    for (let i = 0; i < 5; i++) {
      const speaker = new THREE.Mesh(new THREE.SphereGeometry(0.023, 8, 8), black);
      speaker.position.set(side * (0.45 + i * 0.105), -h / 2 - 0.014, 0);
      model.add(speaker);
    }
  if (calibrated) {
    const size = profile.width / 71.5;
    model.scale.set(size, size, size * (profile.depth / 7.8));
  }
  model.rotation.set(0.1, -0.43, -0.07);
  return model;
}

function disposeModel(model: THREE.Object3D) {
  const materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  model.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material])
        materials.add(material);
    }
  });
  materials.forEach((material) => {
    for (const value of Object.values(material))
      if (value instanceof THREE.Texture) textures.add(value);
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
}

function studio(renderer: THREE.WebGLRenderer) {
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  const scene = new THREE.Scene(),
    pmrem = new THREE.PMREMGenerator(renderer),
    room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.3;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#ffffff', '#687565', 0.45));
  const key = new THREE.DirectionalLight('#fff9ef', 1.8);
  key.position.set(-3, 5, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#d8e9ff', 0.5);
  fill.position.set(4, 1, 3);
  scene.add(fill);
  const frontFill = new THREE.DirectionalLight('#e8f0ff', 0.85);
  frontFill.position.set(1, 3, -5);
  scene.add(frontFill);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  return { scene, camera, env };
}

let snapshotRenderer: THREE.WebGLRenderer | undefined;
let snapshotStudio: ReturnType<typeof studio> | undefined;
const snapshots = new Map<string, string>();
let renderQueue: Promise<unknown> = Promise.resolve();
/** One shared context for all catalogue thumbnails, not one WebGL canvas per card. */
export function renderPhoneSnapshot(design: Design, canvas: HTMLCanvasElement): Promise<string> {
  const key = JSON.stringify(design);
  const cached = snapshots.get(key);
  if (cached) return Promise.resolve(cached);
  const task = renderQueue
    .catch(() => {})
    .then(() => {
      if (!snapshotRenderer) {
        snapshotRenderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        });
        snapshotStudio = studio(snapshotRenderer);
      }
      const renderer = snapshotRenderer,
        { scene, camera } = snapshotStudio!;
      renderer.setSize(480, 800, false);
      camera.aspect = 480 / 800;
      camera.updateProjectionMatrix();
      const model = createPhone(design, canvas);
      scene.add(model);
      try {
        renderer.render(scene, camera);
        const image = renderer.domElement.toDataURL('image/png');
        snapshots.set(key, image);
        if (snapshots.size > 24) snapshots.delete(snapshots.keys().next().value!);
        return image;
      } finally {
        scene.remove(model);
        disposeModel(model);
      }
    });
  renderQueue = task;
  return task;
}

export function mountPhoneViewer(
  container: HTMLDivElement,
  design: Design,
  canvas: HTMLCanvasElement,
) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const { scene, camera, env } = studio(renderer);
  let model = createPhone(design, canvas);
  scene.add(model);
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Vista 3D de la funda. Arrastrá para girar.');
  renderer.domElement.setAttribute('role', 'img');
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = false;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI - 0.25;
  let disposed = false;
  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  controls.addEventListener('change', render);
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.setLength(camera.aspect < 0.68 ? 15 : 14);
    camera.updateProjectionMatrix();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  return {
    update(next: Design, texture: HTMLCanvasElement) {
      scene.remove(model);
      disposeModel(model);
      model = createPhone(next, texture);
      scene.add(model);
      render();
    },
    rotate(delta: number) {
      const offset = camera.position.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), delta);
      camera.position.copy(offset);
      controls.update();
      render();
    },
    reset() {
      camera.position.set(0, 0, camera.aspect < 0.68 ? 15 : 14);
      controls.target.set(0, 0, 0);
      controls.update();
      render();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      disposeModel(model);
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
