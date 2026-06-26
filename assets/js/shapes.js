/* ============================================================
   shapes.js — Floating 3D shapes engine
   A clean, bright, community-led look: glossy candy-coloured 3D
   shapes drift, bob and rotate over a white page. (A deliberate
   departure from the particle engine, which is untouched.)
   ============================================================ */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const gsap = window.gsap;

/* feature-shape tuning */
const FEATURE_SCALE = 3.0;     // how big the promoted shape grows
const AMBIENT_SCALE = 0.5;     // how far the other shapes recede
const FEATURE_SPEED = 0.36;    // drift speed across the page (units/sec) — slow
const FEATURE_EDGE  = 9.0;     // x at which the feature wraps to the other side

/* deterministic hash so each route always maps to the same shape */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/* bright, happy palette */
const COLORS = {
  orange: 0xff7a3c,
  teal:   0x36c9c0,
  purple: 0xa06bff,
  green:  0x9fd24a,
  blue:   0x4aa3ff,
  yellow: 0xffc23c,
  pink:   0xff6fb0,
  indigo: 0x6b6bff,
};

/* a puffy 5-point star shape */
function starGeometry(outer = 1, inner = 0.46, depth = 0.5) {
  const shape = new THREE.Shape();
  const pts = 5;
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.26, bevelSegments: 6, curveSegments: 16,
  });
  geo.center();
  return geo;
}

const G = {
  octahedron: () => new THREE.OctahedronGeometry(1.15, 0),
  sphere:     () => new THREE.SphereGeometry(1.05, 56, 56),
  cylinder:   () => new THREE.CylinderGeometry(0.92, 0.92, 1.7, 56),
  squircle:   () => new RoundedBoxGeometry(1.7, 1.7, 1.7, 8, 0.55),
  cube:       () => new RoundedBoxGeometry(1.55, 1.55, 1.55, 6, 0.22),
  star:       () => starGeometry(1.2, 0.55, 0.55),
  torus:      () => new THREE.TorusGeometry(0.8, 0.34, 28, 64),
  cone:       () => new THREE.ConeGeometry(1.0, 1.7, 56),
  capsule:    () => new THREE.CapsuleGeometry(0.62, 1.0, 12, 32),
  gem:        () => new THREE.IcosahedronGeometry(1.1, 0),
};

/* shape layout — kept around the frame edges so page content stays clear.
   z < 0 sits further back (smaller, softer). */
const LAYOUT = [
  { g: "octahedron", c: "orange", x: -5.4, y: 2.3,  z: 0.2,  s: 1.0,  range: 0.7 },
  { g: "star",       c: "teal",   x: 5.2,  y: 2.7,  z: 0.4,  s: 1.05, range: 0.7 },
  { g: "sphere",     c: "purple", x: -5.9, y: -0.3, z: 0.6,  s: 1.15, range: 0.8 },
  { g: "squircle",   c: "green",  x: 5.7,  y: -0.4, z: 0.3,  s: 1.0,  range: 0.7 },
  { g: "cylinder",   c: "blue",   x: -4.8, y: -2.7, z: 0.1,  s: 1.05, range: 0.7 },
  { g: "cube",       c: "yellow", x: 5.0,  y: -2.6, z: 0.3,  s: 1.0,  range: 0.7 },
  { g: "torus",      c: "pink",   x: -2.1, y: 3.3,  z: -1.6, s: 0.9,  range: 0.9 },
  { g: "cone",       c: "indigo", x: 2.4,  y: -3.5, z: -1.4, s: 0.85, range: 0.9 },
  { g: "gem",        c: "teal",   x: 3.0,  y: 3.4,  z: -2.2, s: 0.7,  range: 1.0 },
  { g: "capsule",    c: "orange", x: -3.0, y: -3.6, z: -2.0, s: 0.7,  range: 1.0 },
];

