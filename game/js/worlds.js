import * as THREE from "three";

export const PAL = {
  sage: 0x7d8b6a,
  sageDeep: 0x4c5840,
  cream: 0xf4f0e4,
  wood: 0x8a6a45,
  skin: 0xf0d2b6,
  hair: 0x3b2a1d,
  shirt: 0x5d6f8a,
  gold: 0xc4a35a,
  sun: 0xe2c36b,
  grass: 0x6f8a55,
  asphalt: 0x4a4e52,
  cabin: 0xd8d2c6,
  night: 0x161b22,
};

export function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...extra,
  });
}

export function addBox(parent, material, w, h, d, x, y, z, colliders, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  if (colliders) {
    colliders.push({
      minx: x - w / 2,
      maxx: x + w / 2,
      minz: z - d / 2,
      maxz: z + d / 2,
    });
  }
  return mesh;
}

export function addMarker(parent, x, y, z, opts = {}) {
  const g = new THREE.Group();
  const tall = !!opts.tall;
  const size = opts.size || (tall ? 0.34 : 0.18);
  const color = opts.color ?? PAL.sun;
  const emissive = opts.emissive ?? 0xffee88;
  const intensity = opts.emissiveIntensity ?? (tall ? 1.4 : 0.85);
  if (tall) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.04, Math.max(0.4, y * 0.82), 8),
      mat(0xc4a35a, { emissive: 0xffcc55, emissiveIntensity: 0.55, roughness: 0.35 })
    );
    pole.position.y = y * 0.4;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.038, 8, 18),
      mat(0xffee88, { emissive: 0xffee88, emissiveIntensity: 1.15, roughness: 0.22 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y - 0.18;
    g.add(pole, ring);
    g.userData.ring = ring;
  }
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(size),
    mat(color, { emissive, emissiveIntensity: intensity, roughness: 0.3 })
  );
  gem.position.y = y;
  g.add(gem);
  g.position.set(x, 0, z);
  g.userData.gem = gem;
  g.userData.baseY = y;
  parent.add(g);
  return g;
}

export function addNameTag(parent, name) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = "rgba(44,51,40,0.72)";
  ctx.roundRect?.(16, 12, 224, 40, 12);
  if (!ctx.roundRect) {
    ctx.fillRect(16, 12, 224, 40);
  } else {
    ctx.beginPath();
    ctx.roundRect(16, 12, 224, 40, 12);
    ctx.fill();
  }
  ctx.fillStyle = "#f7f3e8";
  ctx.font = "28px 'Noto Serif SC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  sprite.position.y = 1.36;
  sprite.scale.set(0.52, 0.14, 1);
  parent.add(sprite);
  return sprite;
}

export function makeSign(text, w = 1.4, h = 0.5) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = "#4c5840";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = "#4c5840";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 46;
  ctx.font = `${size}px 'Noto Serif SC', serif`;
  while (ctx.measureText(text).width > 460 && size > 26) {
    size -= 2;
    ctx.font = `${size}px 'Noto Serif SC', serif`;
  }
  ctx.fillText(text, 256, 80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })
  );
  return mesh;
}

function makeShopSign(title, sub, w = 3.55, h = 1.42) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 420;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, "#8b1e28");
  g.addColorStop(0.55, "#5c1218");
  g.addColorStop(1, "#2e0c10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 420);
  ctx.strokeStyle = "#f0d48a";
  ctx.lineWidth = 22;
  ctx.strokeRect(18, 18, 988, 384);
  ctx.strokeStyle = "#fff3c4";
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 944, 340);
  ctx.fillStyle = "#fff1b8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 118px 'Noto Serif SC', serif";
  ctx.fillText(title, 512, 175);
  ctx.font = "46px 'Noto Serif SC', serif";
  ctx.fillStyle = "#ffe08a";
  ctx.fillText(sub, 512, 300);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: 0xffcc77,
      emissiveIntensity: 0.62,
      roughness: 0.38,
      metalness: 0.22,
      side: THREE.DoubleSide,
    })
  );
}

function casinoShopfront(scene, x, z, colliders) {
  const postH = 3.28;
  addBox(scene, mat(0x3a2018, { roughness: 0.42 }), 0.16, postH, 0.16, x - 1.62, postH / 2, z, colliders);
  addBox(scene, mat(0x3a2018, { roughness: 0.42 }), 0.16, postH, 0.16, x + 1.62, postH / 2, z, colliders);
  addBox(
    scene,
    mat(0xc4a35a, { metalness: 0.5, roughness: 0.28, emissive: 0xaa7722, emissiveIntensity: 0.32 }),
    3.5,
    0.14,
    0.14,
    x,
    postH + 0.04,
    z,
    null
  );
  const board = makeShopSign("钟老板赌坊", "猜大小 · 筹码翻倍");
  board.position.set(x, 2.42, z);
  scene.add(board);
  [-1.62, 1.62].forEach((dx) => {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10),
      mat(0xffd27a, { emissive: 0xffc14d, emissiveIntensity: 1.55, roughness: 0.22 })
    );
    lamp.position.set(x + dx, postH + 0.22, z);
    scene.add(lamp);
  });
  const glow = new THREE.PointLight(0xffc878, 1.55, 12, 2);
  glow.position.set(x, 2.55, z + 0.55);
  scene.add(glow);
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 24),
    mat(0x7a1c24, { emissive: 0xaa5533, emissiveIntensity: 0.35, roughness: 0.5 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(x, 0.04, z + 0.35);
  scene.add(pad);
}

export function createKid({ shirt = PAL.shirt, hair = PAL.hair, skin = PAL.skin, name = "" } = {}) {
  const root = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.2), mat(shirt));
  torso.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(skin));
  head.position.y = 1.08;
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(hair));
  hairM.scale.set(1, 0.7, 1);
  hairM.position.set(0, 1.16, 0);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.1), mat(0xc4a35a));
  pack.position.set(0, 0.74, 0.16);

  const mkLimb = (w, h, d, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.castShadow = true;
    return m;
  };
  const la = mkLimb(0.08, 0.34, 0.08, shirt);
  la.position.set(-0.22, 0.7, 0);
  const ra = mkLimb(0.08, 0.34, 0.08, shirt);
  ra.position.set(0.22, 0.7, 0);
  const ll = mkLimb(0.1, 0.38, 0.1, 0x2c333c);
  ll.position.set(-0.09, 0.22, 0);
  const rl = mkLimb(0.1, 0.38, 0.1, 0x2c333c);
  rl.position.set(0.09, 0.22, 0);

  [torso, head, hairM, pack, la, ra, ll, rl].forEach((m) => {
    m.castShadow = true;
    root.add(m);
  });
  root.userData.limbs = { la, ra, ll, rl };
  if (name) addNameTag(root, name);
  return root;
}

export function createWoman({ shirt = 0xb76e7d, hair = PAL.hair, skin = PAL.skin, name = "" } = {}) {
  const root = new THREE.Group();
  const bodice = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.16), mat(shirt));
  bodice.position.y = 0.86;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.46, 12), mat(shirt));
  skirt.position.y = 0.48;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 12), mat(skin));
  head.position.y = 1.12;
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(hair));
  hairTop.scale.set(1.08, 0.82, 1.1);
  hairTop.position.set(0, 1.22, 0.01);
  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.12), mat(hair));
  hairBack.position.set(0, 0.96, 0.1);
  const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), mat(hair));
  hairL.position.set(-0.15, 0.98, 0.02);
  const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), mat(hair));
  hairR.position.set(0.15, 0.98, 0.02);
  const flower = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0xe8b0c0));
  flower.position.set(0.13, 1.24, 0.1);

  const mkLimb = (w, h, d, color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.castShadow = true;
    return m;
  };
  const la = mkLimb(0.07, 0.32, 0.07, shirt);
  la.position.set(-0.2, 0.82, 0);
  const ra = mkLimb(0.07, 0.32, 0.07, shirt);
  ra.position.set(0.2, 0.82, 0);
  const ll = mkLimb(0.09, 0.22, 0.09, 0x2c333c);
  ll.position.set(-0.08, 0.14, 0);
  const rl = mkLimb(0.09, 0.22, 0.09, 0x2c333c);
  rl.position.set(0.08, 0.14, 0);

  [bodice, skirt, head, hairTop, hairBack, hairL, hairR, flower, la, ra, ll, rl].forEach((m) => {
    m.castShadow = true;
    root.add(m);
  });
  root.userData.limbs = { la, ra, ll, rl };
  if (name) {
    const tag = addNameTag(root, name);
    tag.position.y = 1.48;
    if (name.length >= 4) tag.scale.set(0.68, 0.15, 1);
  }
  return root;
}

function seat(parent, x, z, colliders) {
  addBox(parent, mat(0x3e4a58), 0.48, 0.08, 0.48, x, 0.42, z, colliders);
  addBox(parent, mat(0x3e4a58), 0.48, 0.42, 0.08, x, 0.66, z + 0.2, colliders);
}

export function makePaperBoat() {
  const g = new THREE.Group();
  const paper = mat(0xf7f3e8, { roughness: 0.55 });
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 4), paper);
  hull.rotation.x = Math.PI;
  hull.position.y = 0.06;
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 3), paper);
  sail.position.y = 0.2;
  g.add(hull, sail);
  g.rotation.y = 0.6;
  return g;
}

