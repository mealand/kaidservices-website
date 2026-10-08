/**
 * Hero WebGL scene — a twisting tower assembling floor by floor beside a working
 * tower crane, set on a blueprint grid within a faint wireframe district.
 * Everything is procedural line geometry: no textures or models to download.
 */
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Fog,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  ShapeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';

const FLOORS = 24;
const FLOOR_H = 1;
const SLAB_T = 0.12;
const TWIST = 0.026;
const BUILD_SECONDS = 9;

const C = {
  bg: 0x0a0c0f,
  active: new Color(0xff6a13),
  built: new Color(0xa9c6dc),
  dim: 0x1d2a37,
  context: 0x2c3b4b,
  fill: 0x0f1a26,
  dust: 0x8fb8d6,
  warm: 0xffb35c,
};

const STATUSES = [
  [0, 'Mobilising'],
  [0.04, 'Foundations'],
  [0.12, 'Frame'],
  [0.55, 'Envelope'],
  [0.86, 'Commissioning'],
  [1, 'Handover ready'],
];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function lineGeometry(positions) {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return g;
}

/** Chamfered rectangle footprint for the tower (x/z plane). */
function footprint(w = 3.2, d = 2.4, c = 0.75) {
  return [
    [-w + c, -d], [w - c, -d], [w, -d + c], [w, d - c],
    [w - c, d], [-w + c, d], [-w, d - c], [-w, -d + c],
  ];
}

/** Points spaced along a closed polygon, `step` apart. */
function samplePerimeter(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

function boxEdges(out, x, y, z, w, h, d) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y0 = y, y1 = y + h;
  const v = [
    [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
    [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
  ];
  const e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (const [a, b] of e) out.push(...v[a], ...v[b]);
}

/* ------------------------------------------------------------------ */

function buildTower() {
  const pts = footprint();
  const shape = new Shape(pts.map(([x, z]) => ({ x, y: z })));
  const slabGeo = new ExtrudeGeometry(shape, { depth: SLAB_T, bevelEnabled: false });
  slabGeo.rotateX(-Math.PI / 2);
  const slabEdgeGeo = new EdgesGeometry(slabGeo);

  // Structural columns: footprint corners + a central core.
  const colPos = [];
  const colH = FLOOR_H - SLAB_T;
  for (const [x, z] of pts) colPos.push(x, 0, -z, x, colH, -z);
  for (const [x, z] of [[-0.8, -0.6], [0.8, -0.6], [0.8, 0.6], [-0.8, 0.6]]) colPos.push(x, 0, z, x, colH, z);
  // Core cross-bracing
  colPos.push(-0.8, 0, -0.6, 0.8, colH, -0.6, 0.8, 0, 0.6, -0.8, colH, 0.6);
  const colGeo = lineGeometry(colPos);

  // Facade mullions (lighter, appear with the envelope).
  const mulPos = [];
  for (const [x, z] of samplePerimeter(pts, 0.5)) mulPos.push(x * 1.01, 0, -z * 1.01, x * 1.01, colH, -z * 1.01);
  const mulGeo = lineGeometry(mulPos);

  // Lit windows.
  const winPos = [];
  for (const [x, z] of samplePerimeter(pts, 0.5)) {
    if (Math.random() < 0.22) winPos.push(x * 1.02, colH * (0.35 + Math.random() * 0.3), -z * 1.02);
  }
  const winGeo = lineGeometry(winPos);

  const tower = new Group();
  const floors = [];

  for (let i = 0; i < FLOORS; i++) {
    const floor = new Group();
    floor.position.y = i * FLOOR_H;
    floor.rotation.y = i * TWIST;

    const slabMat = new LineBasicMaterial({ color: C.active.clone(), transparent: true, opacity: 0 });
    const fillMat = new MeshBasicMaterial({ color: C.fill, transparent: true, opacity: 0, depthWrite: false });
    const colMat = new LineBasicMaterial({ color: C.active.clone(), transparent: true, opacity: 0 });
    const mulMat = new LineBasicMaterial({ color: C.built, transparent: true, opacity: 0 });
    const winMat = new PointsMaterial({ color: C.warm, size: 0.09, transparent: true, opacity: 0, depthWrite: false });

    const slab = new Group();
    slab.add(new Mesh(slabGeo, fillMat), new LineSegments(slabEdgeGeo, slabMat));
    const frame = new Group();
    frame.position.y = SLAB_T;
    frame.add(new LineSegments(colGeo, colMat), new LineSegments(mulGeo, mulMat), new Points(winGeo, winMat));
    frame.scale.y = 0.0001;

    // Glass infill between slabs
    const glass = new Mesh(slabGeo, fillMat);
    glass.position.y = SLAB_T;
    glass.scale.y = colH / SLAB_T;
    frame.add(glass);

    floor.add(slab, frame);
    tower.add(floor);
    floors.push({ floor, slab, frame, slabMat, fillMat, colMat, mulMat, winMat, phase: Math.random() * Math.PI * 2 });
  }

  // Crown: roof parapet, plant screen and mast.
  const crown = new Group();
  crown.position.y = FLOORS * FLOOR_H;
  crown.rotation.y = FLOORS * TWIST;
  const crownPos = [];
  boxEdges(crownPos, 0, 0, 0, 3.4, 1.1, 2.6);
  crownPos.push(0, 1.1, 0, 0, 5.2, 0, -0.25, 1.1, 0, 0, 3.6, 0, 0.25, 1.1, 0, 0, 3.6, 0);
  const crownMat = new LineBasicMaterial({ color: C.built, transparent: true, opacity: 0 });
  crown.add(new LineSegments(lineGeometry(crownPos), crownMat));
  const beacon = new Points(lineGeometry([0, 5.25, 0]), new PointsMaterial({ color: C.active, size: 0.35, transparent: true, opacity: 0 }));
  crown.add(beacon);
  tower.add(crown);

  // Scan ring — the "digital monitoring" sweep.
  const ringPts = pts.map(([x, z]) => new Vector3(x * 1.14, 0, -z * 1.14));
  const ring = new Group();
  const ringLine = new LineLoop(new BufferGeometry().setFromPoints(ringPts), new LineBasicMaterial({ color: C.active, transparent: true, opacity: 0.9 }));
  const ringFill = new Mesh(
    new ShapeGeometry(new Shape(pts.map(([x, z]) => ({ x: x * 1.14, y: z * 1.14 })))).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ color: C.active, transparent: true, opacity: 0.07, blending: AdditiveBlending, depthWrite: false }),
  );
  ring.add(ringLine, ringFill);
  tower.add(ring);

  return { tower, floors, crown, crownMat, beacon, ring, ringLine, ringFill };
}