export class FloatScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.pointer = { x: 0, y: 0 };
    this.pTarget = { x: 0, y: 0 };
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 0, 12);

    // soft studio reflections for the glossy candy look
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xe7ecff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfe0ff, 0.5);
    rim.position.set(-6, -2, 4);
    this.scene.add(rim);

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.shapes = [];
    this._shadowTex = this._makeShadowTexture();
    this._build();

    this._bind();
    this.resize();
  }

  _makeShadowTexture() {
    const s = 128, cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(40,30,80,0.55)");
    g.addColorStop(0.55, "rgba(40,30,80,0.22)");
    g.addColorStop(1, "rgba(40,30,80,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(cv);
  }

  _build() {
    for (const spec of LAYOUT) {
      const geo = G[spec.g]();
      const mat = new THREE.MeshPhysicalMaterial({
        color: COLORS[spec.c], roughness: 0.42, metalness: 0.0,
        clearcoat: 0.55, clearcoatRoughness: 0.4, envMapIntensity: 1.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(spec.s);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      this.group.add(mesh);

      const shadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._shadowTex, transparent: true, opacity: 0.16, depthWrite: false }));
      shadow.scale.set(2.4 * spec.s, 1.2 * spec.s, 1);
      this.group.add(shadow);

      this.shapes.push({
        mesh, shadow,
        home: { x: spec.x, y: spec.y, z: spec.z },
        base: { x: spec.x, y: spec.y, z: spec.z },
        range: spec.range, s: spec.s,
        amp: 0.18 + Math.random() * 0.22,
        fs: 0.5 + Math.random() * 0.5,
        phase: Math.random() * 6.28,
        spin: {
          x: (Math.random() - 0.5) * 0.34,
          y: (Math.random() - 0.5) * 0.42 + 0.12,
          z: (Math.random() - 0.5) * 0.28,
        },
        kick: 0,
        curScale: spec.s,      // animated scale (lerps toward targetScale)
        targetScale: spec.s,
        isFeature: false,
        driftVX: 0,            // horizontal drift, only the feature shape uses it
        bobK: 1,               // bob multiplier (the big feature barely bobs)
      });
    }
  }

  /* Promote one shape to a big, slow-moving "feature" for this route.
     A different shape comes forth on every page; the rest recede. */
  feature(routeKey = "home") {
    const n = this.shapes.length;
    const idx = hashStr(String(routeKey)) % n;
    const dir = (hashStr("dir:" + routeKey) % 2) ? 1 : -1;      // drift left or right
    const lane = ((hashStr("lane:" + routeKey) % 100) / 100 - 0.5) * 2.2; // vertical band

    this.shapes.forEach((sp, i) => {
      if (i === idx) {
        // the hero shape: grow forward, settle into a background lane, drift slowly
        sp.isFeature = true;
        sp.targetScale = FEATURE_SCALE;
        sp.bobK = 0.3;
        sp.base.z = -1.5;
        sp.base.y = lane;
        sp.driftVX = this.reduced ? 0 : dir * FEATURE_SPEED;
        if (this.reduced) sp.base.x = 0;          // static, centred when motion is reduced
      } else {
        // everyone else recedes to soft background accents near the edges
        sp.isFeature = false;
        sp.targetScale = sp.s * AMBIENT_SCALE;
        sp.bobK = 1;
        sp.driftVX = 0;
        sp.base.z = sp.home.z;
        if (this.reduced || !gsap) {
          sp.base.x = sp.home.x; sp.base.y = sp.home.y;
        } else {
          const nx = sp.home.x + (Math.random() - 0.5) * sp.range;
          const ny = sp.home.y + (Math.random() - 0.5) * sp.range;
          gsap.to(sp.base, { x: nx, y: ny, duration: 1.1, ease: "power3.inOut", delay: i * 0.02 });
          sp.kick = 2.4 + Math.random() * 2.4;    // a little settle-spin
        }
      }
    });
  }

  _bind() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (e) => {
      this.pTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // pull the field in / push out so shapes stay near the edges on any ratio
    const fit = Math.max(0.62, Math.min(1.15, (w / h) / 1.6));
    this.group.scale.setScalar(fit);
  }

  start() {
    const tick = () => { this._frame(); this.renderer.render(this.scene, this.camera); this._raf = requestAnimationFrame(tick); };
    tick();
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.t = (this.t || 0) + dt;
    const t = this.t;

    this.pointer.x += (this.pTarget.x - this.pointer.x) * 0.04;
    this.pointer.y += (this.pTarget.y - this.pointer.y) * 0.04;
    this.group.rotation.y = this.pointer.x * 0.12;
    this.group.rotation.x = this.pointer.y * 0.08;

    for (const sp of this.shapes) {
      // ease scale toward its target (grow into / recede from the feature role)
      sp.curScale += (sp.targetScale - sp.curScale) * Math.min(1, dt * 3.2);
      sp.mesh.scale.setScalar(sp.curScale);

      // the feature shape drifts slowly across and wraps to the other side
      if (sp.isFeature && sp.driftVX) {
        sp.base.x += sp.driftVX * dt;
        if (sp.base.x > FEATURE_EDGE) sp.base.x = -FEATURE_EDGE;
        else if (sp.base.x < -FEATURE_EDGE) sp.base.x = FEATURE_EDGE;
      }

      const h = Math.sin(t * sp.fs + sp.phase);
      const m = sp.mesh;
      m.position.x = sp.base.x;
      m.position.z = sp.base.z;
      m.position.y = sp.base.y + h * sp.amp * sp.bobK;
      const spin = (1 + sp.kick) * (sp.isFeature ? 0.4 : 1);   // the big one spins gently
      m.rotation.x += sp.spin.x * spin * dt;
      m.rotation.y += sp.spin.y * spin * dt;
      m.rotation.z += sp.spin.z * spin * dt;
      sp.kick *= Math.max(0, 1 - dt * 2.2);

      // the feature floats free; the recessed shapes keep their soft drop shadow
      if (sp.isFeature) {
        sp.shadow.material.opacity = 0;
      } else {
        const lift = (h + 1) / 2;
        sp.shadow.position.set(sp.base.x, sp.base.y - 1.5 * sp.curScale, sp.base.z - 0.2);
        sp.shadow.material.opacity = 0.18 * (1 - 0.45 * lift) * (sp.curScale / sp.s);
        const ss = 1 - 0.14 * lift;
        sp.shadow.scale.set(2.4 * sp.curScale * ss, 1.2 * sp.curScale * ss, 1);
      }
    }
  }
}