const STYLE = {};
function paintTex(w, h, paint, repeat = 1) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
function styleTex() {
  if (STYLE.grass) return STYLE;
  STYLE.grass = paintTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#8aa56c";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = i % 3 ? "#7a9a5e" : "#a3b97a";
      ctx.globalAlpha = 0.45;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 4 + Math.random() * 8);
    }
  }, 28);
  STYLE.gingham = paintTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#f3ead8";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d9b7a0";
    for (let i = 0; i < 8; i++) {
      ctx.globalAlpha = 0.35;
      ctx.fillRect(i * 16, 0, 8, h);
      ctx.fillRect(0, i * 16, w, 8);
    }
  }, 4);
  STYLE.linen = paintTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#ece4d4" : "#f7f3ea";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(Math.random() * w, Math.random() * h, 6, 2);
    }
  }, 2);
  return STYLE;
}

function grassFloor(parent, w = 160, d = 180, tint = 0xc5d4a8) {
  const m = new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.96,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  parent.add(ground);
  return ground;
}

function tree(parent, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.16 * scale, 1.1 * scale, 6), mat(PAL.wood));
  trunk.position.y = 0.55 * scale;
  const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.72 * scale, 8, 6), mat(PAL.sageDeep));
  leafA.position.set(0, 1.45 * scale, 0);
  const leafB = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 8, 6), mat(PAL.sage));
  leafB.position.set(0.28 * scale, 1.7 * scale, -0.1 * scale);
  const leafC = new THREE.Mesh(new THREE.SphereGeometry(0.48 * scale, 8, 6), mat(0x6a7d52));
  leafC.position.set(-0.25 * scale, 1.85 * scale, 0.15 * scale);
  g.add(trunk, leafA, leafB, leafC);
  g.position.set(x, 0, z);
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  parent.add(g);
}

function sunflower(parent, x, z, tall = 0.7) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, tall, 5), mat(0x4a7a3a));
  stem.position.set(x, tall / 2, z);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(PAL.sun, { roughness: 0.5 }));
  face.position.set(x, tall + 0.06, z);
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), mat(0x4a3018));
  center.position.set(x, tall + 0.08, z + 0.07);
  parent.add(stem, face, center);
}

function daisy(parent, x, z) {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.32, 4), mat(0x5b7a45));
  stem.position.set(x, 0.16, z);
  const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0xf7f3e8));
  bloom.position.set(x, 0.34, z);
  const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat(PAL.sun));
  yolk.position.set(x, 0.37, z + 0.03);
  parent.add(stem, bloom, yolk);
}

function bloomPatch(parent, x, z, n = 10, spread = 0.9) {
  for (let i = 0; i < n; i++) {
    const ox = (Math.random() - 0.5) * spread;
    const oz = (Math.random() - 0.5) * spread;
    if (i % 3 === 0) sunflower(parent, x + ox, z + oz, 0.45 + Math.random() * 0.25);
    else daisy(parent, x + ox, z + oz);
  }
}

function vineBall(parent, x, y, z, s = 0.35) {
  const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat(PAL.sageDeep));
  leaf.position.set(x, y, z);
  leaf.castShadow = true;
  parent.add(leaf);
}

function woodenChair(parent, x, z, yaw = 0) {
  const g = new THREE.Group();
  const wood = mat(0x8a6238);
  addBox(g, wood, 0.4, 0.05, 0.4, 0, 0.42, 0);
  [
    [-0.16, -0.16],
    [0.16, -0.16],
    [-0.16, 0.16],
    [0.16, 0.16],
  ].forEach(([lx, lz]) => addBox(g, wood, 0.045, 0.42, 0.045, lx, 0.21, lz));
  addBox(g, wood, 0.045, 0.52, 0.045, -0.16, 0.78, -0.17);
  addBox(g, wood, 0.045, 0.52, 0.045, 0.16, 0.78, -0.17);
  addBox(g, wood, 0.38, 0.04, 0.04, 0, 1.02, -0.17);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.03), wood);
  cross.position.set(0, 0.78, -0.17);
  cross.rotation.z = 0.55;
  const cross2 = cross.clone();
  cross2.rotation.z = -0.55;
  g.add(cross, cross2);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  parent.add(g);
  return g;
}

function drapedTable(parent, x, z, w, d, colliders, h = 0.74) {
  addBox(parent, mat(0x7a5530), w * 0.78, h - 0.1, d * 0.78, x, (h - 0.1) / 2, z, colliders);
  const cloth = new THREE.MeshStandardMaterial({ map: styleTex().linen, color: 0xf7f3e8, roughness: 0.92 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, d), cloth);
  top.position.set(x, h, z);
  top.castShadow = true;
  parent.add(top);
  const drop = 0.42;
  [
    [w, drop, 0.045, 0, h - drop / 2, d / 2],
    [w, drop, 0.045, 0, h - drop / 2, -d / 2],
    [0.045, drop, d, -w / 2, h - drop / 2, 0],
    [0.045, drop, d, w / 2, h - drop / 2, 0],
  ].forEach(([bw, bh, bd, ox, oy, oz]) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), cloth);
    side.position.set(x + ox, oy, z + oz);
    parent.add(side);
  });
}

function crate(parent, x, y, z, w = 0.7, h = 0.45, d = 0.55) {
  addBox(parent, mat(0x8a6238), w, h, d, x, y, z);
  addBox(parent, mat(0x6e4c2a), w * 0.92, 0.03, d * 0.92, x, y + h / 2 + 0.02, z);
}

function giftBox(parent, x, y, z, color = 0xf4efe6) {
  addBox(parent, mat(color), 0.22, 0.18, 0.22, x, y, z);
  addBox(parent, mat(PAL.sage), 0.23, 0.03, 0.06, x, y + 0.1, z);
  addBox(parent, mat(PAL.sage), 0.06, 0.03, 0.23, x, y + 0.1, z);
}

function easelSign(parent, text, x, y, z, yaw = 0, w = 1.15, h = 0.7) {
  const board = makeSign(text, w, h);
  board.position.set(x, y, z);
  board.rotation.y = yaw;
  parent.add(board);
  const ox = Math.sin(yaw) * 0.04;
  const oz = Math.cos(yaw) * 0.04;
  addBox(parent, mat(0x6e4c2a), 0.05, y, 0.05, x - w * 0.28 + ox, y / 2, z + oz);
  addBox(parent, mat(0x6e4c2a), 0.05, y, 0.05, x + w * 0.28 + ox, y / 2, z + oz);
}

const GATE = { x: 0, z: 22 };
function yawToGate(x, z) {
  return Math.atan2(GATE.x - x, GATE.z - z);
}
function faceGuests(obj) {
  obj.rotation.y = yawToGate(obj.position.x, obj.position.z) + Math.PI;
}

function teddy(parent, x, z, yaw = 0) {
  const g = new THREE.Group();
  const fur = mat(0xb8895a);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), fur);
  body.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), fur);
  head.position.y = 0.4;
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), fur);
    ear.position.set(s * 0.09, 0.48, 0);
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), fur);
    arm.position.set(s * 0.16, 0.2, 0);
    g.add(ear, arm);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat(0x4a3018));
  nose.position.set(0, 0.38, 0.1);
  g.add(body, head, nose);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  parent.add(g);
}

function bunny(parent, x, z) {
  const g = new THREE.Group();
  const fur = mat(0xf4efe6);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), fur);
  body.position.y = 0.18;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), fur);
  head.position.y = 0.36;
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 6), fur);
    ear.position.set(s * 0.05, 0.5, 0);
    g.add(ear);
  });
  g.add(body, head);
  g.position.set(x, 0, z);
  parent.add(g);
}

function cameraTripod(parent, x, z, yaw = 0.4) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.05, 5), mat(0x3a2a1c));
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.18, 0.52, Math.sin(a) * 0.18);
    leg.rotation.z = Math.cos(a) * 0.18;
    g.add(leg);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.16), mat(0x2a241c));
  body.position.y = 1.08;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 10), mat(0x1a1a1a));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 1.08, 0.12);
  g.add(body, lens);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  parent.add(g);
}

function polaroidCard(parent, x, y, z, yaw = 0, color = 0xc9d6b8) {
  addBox(parent, mat(0xf7f3e8), 0.18, 0.22, 0.012, x, y, z);
  addBox(parent, mat(color), 0.14, 0.14, 0.013, x, y + 0.02, z + 0.002);
  const mesh = parent.children[parent.children.length - 1];
  if (mesh) mesh.rotation.y = yaw;
}

function cakeStand(parent, x, z, layers, cakeColor) {
  let y = 0.78;
  for (let i = 0; i < layers; i++) {
    const r = 0.28 - i * 0.05;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.04, r + 0.04, 0.03, 16), mat(0xf4efe6));
    plate.position.set(x, y, z);
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.96, 0.12, 14), mat(cakeColor));
    cake.position.set(x, y + 0.075, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), mat(0xd8c9a3));
    stem.position.set(x, y - 0.05, z);
    parent.add(plate, cake, stem);
    y += 0.22;
  }
}