function buildCrane(height) {
  const crane = new Group();
  const pos = [];
  const s = 0.32;
  // Lattice mast
  for (const [x, z] of [[-s, -s], [s, -s], [s, s], [-s, s]]) pos.push(x, 0, z, x, height, z);
  for (let y = 0, k = 0; y < height; y += 0.7, k++) {
    const y1 = Math.min(height, y + 0.7);
    const a = k % 2 ? -s : s;
    pos.push(-s, y, a, s, y1, -a); // zig-zag front/back
    pos.push(a, y, -s, -a, y1, s);
    pos.push(-s, y, -s, s, y, -s, s, y, -s, s, y, s); // ring ties
  }
  crane.add(new LineSegments(lineGeometry(pos), new LineBasicMaterial({ color: C.built, transparent: true, opacity: 0.55 })));

  // Slewing head: jib, counter-jib, apex and pendants.
  const head = new Group();
  head.position.y = height;
  const hp = [];
  const jib = 14, cj = 4.5, jh = 0.55;
  hp.push(-cj, 0, -s, jib, 0, -s, -cj, 0, s, jib, 0, s); // bottom chords
  hp.push(-cj, jh, 0, jib, jh * 0.4, 0); // top chord
  for (let x = -cj; x < jib; x += 0.8) {
    const t = (x + cj) / (jib + cj);
    const top = jh - t * jh * 0.6;
    hp.push(x, 0, -s, x + 0.4, top, 0, x + 0.4, top, 0, x + 0.8, 0, s);
  }
  hp.push(0, 0, 0, 0, 3, 0); // apex
  hp.push(0, 3, 0, jib * 0.75, jh * 0.5, 0, 0, 3, 0, -cj, jh, 0); // pendants
  boxEdges(hp, -cj + 0.9, -0.9, 0, 1.4, 0.9, 1.1); // counterweight
  boxEdges(hp, 0.9, -0.95, 0.7, 0.9, 0.85, 0.8); // cab
  head.add(new LineSegments(lineGeometry(hp), new LineBasicMaterial({ color: C.built, transparent: true, opacity: 0.75 })));

  // Trolley, hoist rope and hook load
  const trolley = new Group();
  const rope = new LineSegments(lineGeometry([0, 0, 0, 0, -1, 0]), new LineBasicMaterial({ color: C.active, transparent: true, opacity: 0.9 }));
  const loadPos = [];
  boxEdges(loadPos, 0, -0.5, 0, 2.2, 0.35, 0.35);
  const load = new LineSegments(lineGeometry(loadPos), new LineBasicMaterial({ color: C.active }));
  trolley.add(rope, load);
  head.add(trolley);

  crane.add(head);
  return { crane, head, trolley, rope, load };
}