function breakfastSpread(parent, cx, cz, y = 0.76) {
  const porcelain = mat(0xf7f3e8, { roughness: 0.32 });
  const add = (...meshes) => {
    meshes.forEach((m) => {
      m.castShadow = true;
      parent.add(m);
    });
  };
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.02, 18), porcelain);
  plate.position.set(cx - 0.42, y, cz + 0.08);
  const croiss = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.032, 8, 14, Math.PI * 1.25),
    mat(0xe2b07a, { roughness: 0.7 })
  );
  croiss.rotation.set(Math.PI / 2.2, 0.4, 0.2);
  croiss.position.set(cx - 0.42, y + 0.045, cz + 0.08);
  addBox(parent, mat(0xedc98a), 0.11, 0.018, 0.11, cx - 0.18, y + 0.015, cz + 0.22);
  addBox(parent, mat(0xd4a05a), 0.11, 0.018, 0.11, cx - 0.16, y + 0.035, cz + 0.2);
  const jam = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.07, 10), mat(0xb56b6b));
  jam.position.set(cx + 0.02, y + 0.04, cz + 0.24);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 10), mat(PAL.gold));
  lid.position.set(cx + 0.02, y + 0.08, cz + 0.24);
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    porcelain
  );
  bowl.position.set(cx + 0.48, y + 0.01, cz + 0.05);
  const orange = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(0xe6a04a));
  orange.position.set(cx + 0.44, y + 0.09, cz + 0.02);
  const apple = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), mat(0xc45c4a));
  apple.position.set(cx + 0.52, y + 0.09, cz + 0.08);
  const grape = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), mat(0x6b4f8a));
  grape.position.set(cx + 0.48, y + 0.08, cz - 0.04);
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16), porcelain);
  saucer.position.set(cx + 0.22, y, cz - 0.18);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.07, 12), porcelain);
  cup.position.set(cx + 0.22, y + 0.045, cz - 0.18);
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 10), mat(0x4a3018));
  coffee.position.set(cx + 0.22, y + 0.078, cz - 0.18);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 6, 10, Math.PI), mat(0xf7f3e8));
  handle.position.set(cx + 0.27, y + 0.045, cz - 0.18);
  handle.rotation.y = Math.PI / 2;
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), porcelain);
  pot.position.set(cx - 0.02, y + 0.08, cz - 0.22);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.1, 8), porcelain);
  spout.rotation.z = -0.7;
  spout.position.set(cx + 0.08, y + 0.09, cz - 0.22);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat(0xf4efe6));
  bun.scale.set(1, 0.7, 1);
  bun.position.set(cx - 0.55, y + 0.05, cz - 0.12);
  const napkin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.01, 0.16), mat(0xe8d9b0));
  napkin.position.set(cx - 0.55, y + 0.008, cz - 0.12);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.16, 6), mat(0x4a7a3a));
  stem.position.set(cx + 0.55, y + 0.1, cz - 0.22);
  const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(PAL.sun));
  bloom.position.set(cx + 0.55, y + 0.2, cz - 0.22);
  add(plate, croiss, jam, lid, bowl, orange, apple, grape, saucer, cup, coffee, handle, pot, spout, bun, napkin, stem, bloom);
}

function ringPole(parent, x, z) {
  addBox(parent, mat(0x6e4c2a), 0.06, 0.08, 0.06, x, 0.04, z);
  addBox(parent, mat(PAL.wood), 0.04, 0.85, 0.04, x, 0.46, z);
}

function badmintonNet(parent, x, z) {
  addBox(parent, mat(PAL.wood), 0.06, 1.15, 0.06, x - 0.85, 0.58, z);
  addBox(parent, mat(PAL.wood), 0.06, 1.15, 0.06, x + 0.85, 0.58, z);
  const net = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf7f3e8, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  net.position.set(x, 0.75, z);
  parent.add(net);
}

function dinnerEntrance(parent, x, z, colliders) {
  addBox(parent, mat(PAL.wood), 0.14, 2.65, 0.14, x - 1.55, 1.32, z, colliders);
  addBox(parent, mat(PAL.wood), 0.14, 2.65, 0.14, x + 1.55, 1.32, z, colliders);
  addBox(parent, mat(PAL.wood), 3.4, 0.14, 0.16, x, 2.72, z, null);
  lantern(parent, x - 1.55, 2.38, z + 0.12);
  lantern(parent, x + 1.55, 2.38, z + 0.12);
  lantern(parent, x, 2.55, z + 0.08);
  const sign = makeSign("月光晚宴入口", 1.85, 0.42);
  sign.position.set(x, 2.18, z + 0.1);
  parent.add(sign);
}

function welcomeArch(parent, x, z) {
  addBox(parent, mat(PAL.wood), 0.1, 2.5, 0.1, x - 1.45, 1.25, z);
  addBox(parent, mat(PAL.wood), 0.1, 2.5, 0.1, x + 1.45, 1.25, z);
  addBox(parent, mat(PAL.wood), 3.1, 0.1, 0.1, x, 2.52, z);
  const cloth = mat(0xf4efe6, { side: THREE.DoubleSide, roughness: 0.95, transparent: true, opacity: 0.86 });
  [-1, 1].forEach((s) => {
    const drape = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.1), cloth);
    drape.position.set(x + s * 0.85, 1.2, z + 0.04);
    drape.rotation.y = s * 0.12;
    parent.add(drape);
  });
  const sign = makeSign("Welcome to Love Land", 1.5, 0.32);
  sign.position.set(x, 2.15, z + 0.08);
  parent.add(sign);
  bloomPatch(parent, x - 1.5, z + 0.2, 8, 0.7);
  bloomPatch(parent, x + 1.5, z + 0.2, 8, 0.7);
}

function loveBoat(parent, x, z) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.85, 5.6), mat(0x7a4e2e));
  hull.position.y = 0.42;
  const rib = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 5.7), mat(0x8b5a32));
  rib.position.y = 0.82;
  const bow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.1), mat(0x6e4324));
  bow.position.set(0, 0.4, -2.9);
  g.add(hull, rib, bow);
  [-0.7, 0.85].forEach((mz, i) => {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 4.3 - i * 0.4, 8), mat(0x5a3a22));
    mast.position.set(0, 2.4 - i * 0.15, mz);
    const sail = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7 - i * 0.15, 3.2 - i * 0.35),
      mat(0xf7f3e8, { side: THREE.DoubleSide, roughness: 0.92 })
    );
    sail.position.set(0.12, 2.15 - i * 0.1, mz + 0.05);
    sail.rotation.y = 0.18;
    g.add(mast, sail);
  });
  vineBall(g, 0.1, 2.9, -0.5, 0.38);
  vineBall(g, -0.2, 2.4, 0.7, 0.28);
  vineBall(g, 0.25, 1.3, -2.4, 0.32);
  for (let i = 0; i < 10; i++) daisy(g, (i % 2 ? 0.35 : -0.4), -2.1 + i * 0.12);
  g.position.set(x, 0, z);
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  parent.add(g);
}

function lantern(parent, x, y, z) {
  addBox(parent, mat(0x4a3020), 0.16, 0.22, 0.16, x, y, z);
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.14, 0.12),
    mat(0xf2d48a, { emissive: 0xe8c56a, emissiveIntensity: 0.7 })
  );
  glow.position.set(x, y, z);
  parent.add(glow);
}

export function makeTaxi() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 3.4), mat(0xe6c14a, { metalness: 0.2, roughness: 0.4 }));
  body.position.y = 0.55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.5, 1.7), mat(0x9ec4d8, { transparent: true, opacity: 0.45 }));
  cabin.position.set(0, 1.05, -0.15);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.08, 1.75), mat(0xd4b03c));
  roof.position.set(0, 1.32, -0.15);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.28), mat(0x222222));
  light.position.set(0, 1.46, -0.15);
  [-1, 1].forEach((s) => {
    [
      [0.55, 1.1],
      [0.55, -1.1],
    ].forEach(([y, z]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 10), mat(0x1a1a1a));
      w.rotation.z = Math.PI / 2;
      w.position.set(s * 0.88, y, z);
      g.add(w);
    });
  });
  [body, cabin, roof, light].forEach((m) => {
    m.castShadow = true;
    g.add(m);
  });
  const driver = createKid({ shirt: 0x222222, hair: 0x1a1a1a, name: "司机" });
  driver.scale.setScalar(0.85);
  driver.position.set(0.32, 0.28, -0.55);
  driver.rotation.y = Math.PI;
  g.add(driver);
  g.userData.kind = "taxi";
  return g;
}

function lights(scene, { sunPos = [12, 22, 8], hemi = [0xcfe4f2, 0x8a9a6e] } = {}) {
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], 0.85));
  const sun = new THREE.DirectionalLight(0xfff2d4, 1.35);
  sun.position.set(...sunPos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));
}

export function createAirport() {
  const scene = new THREE.Group();
  const colliders = [];
  const interactives = [];
  lights(scene, { hemi: [0xb9d4ea, 0x6d7a86], sunPos: [8, 18, 6] });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat(PAL.asphalt));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  addBox(scene, mat(PAL.cabin), 3.2, 0.08, 20, 0, 0.04, 2, null);
  addBox(scene, mat(0xc9c3b8), 0.12, 3.0, 20, -1.55, 1.55, 2, colliders);
  addBox(scene, mat(0xc9c3b8), 0.12, 3.0, 20, 1.55, 1.55, 2, colliders);
  addBox(scene, mat(0xb7b1a6), 3.2, 0.1, 20, 0, 3.1, 2, null);
  addBox(scene, mat(0x9aa3ad), 3.2, 3.0, 0.16, 0, 1.55, 12, colliders);
  addBox(scene, mat(0x9aa3ad), 0.55, 3.0, 0.16, -1.32, 1.55, -8, colliders);
  addBox(scene, mat(0x9aa3ad), 0.55, 3.0, 0.16, 1.32, 1.55, -8, colliders);
  const doorLamp = new THREE.PointLight(0xffe0a0, 2.2, 8);
  doorLamp.position.set(0, 1.6, -7.4);
  scene.add(doorLamp);

  addBox(scene, mat(0xd9d3c6), 1.6, 0.12, 7, 0, 0.02, -12, null);
  addBox(scene, mat(0xb7b3aa), 1.7, 0.18, 2.4, 0, 0.1, -15.2, null);
  addBox(scene, mat(0xd9dde1), 14, 0.16, 2.6, -8.5, 0.9, 1, null);
  addBox(scene, mat(0xd9dde1), 14, 0.16, 2.6, 8.5, 0.9, 1, null);

  for (let i = 0; i < 8; i++) {
    const z = 8 - i * 1.15;
    seat(scene, -0.85, z, colliders);
    seat(scene, 0.85, z, colliders);
    const winL = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.38), mat(0x8ec4e8, { emissive: 0x4a7aa0, emissiveIntensity: 0.35 }));
    winL.position.set(-1.48, 1.35, z);
    winL.rotation.y = Math.PI / 2;
    const winR = winL.clone();
    winR.position.x = 1.48;
    winR.rotation.y = -Math.PI / 2;
    scene.add(winL, winR);
  }

  addBox(scene, mat(0xdde3ea), 18, 8, 1.2, 12, 4, -6, colliders);
  addBox(scene, mat(0xc5ccd4), 1.2, 8, 14, 21, 4, -12, colliders);
  for (let i = 0; i < 5; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), mat(0x7ea8c4, { emissive: 0x335566, emissiveIntensity: 0.2 }));
    w.position.set(12 - i * 2.6, 4.2, -5.35);
    scene.add(w);
  }

  const taxi = makeTaxi();
  taxi.position.set(-3.2, 0, -20);
  taxi.rotation.y = Math.PI * 0.15;
  scene.add(taxi);

  const boat = makePaperBoat();
  boat.position.set(0.72, 0.52, 7.15);
  scene.add(boat);
  const letterMark = addMarker(scene, 0.72, 1.55, 7.15);
  interactives.push({
    id: "letter",
    x: 0.72,
    z: 7.15,
    r: 1.4,
    label: "按 E 拆开纸船",
    marker: letterMark,
  });

  const doorMark = addMarker(scene, 0, 1.7, -8.2);
  doorMark.visible = false;
  interactives.push({
    id: "door",
    x: 0,
    z: -8.2,
    r: 1.6,
    label: "按 E 走下舷梯",
    marker: doorMark,
    locked: true,
    once: true,
  });
  const taxiMark = addMarker(scene, -3.2, 1.9, -20);
  taxiMark.visible = false;
  interactives.push({
    id: "taxi",
    x: -3.2,
    z: -20,
    r: 2.4,
    label: "按 E 坐上出租车",
    marker: taxiMark,
    locked: true,
  });

  return {
    name: "airport",
    scene,
    colliders,
    interactives,
    spawn: new THREE.Vector3(0, 0, 6.35),
    spawnYaw: Math.PI,
    fog: 0xa8bdd0,
    bounds: { minx: -14, maxx: 20, minz: -26, maxz: 12 },
    update(t) {
      interactives.forEach((it) => {
        if (it.marker?.userData.gem) it.marker.userData.gem.position.y = 1.55 + Math.sin(t * 2.4) * 0.12;
      });
    },
  };
}

export function createRide() {
  const scene = new THREE.Group();
  lights(scene, { hemi: [0xffe6c2, 0x6f8a55], sunPos: [20, 16, -10] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(PAL.grass));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 160), mat(0x555a60));
  road.position.set(0, 0.03, -20);
  road.receiveShadow = true;
  scene.add(road);
  for (let i = 0; i < 22; i++) {
    addBox(scene, mat(0xf2f2e8), 0.18, 0.02, 1.6, 0, 0.07, 40 - i * 6, null, false);
  }
  for (let i = 0; i < 18; i++) {
    tree(scene, -8 - Math.random() * 10, 30 - i * 8, 0.8 + Math.random() * 0.6);
    tree(scene, 8 + Math.random() * 12, 28 - i * 8, 0.7 + Math.random() * 0.8);
  }
  for (let i = 0; i < 6; i++) {
    addBox(scene, mat(0xe8e0d2), 4 + (i % 3), 3 + (i % 2), 3, 16 + (i % 2) * 3, 1.6, 20 - i * 18, null);
  }

  const taxi = makeTaxi();
  taxi.position.set(1.2, 0, 36);
  scene.add(taxi);

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.2, 0, 36),
    new THREE.Vector3(1.0, 0, 10),
    new THREE.Vector3(0.6, 0, -20),
    new THREE.Vector3(-0.2, 0, -50),
    new THREE.Vector3(0.4, 0, -78),
  ]);

  return {
    name: "ride",
    scene,
    colliders: [],
    interactives: [],
    spawn: new THREE.Vector3(1.2, 0.55, 35.2),
    spawnYaw: Math.PI,
    taxi,
    path,
    cinematic: true,
    fog: 0xc5d4b8,
    update() {},
  };
}