function buildSite() {
  const site = new Group();

  // Ground grid
  const g = [];
  const R = 60;
  for (let v = -R; v <= R; v += 2) g.push(v, 0, -R, v, 0, R, -R, 0, v, R, 0, v);
  site.add(new LineSegments(lineGeometry(g), new LineBasicMaterial({ color: C.dim, transparent: true, opacity: 0.7 })));

  // Site boundary with corner ticks
  const b = [];
  const bw = 7.5, bd = 6;
  b.push(-bw, 0.01, -bd, bw, 0.01, -bd, bw, 0.01, -bd, bw, 0.01, bd, bw, 0.01, bd, -bw, 0.01, bd, -bw, 0.01, bd, -bw, 0.01, -bd);
  for (const [x, z] of [[-bw, -bd], [bw, -bd], [bw, bd], [-bw, bd]]) b.push(x, 0, z, x, 1.2, z);
  site.add(new LineSegments(lineGeometry(b), new LineBasicMaterial({ color: C.active, transparent: true, opacity: 0.45 })));

  // Context district
  const ctx = [];
  const lights = [];
  let n = 0;
  while (n < 70) {
    const x = (Math.random() - 0.5) * 90;
    const z = (Math.random() - 0.5) * 90 - 10;
    if (Math.abs(x) < 11 && Math.abs(z) < 9) continue;
    const w = 2 + Math.random() * 4;
    const d = 2 + Math.random() * 4;
    const h = 0.8 + Math.random() * Math.random() * 10;
    boxEdges(ctx, x, 0, z, w, h, d);
    for (let k = 0; k < 3; k++) if (Math.random() < 0.6) lights.push(x + (Math.random() - 0.5) * w, Math.random() * h, z + d / 2 + 0.02);
    n++;
  }
  site.add(new LineSegments(lineGeometry(ctx), new LineBasicMaterial({ color: C.context, transparent: true, opacity: 0.55 })));
  site.add(new Points(lineGeometry(lights), new PointsMaterial({ color: C.warm, size: 0.12, transparent: true, opacity: 0.5 })));

  // Drifting dust
  const dust = [];
  for (let i = 0; i < 520; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 18;
    dust.push(Math.cos(a) * r, Math.random() * 32, Math.sin(a) * r);
  }
  const dustPts = new Points(lineGeometry(dust), new PointsMaterial({ color: C.dust, size: 0.06, transparent: true, opacity: 0.55, depthWrite: false }));
  site.add(dustPts);

  return { site, dustPts };
}

/* ------------------------------------------------------------------ */