export function createResort(texVenue) {
  const scene = new THREE.Group();
  const colliders = [];
  const interactives = [];
  lights(scene, { hemi: [0xf0e6c8, 0x6a7d52], sunPos: [14, 20, 10] });

  grassFloor(scene, 160, 180, 0xc5d4a8);

  const road = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 28), mat(0x5a5e64));
  road.position.set(0, 0.03, 22);
  scene.add(road);

  addBox(scene, mat(0xe8e2d4), 14, 0.12, 16, 0, 0.06, 2, null);
  addBox(scene, mat(0xefe8d8), 5.2, 3.2, 0.25, -4.4, 1.7, 10, colliders);
  addBox(scene, mat(0xefe8d8), 5.2, 3.2, 0.25, 4.4, 1.7, 10, colliders);
  addBox(scene, mat(0xe7dfcf), 0.25, 3.2, 16, -7, 1.7, 2, colliders);
  addBox(scene, mat(0xe7dfcf), 0.25, 3.2, 16, 7, 1.7, 2, colliders);
  addBox(scene, mat(0xe7dfcf), 5.2, 3.2, 0.25, -4.4, 1.7, -6, colliders);
  addBox(scene, mat(0xe7dfcf), 5.2, 3.2, 0.25, 4.4, 1.7, -6, colliders);
  addBox(scene, mat(0xd9d0c0), 14.2, 0.2, 16.2, 0, 3.35, 2, null);
  addBox(scene, mat(PAL.wood), 2.6, 1.05, 0.9, 0, 0.6, 3.2, colliders);
  giftBox(scene, -0.55, 1.22, 3.15, 0xf4efe6);
  giftBox(scene, -0.28, 1.22, 3.25, 0xe8d9b0);
  lantern(scene, 0.85, 1.35, 3.15);

  const clerk = createWoman({ shirt: PAL.sage, hair: 0x4a3020, name: "接待姐姐" });
  clerk.position.set(0.55, 0, 2.05);
  clerk.rotation.y = Math.PI;
  scene.add(clerk);

  for (let i = 0; i < 16; i++) {
    tree(scene, -18 - (i % 4) * 3, 10 - Math.floor(i / 4) * 8, 1);
    tree(scene, 16 + (i % 4) * 3.2, 8 - Math.floor(i / 4) * 7, 0.9);
  }

  const lawnZ = -22;
  for (let i = 0; i < 10; i++) {
    tree(scene, -16.5 - (i % 2) * 2.6, lawnZ + 14 - i * 3.6, 0.95 + (i % 3) * 0.08);
    tree(scene, 16.2 + (i % 2) * 2.5, lawnZ + 13 - i * 3.5, 0.9 + (i % 2) * 0.1);
  }
  for (let i = 0; i < 8; i++) {
    const x = -12 + i * 3.4;
    if (Math.abs(x) < 3.6) continue;
    tree(scene, x, lawnZ - 15.5, 1.02);
  }
  dinnerEntrance(scene, 0, lawnZ - 16, colliders);
  woodenChair(scene, -5.4, lawnZ - 1.4, Math.PI);
  woodenChair(scene, -4.15, lawnZ - 1.05, 0.25);
  woodenChair(scene, -6.55, lawnZ - 0.85, -0.35);
  woodenChair(scene, 3.8, lawnZ + 0.6, 0.4);

  const taxi = makeTaxi();
  taxi.position.set(2.4, 0, 18);
  taxi.rotation.y = -0.2;
  scene.add(taxi);

  const awen = createKid({ shirt: 0xc45c7a, hair: 0x3a2018, name: "阿文" });
  awen.position.set(-0.55, 0, lawnZ + 5.1);
  awen.rotation.y = 0.2;
  const wang = createKid({ shirt: 0xcfc6b8, hair: 0x5a4030, name: "王老师" });
  wang.position.set(0.55, 0, lawnZ + 5.1);
  wang.rotation.y = -0.2;
  scene.add(awen, wang);

  const zhongyi = createKid({ shirt: 0x1f2a38, hair: 0x111111, name: "钟意" });
  zhongyi.position.set(9.2, 0, lawnZ + 8);
  zhongyi.rotation.y = -Math.PI / 2;
  scene.add(zhongyi);
  addBox(scene, mat(PAL.wood), 1.4, 0.7, 1.4, 8.3, 0.35, lawnZ + 8, colliders);
  addBox(scene, mat(0xf2ead2), 0.7, 0.06, 0.7, 8.3, 0.74, lawnZ + 8, null);
  casinoShopfront(scene, 8.3, lawnZ + 6.55, colliders);

  const groups = [
    { at: [-11.5, lawnZ + 7], ids: ["zhou", "hua", "lin"] },
    { at: [11.2, lawnZ + 6], ids: ["chen", "wu", "le"] },
    { at: [-12.5, lawnZ - 4], ids: ["qi", "bei", "wumiao", "tangtang"] },
    { at: [11.5, lawnZ - 3], ids: ["he", "xiaozhou", "min"] },
    { at: [-8.5, lawnZ + 1], ids: ["pai", "lv"] },
  ];
  const guestMap = Object.fromEntries((window.GAME_DATA?.guests || []).map((g) => [g.id, g]));
  groups.forEach((group) => {
    group.ids.forEach((gid, i) => {
      const info = guestMap[gid] || { shirt: 0x888888, hair: 0x222222 };
      const k = createKid({ shirt: info.shirt, hair: info.hair, name: info.name || "" });
      const ox = (i - 1) * 0.85;
      const oz = (i % 2) * 0.45;
      k.position.set(group.at[0] + ox, 0, group.at[1] + oz);
      k.rotation.y = Math.PI * (0.15 * i + 0.4);
      scene.add(k);
      interactives.push({
        id: "guest",
        guestId: gid,
        x: group.at[0] + ox,
        z: group.at[1] + oz,
        r: 1.5,
        label: `按 E 和${info.name || "宾客"}交谈`,
      });
    });
  });

  const deskMark = addMarker(scene, 0, 1.8, 2.6);
  interactives.push({
    id: "desk",
    x: 0,
    z: 2.6,
    r: 1.8,
    label: "按 E 办理入住",
    marker: deskMark,
  });
  const awenMark = addMarker(scene, 0, 1.85, lawnZ + 5.1);
  awenMark.visible = false;
  interactives.push({
    id: "awen",
    x: 0,
    z: lawnZ + 5.1,
    r: 2.2,
    label: "按 E 找阿文和王老师",
    marker: awenMark,
    locked: true,
  });
  const zyMark = addMarker(scene, 8.5, 3.15, lawnZ + 7.2, { tall: true, size: 0.34, color: 0xc45c4a, emissive: 0xff8866 });
  zyMark.visible = false;
  interactives.push({
    id: "zhongyi",
    x: 8.5,
    z: lawnZ + 8,
    r: 1.8,
    label: "按 E 进钟老板赌坊",
    marker: zyMark,
  });

  const cam = createKid({ shirt: 0x2a2a2a, hair: 0x1a1a1a, name: "阿摄" });
  cam.position.set(6.4, 0, lawnZ + 2);
  cam.rotation.y = -0.6;
  const vid = createKid({ shirt: 0x3a3a48, hair: 0x222222, name: "阿录" });
  vid.position.set(7.1, 0, lawnZ + 2.6);
  vid.rotation.y = -0.9;
  [cam, vid].forEach((who) => {
    who.traverse((o) => {
      if (o.isSprite) {
        o.position.y = 1.58;
        o.scale.set(0.72, 0.19, 1);
      }
    });
  });
  scene.add(cam, vid);
  addBox(scene, mat(0x222222), 0.22, 0.14, 0.28, 6.55, 1.15, lawnZ + 1.7, null);
  cameraTripod(scene, 5.85, lawnZ + 1.55, 0.35);
  const photoPad = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 22),
    mat(0xc4a35a, { emissive: 0xaa8833, emissiveIntensity: 0.28, roughness: 0.55 })
  );
  photoPad.rotation.x = -Math.PI / 2;
  photoPad.position.set(6.75, 0.04, lawnZ + 2.3);
  scene.add(photoPad);
  addBox(scene, mat(PAL.wood), 0.08, 1.85, 0.08, 6.75, 0.92, lawnZ + 1.05, colliders);
  const photoSign = makeSign("摄影摄像 · 阿摄阿录", 2.15, 0.52);
  photoSign.position.set(6.75, 2.08, lawnZ + 1.02);
  scene.add(photoSign);
  addBox(scene, mat(PAL.wood), 0.08, 1.7, 0.08, 3.35, 0.85, -8.15, colliders);
  const waySign = makeSign("→ 右侧找阿摄阿录", 2.05, 0.48);
  waySign.position.set(3.35, 1.88, -8.18);
  scene.add(waySign);
  const photoMark = addMarker(scene, 6.6, 3.25, lawnZ + 2.2, { tall: true, size: 0.36 });
  photoMark.visible = false;
  interactives.push({
    id: "photo",
    x: 6.6,
    z: lawnZ + 2.2,
    r: 2.1,
    label: "按 E 和摄影摄像拍一张",
    marker: photoMark,
  });

  const hideX = -5.4;
  const hideZ = lawnZ - 1.4;
  const hideMark = addMarker(scene, hideX, 1.3, hideZ);
  hideMark.visible = false;
  interactives.push({
    id: "hiddenChip",
    x: hideX,
    z: hideZ,
    r: 1.3,
    label: "按 E 看看凳子下面",
    marker: hideMark,
    locked: true,
  });

  const gateMark = addMarker(scene, 0, 2.95, lawnZ - 16);
  gateMark.visible = false;
  interactives.push({
    id: "dinnerGate",
    x: 0,
    z: lawnZ - 16,
    r: 2.4,
    label: "按 E 从晚宴入口前往月光晚宴",
    marker: gateMark,
    locked: true,
  });

  return {
    name: "resort",
    scene,
    colliders,
    interactives,
    spawn: new THREE.Vector3(0, 0, 16.5),
    lawnSpawn: new THREE.Vector3(0, 0, -16.5),
    spawnYaw: Math.PI,
    fog: 0xd5ddc6,
    bounds: { minx: -22, maxx: 22, minz: -44, maxz: 24 },
    update(t) {
      interactives.forEach((it) => {
        if (it.marker?.visible && it.marker.userData.gem) {
          const base = it.marker.userData.baseY ?? 1.6;
          const bob = it.id === "photo" ? 0.2 : 0.12;
          it.marker.userData.gem.position.y = base + Math.sin(t * 2.2 + 1) * bob;
          if (it.marker.userData.ring) {
            it.marker.userData.ring.rotation.z = t * 1.4;
          }
        }
      });
    },
  };
}

export function createBanquet(texNight) {
  const scene = new THREE.Group();
  const colliders = [];
  const interactives = [];
  const dancers = [];
  lights(scene, { hemi: [0x8899bb, 0x1a2018], sunPos: [-6, 14, 8] });

  grassFloor(scene, 80, 90, 0x4a5a3a);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 24, 18),
    mat(0xf3e6c4, { emissive: 0xe8d9a0, emissiveIntensity: 0.55, roughness: 0.8 })
  );
  moon.position.set(-7.1, 1.65, -14.4);
  scene.add(moon);
  const moonLit = new THREE.PointLight(0xffe6b0, 1.6, 28);
  moonLit.position.copy(moon.position);
  scene.add(moonLit);

  for (let i = 0; i < 12; i++) tree(scene, -14 - (i % 2), -18 + i * 2.4, 1.15);
  for (let i = 0; i < 12; i++) tree(scene, 14 + (i % 2), -18 + i * 2.4, 1.1);

  const cloth = new THREE.MeshStandardMaterial({
    map: styleTex().linen,
    color: 0xf4efe6,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 9; i++) {
    const pleat = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 5.6), cloth);
    pleat.position.set(-6.2 + i * 1.55, 2.9, -16.2);
    scene.add(pleat);
  }
  for (let i = 0; i < 6; i++) {
    const uplight = new THREE.PointLight(0xffe6b0, 0.35, 6);
    uplight.position.set(-5 + i * 2, 0.3, -15.4);
    scene.add(uplight);
  }

  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 12; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        mat(0xffe08a, { emissive: 0xffcc66, emissiveIntensity: 1.1 })
      );
      const t = i / 11;
      bulb.position.set(-7.5 + t * 15, 4.4 - row * 0.55, -7.5 + Math.sin(t * Math.PI) * (2.2 + row * 0.4));
      scene.add(bulb);
    }
  }

  bloomPatch(scene, -6.6, -14.6, 12, 1.2);

  drapedTable(scene, -4.2, -2, 8.6, 1.15, colliders, 0.76);
  drapedTable(scene, 4.2, -2, 8.6, 1.15, colliders, 0.76);
  [-4.2, 4.2].forEach((x) => {
    for (let i = 0; i < 6; i++) {
      woodenChair(scene, x - 3.2 + i * 1.25, -0.95, Math.PI);
      woodenChair(scene, x - 3.2 + i * 1.25, -3.05, 0);
      addBox(scene, mat(0xf7f3e8), 0.22, 0.02, 0.22, x - 3.2 + i * 1.25, 0.8, -2);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 10), mat(0xf4efe6));
      plate.position.set(x - 3.2 + i * 1.25, 0.82, -2);
      scene.add(plate);
      if (i % 2 === 0) sunflower(scene, x - 3.2 + i * 1.25, -2.35, 0.28);
      const empty = x < 0 && i === 2;
      if (empty) continue;
      const g = createKid({
        shirt: [0xb56b6b, 0x6b7eb5, 0xc4a35a, 0x4f8f7b][i % 4],
        hair: 0x2a2018,
        name: ["宾客", "亲友", "同学", "同事", "邻居", "家人"][i % 6],
      });
      g.position.set(x - 3.2 + i * 1.25, 0, i % 2 === 0 ? -0.7 : -3.3);
      g.rotation.y = i % 2 === 0 ? Math.PI : 0;
      scene.add(g);
    }
  });

  drapedTable(scene, 6.4, -10.2, 1.8, 1.8, null, 0.78);
  cakeStand(scene, 6.4, -10.2, 4, 0xf4efe6);

  const qianyi = createKid({ shirt: 0xe8c4d4, hair: 0x3a2018, name: "芊一" });
  qianyi.position.set(-1.1, 0, 8);
  qianyi.rotation.y = Math.PI;
  const keman = createKid({ shirt: 0xc9d6e8, hair: 0x4a3020, name: "珂满" });
  keman.position.set(1.1, 0, 8);
  keman.rotation.y = Math.PI;
  const host = createKid({ shirt: 0x1a1a28, hair: 0x111111, name: "主持人" });
  host.position.set(3.4, 0, -12.2);
  host.rotation.y = 0.4;
  const erjie = createKid({ shirt: 0xd4a0b8, hair: 0x2a1810, name: "二姐" });
  erjie.position.set(0, 0, -11.1);
  erjie.rotation.y = 0;
  scene.add(qianyi, keman, host, erjie);

  const crewColors = [0xb56b6b, 0x6b7eb5, 0xc4a35a, 0x4f8f7b, 0xe2b3c9, 0x5d6f8a, 0xcfc6b8];
  for (let i = 0; i < 7; i++) {
    const d = createKid({
      shirt: crewColors[i],
      hair: 0x2a2018,
      name: ["阿宁", "小周", "阿凯", "阿琪", "阿北", "阿乐", "阿敏"][i],
    });
    const row = i < 4 ? 0 : 1;
    const col = i < 4 ? i : i - 4;
    const count = row === 0 ? 4 : 3;
    d.position.set((col - (count - 1) / 2) * 0.85, 0, -12.15 - row * 0.85);
    d.rotation.y = 0;
    scene.add(d);
    dancers.push(d);
  }
  dancers.unshift(erjie);

  interactives.push({
    id: "ushers",
    x: 0,
    z: 8,
    r: 2,
    label: "按 E 找芊一和珂满领欢迎卡",
  });
  const hostMark = addMarker(scene, 3.4, 1.85, -12.2);
  hostMark.visible = false;
  interactives.push({
    id: "partyHost",
    x: 3.4,
    z: -12.2,
    r: 2.2,
    label: "按 E 找主持人",
    marker: hostMark,
    locked: true,
  });
  const seatPos = { x: -4.2 - 3.2 + 2 * 1.25, z: -0.7 };
  const seatMark = addMarker(scene, seatPos.x, 1.7, seatPos.z);
  seatMark.visible = false;
  interactives.push({
    id: "partySeat",
    x: seatPos.x,
    z: seatPos.z,
    r: 1.5,
    label: "按 E 落座看暖场视频",
    marker: seatMark,
    locked: true,
  });
  const danceMark = addMarker(scene, 0, 1.85, -10.4);
  danceMark.visible = false;
  interactives.push({
    id: "erjie",
    x: 0,
    z: -10.4,
    r: 2,
    label: "按 E 找二姐，决定要不要上台",
    marker: danceMark,
    locked: true,
  });

  return {
    name: "banquet",
    scene,
    colliders,
    interactives,
    dancers,
    spawn: new THREE.Vector3(0, 0, 12),
    spawnYaw: Math.PI,
    fog: 0x1a2230,
    bounds: { minx: -16, maxx: 16, minz: -20, maxz: 16 },
    stageDancing: false,
    update(t) {
      interactives.forEach((it) => {
        if (it.marker?.visible && it.marker.userData.gem) {
          it.marker.userData.gem.position.y = 1.6 + Math.sin(t * 2.2) * 0.12;
        }
      });
      if (!this.stageDancing) return;
      dancers.forEach((d, i) => {
        const sw = Math.sin(t * 8 + i) * 0.7;
        const { la, ra, ll, rl } = d.userData.limbs;
        la.rotation.x = sw;
        ra.rotation.x = -sw;
        ll.rotation.x = -sw * 0.4;
        rl.rotation.x = sw * 0.4;
        d.position.y = Math.abs(Math.sin(t * 8 + i)) * 0.08;
      });
    },
  };
}

export function createHotelMorning() {
  const scene = new THREE.Group();
  const colliders = [];
  const interactives = [];
  lights(scene, { hemi: [0xffe6c8, 0x8a9a6e], sunPos: [10, 16, 6] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0xe8e2d4));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  addBox(scene, mat(0xf4efe6), 10, 3.2, 0.2, 0, 1.6, -6, colliders);
  addBox(scene, mat(0xf4efe6), 0.2, 3.2, 12, -5, 1.6, 0, colliders);
  addBox(scene, mat(0xf4efe6), 0.2, 3.2, 12, 5, 1.6, 0, colliders);
  const windowLite = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.6),
    mat(0xffe6c2, { emissive: 0xffd9a0, emissiveIntensity: 0.45, roughness: 0.4 })
  );
  windowLite.position.set(0, 1.7, -5.88);
  scene.add(windowLite);
  const sunIn = new THREE.PointLight(0xffe6b0, 0.55, 10);
  sunIn.position.set(0, 1.8, -4.5);
  scene.add(sunIn);
  addBox(scene, mat(PAL.wood), 2.4, 0.4, 1.3, -2.2, 0.35, -3.4, colliders);
  woodenChair(scene, 1.55, 0.05, Math.PI);
  drapedTable(scene, 1.6, -1.2, 2.15, 1.15, colliders, 0.72);
  breakfastSpread(scene, 1.6, -1.2, 0.78);
  const clerk = createWoman({ shirt: PAL.sage, hair: 0x4a3020, name: "接待姐姐" });
  clerk.position.set(-2.2, 0, 1.2);
  clerk.rotation.y = 0.4;
  scene.add(clerk);
  const bMark = addMarker(scene, 1.6, 1.55, -1.0);
  interactives.push({
    id: "breakfast",
    x: 1.6,
    z: -1.0,
    r: 1.7,
    label: "按 E 用早餐",
    marker: bMark,
  });
  const outMark = addMarker(scene, 0, 1.7, 5.5);
  outMark.visible = false;
  interactives.push({
    id: "toGarden",
    x: 0,
    z: 5.5,
    r: 1.8,
    label: "按 E 前往游园会",
    marker: outMark,
    locked: true,
  });
  return {
    name: "hotel",
    scene,
    colliders,
    interactives,
    spawn: new THREE.Vector3(0, 0, 3),
    spawnYaw: Math.PI,
    fog: 0xefe8d8,
    bounds: { minx: -4.6, maxx: 4.6, minz: -5.5, maxz: 7 },
    update(t) {
      interactives.forEach((it) => {
        if (it.marker?.visible && it.marker.userData.gem) {
          it.marker.userData.gem.position.y = 1.55 + Math.sin(t * 2) * 0.1;
        }
      });
    },
  };
}