export function createTowerScene(canvas, { reducedMotion = false, onProgress } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(C.bg, 0);

  const scene = new Scene();
  scene.fog = new Fog(C.bg, 62, 170);
  const camera = new PerspectiveCamera(34, 1, 0.1, 300);

  const world = new Group();
  scene.add(world);

  const { site, dustPts } = buildSite();
  const t = buildTower();
  const totalH = FLOORS * FLOOR_H;
  const c = buildCrane(totalH + 4);
  c.crane.position.set(5.6, 0, -3.4);
  world.add(site, t.tower, c.crane);

  // ---- State ----
  const state = {
    progress: reducedMotion ? 1 : 0,
    building: false,
    buildStart: 0,
    scroll: 0,
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },
    running: false,
    visible: true,
    lastReport: -1,
    layout: 'wide',
  };

  // ---- Layout ----
  const target = new Vector3();
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    state.layout = w / h > 1.05 ? 'wide' : 'tall';
    if (state.layout === 'wide') camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if (!state.running) render(performance.now());
  }

  // ---- Per-frame update ----
  function updateBuild(p) {
    const f = p * FLOORS;
    for (let i = 0; i < FLOORS; i++) {
      const fl = t.floors[i];
      const local = clamp01(f - i); // 0..1 while this floor is being built
      const age = clamp01((f - i - 1) / 2.5); // 0..1 as the build moves past it

      const slabIn = easeOut(clamp01(local / 0.4));
      fl.slab.position.y = (1 - slabIn) * 1.4;
      fl.slabMat.opacity = slabIn;
      fl.frame.scale.y = Math.max(0.0001, easeOut(clamp01((local - 0.3) / 0.7)));
      fl.colMat.opacity = local > 0.3 ? 1 : 0;

      fl.slabMat.color.copy(C.active).lerp(C.built, age);
      fl.colMat.color.copy(C.active).lerp(C.built, age);
      fl.colMat.opacity = local > 0.3 ? 1 - age * 0.45 : 0;
      fl.fillMat.opacity = age * 0.5;
      fl.mulMat.opacity = age * 0.28;
      fl.winMat.opacity = age * 0.9;
    }
    const top = clamp01((p - 0.97) / 0.03);
    t.crownMat.opacity = top;
    t.beacon.material.opacity = top;
  }

  function reportProgress(p) {
    const pct = Math.floor(p * 100);
    if (pct === state.lastReport || !onProgress) return;
    state.lastReport = pct;
    let status = STATUSES[0][1];
    for (const [at, label] of STATUSES) if (p >= at) status = label;
    onProgress({ level: Math.min(FLOORS, Math.floor(p * FLOORS)), floors: FLOORS, pct, status });
  }

  function render(now) {
    const time = now / 1000;

    if (state.building) {
      const k = clamp01((now - state.buildStart) / (BUILD_SECONDS * 1000));
      state.progress = easeInOut(k);
      if (k >= 1) state.building = false;
    }
    const p = state.progress;
    updateBuild(p);
    reportProgress(p);

    // Crane: slew back and forth, trolley runs, hook bobs.
    const slew = reducedMotion ? 0.9 : 0.9 + Math.sin(time * 0.22) * 0.75;
    c.head.rotation.y = slew;
    const trolleyX = 5.5 + Math.sin(time * 0.35) * 3.5;
    c.trolley.position.x = trolleyX;
    const drop = 6 + Math.sin(time * 0.5) * 3;
    c.rope.geometry.attributes.position.setY(1, -drop);
    c.rope.geometry.attributes.position.needsUpdate = true;
    c.load.position.y = -drop;

    // Scan ring: follows the build front, then sweeps once complete.
    const front = p * totalH;
    const sweep = p >= 1 ? (Math.sin(time * 0.45) * 0.5 + 0.5) * totalH : front;
    t.ring.position.y = sweep;
    t.ring.rotation.y = (sweep / FLOOR_H) * TWIST;
    const ringA = p > 0.01 ? 0.9 : 0;
    t.ringLine.material.opacity = ringA;
    t.ringFill.material.opacity = ringA * 0.08;

    // Beacon blink
    if (p >= 1) t.beacon.material.opacity = Math.sin(time * 4) > 0 ? 1 : 0.15;

    // Dust drift
    dustPts.rotation.y = time * 0.01;
    dustPts.position.y = (time * 0.15) % 2;

    // Camera — slow orbit, mouse parallax, scroll lift.
    const m = state.mouse;
    m.x += (m.tx - m.x) * 0.04;
    m.y += (m.ty - m.y) * 0.04;
    const tall = state.layout === 'tall';
    const radius = (tall ? 84 : 68) + state.scroll * 16;
    const theta = (reducedMotion ? 0.7 : 0.7 + time * 0.035) + m.x * 0.25;
    const phi = MathUtils.degToRad(74 - m.y * 5 - state.scroll * 12);
    target.set(0, (tall ? 17 : 14.5) + state.scroll * 6, 0);
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.cos(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.sin(theta),
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
  }

  // ---- Loop control ----
  let raf = 0;
  const loop = (now) => {
    render(now);
    raf = requestAnimationFrame(loop);
  };
  function play() {
    if (state.running || reducedMotion || !state.visible || document.hidden) return;
    state.running = true;
    raf = requestAnimationFrame(loop);
  }
  function pause() {
    state.running = false;
    cancelAnimationFrame(raf);
  }

  const onPointer = (e) => {
    state.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onVisibility = () => (document.hidden ? pause() : play());
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    state.visible ? play() : pause();
  });
  io.observe(canvas);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  resize();

  return {
    /** Begin the construction sequence. */
    start() {
      if (reducedMotion) {
        render(performance.now());
        return;
      }
      state.building = true;
      state.buildStart = performance.now();
      play();
    },
    /** 0 → 1 as the hero scrolls out of view. */
    setScroll(v) {
      state.scroll = v;
      if (!state.running) render(performance.now());
    },
    destroy() {
      pause();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
    },
  };
}