export function createGarden() {
  const scene = new THREE.Group();
  const colliders = [];
  const interactives = [];
  lights(scene, { hemi: [0xf3ead4, 0x6a7d52], sunPos: [12, 18, 8] });
  grassFloor(scene, 160, 180, 0xcfe0b0);
  for (let i = 0; i < 16; i++) {
    tree(scene, -18 - (i % 3) * 3, 12 - Math.floor(i / 3) * 6, 0.95 + (i % 3) * 0.08);
    tree(scene, 18 + (i % 3) * 3, 10 - Math.floor(i / 3) * 6, 0.9);
  }

  const lawnZ = -10;
  loveBoat(scene, 0, lawnZ - 16);
  bloomPatch(scene, -1.6, lawnZ - 13.2, 14, 1.3);
  bloomPatch(scene, 1.6, lawnZ - 13.2, 14, 1.3);
  easelSign(scene, "06 仪式区", 2.4, 0.85, lawnZ - 12.2, yawToGate(2.4, lawnZ - 12.2), 1.1, 0.42);

  const emptySeat = { x: -1.95, z: lawnZ - 4 - 1.12 };
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const lx = -5.4 + col * 1.15;
      const rx = 2.0 + col * 1.15;
      const z = lawnZ - 4 - row * 1.12;
      woodenChair(scene, lx, z, Math.PI);
      woodenChair(scene, rx, z, Math.PI);
      const skipL = Math.abs(lx - emptySeat.x) < 0.15 && Math.abs(z - emptySeat.z) < 0.15;
      const colors = [0xb56b6b, 0x6b7eb5, 0xc4a35a, 0x4f8f7b, 0xe2b3c9, 0x5d6f8a];
      if (!skipL) {
        const g = createKid({ shirt: colors[(row * 4 + col) % colors.length], hair: 0x2a2018 });
        g.position.set(lx, 0, z + 0.18);
        g.rotation.y = Math.PI;
        scene.add(g);
      }
      const g2 = createKid({ shirt: colors[(row * 4 + col + 2) % colors.length], hair: 0x241818 });
      g2.position.set(rx, 0, z + 0.18);
      g2.rotation.y = Math.PI;
      scene.add(g2);
    }
  }
  for (let i = 0; i < 10; i++) {
    daisy(scene, -0.55, lawnZ - 3.2 - i * 0.85);
    daisy(scene, 0.55, lawnZ - 3.2 - i * 0.85);
    if (i % 2 === 0) sunflower(scene, i % 4 === 0 ? -0.9 : 0.9, lawnZ - 3.6 - i * 0.85, 0.5);
  }

  welcomeArch(scene, 0, 22);

  drapedTable(scene, 0, 9.2, 3.5, 1.55, colliders);
  crate(scene, -1.55, 0.28, 9.55, 0.7, 0.5, 0.55);
  giftBox(scene, -0.7, 0.86, 9.35);
  giftBox(scene, -0.42, 0.86, 9.5, 0xe8d9b0);
  giftBox(scene, -0.15, 0.86, 9.28, 0xf4efe6);
  giftBox(scene, 0.2, 0.86, 9.45, 0xdde6c9);
  giftBox(scene, 0.55, 0.86, 9.32);
  lantern(scene, 1.15, 0.95, 9.4);
  bloomPatch(scene, -1.8, 8.6, 7, 0.7);
  easelSign(scene, "01 签到 & 伴手礼", 0, 1.05, 10.05, yawToGate(0, 10.05), 1.6, 0.4);
  const awen = createKid({ shirt: 0xc45c7a, hair: 0x3a2018, name: "阿文" });
  awen.position.set(-0.7, 0, 8.15);
  faceGuests(awen);
  const wang = createKid({ shirt: 0xcfc6b8, hair: 0x5a4030, name: "王老师" });
  wang.position.set(0.7, 0, 8.15);
  faceGuests(wang);
  scene.add(awen, wang);
  const checkMark = addMarker(scene, 0, 1.85, 10.35);
  interactives.push({
    id: "day2check",
    x: 0,
    z: 10.35,
    r: 2.2,
    label: "按 E 找阿文和王老师签到领券",
    marker: checkMark,
  });
  const prizeMark = addMarker(scene, 0, 1.85, 9.5);
  prizeMark.visible = false;
  interactives.push({
    id: "prize",
    x: 0,
    z: 9.5,
    r: 1.8,
    label: "按 E 兑换奖品",
    marker: prizeMark,
  });

  const round = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 20), mat(0xf7f3e8));
  round.position.set(-11, 0.74, 5.15);
  scene.add(round);
  addBox(scene, mat(0x7a5530), 0.7, 0.7, 0.7, -11, 0.35, 5.15, colliders);
  crate(scene, -12.2, 0.32, 4.3, 0.85, 0.6, 0.4);
  const boothBoard = addBox(scene, mat(0x8a6238), 1.35, 1.55, 0.08, -11.1, 1.05, 4.05);
  boothBoard.rotation.y = yawToGate(-11.1, 4.05);
  easelSign(scene, "02 Photo Booth", -9.55, 0.9, 6.35, yawToGate(-9.55, 6.35), 1.35, 0.38);
  cameraTripod(scene, -12.35, 5.7, 0.6);
  addBox(scene, mat(0xf7f3e8), 0.16, 0.2, 0.01, -11.45, 0.95, 5.2);
  addBox(scene, mat(0xc9d6b8), 0.12, 0.12, 0.012, -11.45, 0.97, 5.21);
  addBox(scene, mat(0xf7f3e8), 0.16, 0.2, 0.01, -10.7, 0.95, 5.35);
  addBox(scene, mat(0xe8c9c9), 0.12, 0.12, 0.012, -10.7, 0.97, 5.36);
  bloomPatch(scene, -12.4, 4.1, 6, 0.6);
  interactives.push({
    id: "booth",
    x: -11,
    z: 5.8,
    r: 1.7,
    label: "按 E 和小钟阿旭合影",
    marker: addMarker(scene, -11, 1.7, 5.8),
  });
  interactives[interactives.length - 1].marker.visible = false;

  drapedTable(scene, 11, 3.4, 3.4, 1.55, colliders);
  [
    { id: "beads", name: "串珠 DIY", x: 10.1, z: 3.55, color: 0xe8c9c9 },
    { id: "sachet", name: "香囊 DIY", x: 11.9, z: 3.55, color: 0xd4e8c9 },
    { id: "kids", name: "儿童游乐场", x: 11, z: 2.2, color: 0xf2ead2 },
  ].forEach((b) => {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 8), mat(b.color));
    bottle.position.set(b.x, 0.9, b.z);
    scene.add(bottle);
    interactives.push({
      id: "game",
      gameId: b.id,
      kind: "diy",
      x: b.x,
      z: b.z,
      r: 1.4,
      label: `按 E 参加${b.name}`,
      marker: addMarker(scene, b.x, 1.7, b.z),
    });
    interactives[interactives.length - 1].marker.visible = false;
  });
  easelSign(scene, "03 DIY 区", 11, 0.95, 2.3, yawToGate(11, 2.3), 1.15, 0.4);
  bunny(scene, 12.45, 2.05);
  teddy(scene, 12.85, 2.45, -0.5);

  const picnic = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2.6),
    new THREE.MeshStandardMaterial({ map: styleTex().gingham, roughness: 0.92 })
  );
  picnic.rotation.x = -Math.PI / 2;
  picnic.position.set(10.5, 0.03, -8.2);
  scene.add(picnic);
  easelSign(scene, "04 PLAY", 10.5, 0.95, -6.55, yawToGate(10.5, -6.55), 1.2, 0.4);
  for (let i = 0; i < 5; i++) ringPole(scene, 9.05 + i * 0.22, -7.15);
  [
    { id: "ring", name: "套圈圈", x: 9.2, z: -7.2 },
    { id: "mahjong", name: "谁是雀神", x: 10.5, z: -8.4 },
    { id: "badminton", name: "户外羽毛球", x: 11.8, z: -9.6 },
  ].forEach((b) => {
    interactives.push({
      id: "game",
      gameId: b.id,
      kind: "play",
      x: b.x,
      z: b.z + 0.9,
      r: 1.5,
      label: `按 E 玩${b.name}`,
      marker: addMarker(scene, b.x, 1.7, b.z + 0.9),
    });
    interactives[interactives.length - 1].marker.visible = false;
  });
  badmintonNet(scene, 11.8, -10.35);
  teddy(scene, 9.7, -8.7, 0.4);
  teddy(scene, 10.35, -8.95, -0.2);
  teddy(scene, 11.0, -8.7, 0.6);

  drapedTable(scene, -3.5, -1.5, 2.9, 1.55, colliders);
  cakeStand(scene, -4.25, -1.45, 3, 0xf2d4c8);
  cakeStand(scene, -3.5, -1.55, 4, 0xe8c9c9);
  cakeStand(scene, -2.75, -1.4, 2, 0xf7e6b0);
  bloomPatch(scene, -4.6, -2.3, 8, 0.7);
  easelSign(scene, "05 甜品区", -3.5, 0.95, -2.45, yawToGate(-3.5, -2.45), 1.15, 0.38);
  interactives.push({
    id: "dessert",
    x: -3.5,
    z: -0.6,
    r: 1.7,
    label: "按 E 去甜品区尝尝",
  });

  const seatMark = addMarker(scene, emptySeat.x, 1.7, emptySeat.z);
  seatMark.visible = false;
  interactives.push({
    id: "ceremonySeat",
    x: emptySeat.x,
    z: emptySeat.z,
    r: 1.6,
    label: "按 E 坐下见证仪式",
    marker: seatMark,
  });

  const host = createKid({ shirt: 0x1a1a28, hair: 0x111111, name: "主持人" });
  host.position.set(0, 0, lawnZ - 12.5);
  faceGuests(host);
  const zhong = createKid({ shirt: 0x2c333c, hair: 0x1a1a1a, name: "小钟" });
  const xu = createKid({ shirt: 0xf4efe6, hair: 0x3a2018, name: "阿旭" });
  zhong.position.set(-10.25, 0, 5.55);
  xu.position.set(-9.45, 0, 5.85);
  faceGuests(zhong);
  faceGuests(xu);
  scene.add(host, zhong, xu);

  const lunchMark = addMarker(scene, 0, 1.7, 4);
  lunchMark.visible = false;
  interactives.push({
    id: "lunch",
    x: 0,
    z: 4,
    r: 1.8,
    label: "按 E 前往室内圆桌午宴",
    locked: true,
    marker: lunchMark,
  });

  return {
    name: "garden",
    scene,
    colliders,
    interactives,
    spawn: new THREE.Vector3(0, 0, 11.6),
    ceremonySpawn: new THREE.Vector3(emptySeat.x, 0, emptySeat.z + 2.2),
    spawnYaw: Math.PI,
    fog: 0xd7e2c6,
    bounds: { minx: -20, maxx: 20, minz: -32, maxz: 24 },
    couple: { zhong, xu, host },
    coupleWalk: null,
    update(t) {
      interactives.forEach((it) => {
        if (it.marker?.visible && it.marker.userData.gem) {
          it.marker.userData.gem.position.y = 1.55 + Math.sin(t * 2) * 0.1;
        }
      });
    },
  };
}
export function createDiningHall(texRoom, texSeats) {
  const scene = new THREE.Group();
  const colliders = [];
  const interactives = [];
  scene.add(new THREE.HemisphereLight(0xfff4e4, 0xd4c6ae, 1.25));
  scene.add(new THREE.AmbientLight(0xffe9cc, 0.85));
  const key = new THREE.DirectionalLight(0xfff7ea, 1.2);
  key.position.set(8, 16, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 50;
  key.shadow.camera.left = -18;
  key.shadow.camera.right = 18;
  key.shadow.camera.top = 18;
  key.shadow.camera.bottom = -18;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xfffaf2, 0.55);
  fill.position.set(-10, 12, 4);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 32),
    mat(0xd9d0c2, { roughness: 0.38, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  addBox(scene, mat(0xf3ead8), 0.28, 4.2, 28, -12.2, 2.1, 0, colliders);
  addBox(scene, mat(0xf3ead8), 0.28, 4.2, 8, 12.2, 2.1, -10, colliders);
  addBox(scene, mat(0xf3ead8), 0.28, 4.2, 8, 12.2, 2.1, 10, colliders);
  addBox(scene, mat(0xeadfcb), 24.6, 4.2, 0.28, 0, 2.1, -14.4, colliders);
  addBox(scene, mat(0xeadfcb), 9, 4.2, 0.28, -7.6, 2.1, 13.6, colliders);
  addBox(scene, mat(0xeadfcb), 9, 4.2, 0.28, 7.6, 2.1, 13.6, colliders);
  addBox(scene, mat(0xfff6e8), 24.8, 0.12, 28.4, 0, 4.28, 0, null, false);
  addBox(scene, mat(0xc4a35a, { metalness: 0.45, roughness: 0.35 }), 24.8, 0.05, 0.08, 0, 3.55, -14.22, null, false);
  addBox(scene, mat(0xc4a35a, { metalness: 0.45, roughness: 0.35 }), 0.08, 0.05, 28, -12.02, 3.55, 0, null, false);

  if (texRoom) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(12.4, 3.4),
      new THREE.MeshStandardMaterial({
        map: texRoom,
        roughness: 0.35,
        emissive: 0xffe3b0,
        emissiveIntensity: 0.28,
      })
    );
    win.position.set(12.02, 1.85, 0);
    win.rotation.y = -Math.PI / 2;
    scene.add(win);
  }
  addBox(scene, mat(0x6e5a3e), 0.4, 2.6, 4.2, -11.7, 1.4, -4.5, colliders);
  addBox(scene, mat(0x6e5a3e), 0.4, 2.6, 4.2, -11.7, 1.4, 2.2, colliders);

  const tables = [
    { n: 0, title: "0 长长久久", col: 0xe49048, x: 0, z: -9.4, sit: false },
    { n: 1, title: "1 10th", col: 0xc06060, x: -5.4, z: -5.1, sit: false },
    { n: 2, title: "2 你的爱情", col: 0xf090a8, x: 5.4, z: -5.1, sit: false },
    { n: 3, title: "3 闪光的回忆", col: 0xe4cc6c, x: -5.4, z: -0.6, sit: false },
    { n: 4, title: "4 哪里是你的拥抱", col: 0x90e4b4, x: 5.4, z: -0.6, sit: false },
    { n: 5, title: "5 海鸥", col: 0x78b4e4, x: -5.4, z: 3.9, sit: true },
    { n: 6, title: "6 一万次悲伤", col: 0x84a8e4, x: 5.4, z: 3.9, sit: false },
    { n: 7, title: "7 夜空中最亮的星", col: 0x48609c, x: -5.4, z: 8.4, sit: false },
    { n: 8, title: "8 结婚", col: 0xa884f0, x: 5.4, z: 8.4, sit: false },
  ];
  const guestColors = [0xb56b6b, 0x6b7eb5, 0xc4a35a, 0x4f8f7b, 0xe2b3c9, 0x5d6f8a, 0xcfc6b8];

  function coveredChair(x, z, yaw) {
    const g = new THREE.Group();
    addBox(g, mat(0xf4f1ea), 0.42, 0.08, 0.42, 0, 0.46, 0);
    addBox(g, mat(0xf7f4ee), 0.42, 0.72, 0.08, 0, 0.88, -0.18);
    addBox(g, mat(0xd8d0c4), 0.06, 0.46, 0.06, -0.16, 0.23, -0.16);
    addBox(g, mat(0xd8d0c4), 0.06, 0.46, 0.06, 0.16, 0.23, -0.16);
    addBox(g, mat(0xd8d0c4), 0.06, 0.46, 0.06, -0.16, 0.23, 0.16);
    addBox(g, mat(0xd8d0c4), 0.06, 0.46, 0.06, 0.16, 0.23, 0.16);
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    g.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    scene.add(g);
  }

  tables.forEach((t) => {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.02, 0.7, 20), mat(0x8a7358));
    base.position.set(t.x, 0.35, t.z);
    base.castShadow = true;
    scene.add(base);
    colliders.push({ minx: t.x - 1.05, maxx: t.x + 1.05, minz: t.z - 1.05, maxz: t.z + 1.05 });
    const cloth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22, 1.22, 0.05, 24),
      mat(0xf4e6c4, { roughness: 0.42, metalness: 0.12 })
    );
    cloth.position.set(t.x, 0.74, t.z);
    cloth.receiveShadow = true;
    scene.add(cloth);
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.03, 20),
      mat(0xe8f2f6, { transparent: true, opacity: 0.55, roughness: 0.12, metalness: 0.35 })
    );
    glass.position.set(t.x, 0.8, t.z);
    scene.add(glass);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.03, 8, 20),
      mat(t.col, { roughness: 0.28, metalness: 0.4, emissive: t.col, emissiveIntensity: 0.18 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(t.x, 0.84, t.z);
    scene.add(ring);
    const plate = makeSign(t.title, 1.35, 0.32);
    plate.position.set(t.x, 1.12, t.z + 0.02);
    scene.add(plate);

    const emptyA = t.sit ? 0 : -1;
    for (let i = 0; i < 8; i++) {
      if (i === emptyA) continue;
      const a = (i / 8) * Math.PI * 2;
      const cx = t.x + Math.sin(a) * 1.62;
      const cz = t.z + Math.cos(a) * 1.62;
      const yaw = Math.atan2(t.x - cx, t.z - cz);
      coveredChair(cx, cz, yaw);
      if (t.n === 8 && (i === 4 || i === 5)) continue;
      const g = createKid({
        shirt: guestColors[(t.n * 3 + i) % guestColors.length],
        hair: 0x2a2018,
      });
      g.position.set(cx, 0, cz);
      g.rotation.y = yaw;
      scene.add(g);
    }
    if (t.sit) {
      const a = 0;
      const sx = t.x + Math.sin(a) * 1.62;
      const sz = t.z + Math.cos(a) * 1.62;
      coveredChair(sx, sz, Math.atan2(t.x - sx, t.z - sz));
      interactives.push({
        id: "diningSeat",
        table: t.n,
        title: t.title,
        tableX: t.x,
        tableZ: t.z,
        x: sx,
        z: sz,
        r: 1.15,
        label: `按 E 在${t.title}入座`,
      });
    }
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 8),
      mat(0xffe6b0, { emissive: 0xffd089, emissiveIntensity: 1.15, roughness: 0.25 })
    );
    lamp.position.set(t.x, 3.35, t.z);
    scene.add(lamp);
    addBox(scene, mat(0xc4a35a, { metalness: 0.5, roughness: 0.3 }), 0.03, 0.85, 0.03, t.x, 3.85, t.z, null, false);
    const glow = new THREE.PointLight(0xffe1a8, 0.85, 7.5, 2);
    glow.position.set(t.x, 3.2, t.z);
    scene.add(glow);
  });

  const zhong = createKid({ shirt: 0x2c333c, hair: 0x1a1a1a, name: "小钟" });
  const xu = createKid({ shirt: 0xf4efe6, hair: 0x3a2018, name: "阿旭" });
  zhong.position.set(5.4 + Math.sin(Math.PI) * 1.62, 0, 8.4 + Math.cos(Math.PI) * 1.62);
  xu.position.set(5.4 + Math.sin(Math.PI * 0.75) * 1.62, 0, 8.4 + Math.cos(Math.PI * 0.75) * 1.62);
  zhong.rotation.y = Math.atan2(5.4 - zhong.position.x, 8.4 - zhong.position.z);
  xu.rotation.y = Math.atan2(5.4 - xu.position.x, 8.4 - xu.position.z);
  scene.add(zhong, xu);

  if (texSeats) {
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 2.15),
      new THREE.MeshStandardMaterial({ map: texSeats, roughness: 0.7 })
    );
    board.position.set(-2.35, 1.35, 11.35);
    scene.add(board);
    addBox(scene, mat(PAL.wood), 0.08, 1.2, 0.08, -2.7, 0.6, 11.4, null);
    addBox(scene, mat(PAL.wood), 0.08, 1.2, 0.08, -2.0, 0.6, 11.4, null);
  } else {
    easelSign(scene, "座位图", -2.35, 1.2, 11.35, 0, 1.2, 0.4);
  }
  interactives.push({
    id: "seatmap",
    x: -2.35,
    z: 11.35,
    r: 1.6,
    label: "按 E 查看座位图",
  });

  const byeMark = addMarker(scene, 5.4, 1.85, 9.6);
  byeMark.visible = false;
  interactives.push({
    id: "diningBye",
    x: 5.4,
    z: 8.9,
    r: 2.1,
    label: "按 E 和小钟阿旭告别",
    marker: byeMark,
    locked: true,
  });

  return {
    name: "dining",
    scene,
    colliders,
    interactives,
    spawn: new THREE.Vector3(0, 0, 12.2),
    spawnYaw: Math.PI,
    fog: 0xeee4d4,
    bounds: { minx: -11.6, maxx: 11.6, minz: -13.8, maxz: 13.2 },
    update(t) {
      interactives.forEach((it) => {
        if (it.marker?.visible && it.marker.userData.gem) {
          it.marker.userData.gem.position.y = 1.6 + Math.sin(t * 2.2) * 0.12;
        }
      });
    },
  };
}
export function blocked(colliders, x, z, r = 0.32, bounds) {
  if (bounds) {
    if (x < bounds.minx + r || x > bounds.maxx - r || z < bounds.minz + r || z > bounds.maxz - r) return true;
  }
  for (const c of colliders) {
    if (x + r > c.minx && x - r < c.maxx && z + r > c.minz && z - r < c.maxz) return true;
  }
  return false;
}
