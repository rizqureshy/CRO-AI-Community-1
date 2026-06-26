/* ============================================================
   scene.js — Morphing particle field (Three.js)

   A single GPU particle system (~7k points) that flies between
   formations per slide:
     0  orb        — a glowing particle sphere (the "AI" core)
     1  time-ring  — particles settle into a slow orbital ring
     2  clusters   — they split into four week constellations
     3  burst      — gather into a chest, then erupt like treasure

   Restrained palette: mostly cool white/violet with sparse
   accent pops. Morphs are eased + arc-displaced so particles
   visibly "come and go" between shapes (Framer-style).
   ============================================================ */

import * as THREE from "three";

const C = {
  violet: new THREE.Color("#6b5bff"),
  iris:   new THREE.Color("#8b7bff"),
  blue:   new THREE.Color("#2b88ff"),
  teal:   new THREE.Color("#18c8b6"),
  pink:   new THREE.Color("#e3008c"),
  gold:   new THREE.Color("#ffcf45"),
  white:  new THREE.Color("#dfe4ff"),
};
const ACCENTS = [C.violet, C.blue, C.teal, C.pink];
const lerp = (a, b, t) => a + (b - a) * t;
const GA = Math.PI * (3 - Math.sqrt(5)); // golden angle

export class Cosmos {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerTarget = new THREE.Vector2(0, 0);
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.N = this.reduced ? 5000 : 13000;

    this._initRenderer();
    this._initScene();
    this._buildStars();
    this._buildNebula();
    this._buildParticles();

    this._bindEvents();
    this.resize();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: true, powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 160);
    this.camera.position.set(0, 0, 13);
    this.camBase = { x: 0, y: 0, z: 13 };
  }

  /* ---------------- faint background starfield ---------------- */
  _buildStars() {
    const N = this.reduced ? 700 : 1500;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 40 + Math.random() * 60;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p) - 30;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xcdd4ff, size: 0.7, sizeAttenuation: true,
      transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  _glowTexture(color) {
    const s = 256, cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    const c = color.getStyle();
    g.addColorStop(0, c); g.addColorStop(0.3, c); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }

  _buildNebula() {
    this.nebula = new THREE.Group();
    [
      { c: C.violet, x: -15, y: 7,  z: -34, s: 40, o: 0.13 },
      { c: C.blue,   x: 16,  y: -6, z: -36, s: 34, o: 0.10 },
    ].forEach((d) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this._glowTexture(d.c), blending: THREE.AdditiveBlending,
        depthWrite: false, opacity: d.o, transparent: true }));
      sp.position.set(d.x, d.y, d.z); sp.scale.set(d.s, d.s, 1);
      sp.userData = { baseY: d.y, ph: Math.random() * 6.28 };
      this.nebula.add(sp);
    });
    this.scene.add(this.nebula);
  }

  /* ============================================================
     The morphing particle field
     ============================================================ */
  _buildParticles() {
    const N = this.N;
    this.aFrom = new Float32Array(N * 3);
    this.aTo = new Float32Array(N * 3);
    this.cFrom = new Float32Array(N * 3);
    this.cTo = new Float32Array(N * 3);
    const aRand = new Float32Array(N);
    const aSize = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      aRand[i] = Math.random();
      aSize[i] = 0.42 + Math.random() * 1.05;
    }

    // initial formation = orb
    const t0 = this._formOrb();
    this.aFrom.set(t0.pos); this.aTo.set(t0.pos);
    this.cFrom.set(t0.col); this.cTo.set(t0.col);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.aTo, 3)); // required slot
    geo.setAttribute("aFrom", new THREE.BufferAttribute(this.aFrom, 3));
    geo.setAttribute("aTo", new THREE.BufferAttribute(this.aTo, 3));
    geo.setAttribute("cFrom", new THREE.BufferAttribute(this.cFrom, 3));
    geo.setAttribute("cTo", new THREE.BufferAttribute(this.cTo, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uMix: { value: 1 },
      uPix: { value: this.renderer.getPixelRatio() },
      uArc: { value: 1.3 },
      uSpin: { value: 0.0 },
      uSwirl: { value: 2.4 },   // whirlwind: extra rotation that peaks mid-transition
      uForward: { value: 6.2 }, // depth surge toward the camera, peaks mid-transition
      uFade: { value: 1.0 },    // global field brightness — dipped to mask the layer hand-off
      uLive: { value: 0.0 },    // 1 = live sim drives aTo directly (skip morph/idle motion)
      uLightMode: { value: 0.0 }, // 1 = light theme (darker saturated specks, normal blending)
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime, uMix, uPix, uArc, uSpin, uSwirl, uForward, uLive;
        attribute vec3 aFrom; attribute vec3 aTo;
        attribute vec3 cFrom; attribute vec3 cTo;
        attribute float aRand; attribute float aSize;
        varying vec3 vCol;
        void main(){
          float m = clamp(uMix, 0.0, 1.0);
          float e = m*m*(3.0-2.0*m);                 // smoothstep ease
          vec3 pos = mix(aFrom, aTo, e);

          // live mode: aTo holds CPU-simulated positions — use them verbatim,
          // skip the morph arc / whirlwind / idle sway so fireworks stay put
          if (uLive < 0.5) {
            // arc displacement mid-flight -> particles "fly" between shapes
            float arc = sin(e*3.14159265);
            vec3 dir = vec3(sin(aRand*6.2831), cos(aRand*5.137), sin(aRand*9.42));
            pos += dir * arc * uArc * (0.4 + aRand);

            // idle sway around Y + gentle bob (alive at rest),
            // plus a whirlwind: arc-enveloped spin that peaks mid-transition
            // and is zero at rest. Higher particles swirl a touch more (vortex).
            float a = sin(uTime*0.12)*0.35 + uSpin*uTime + arc*uSwirl*(1.0 + 0.15*pos.y);
            float s = sin(a), c = cos(a);
            pos = vec3(pos.x*c - pos.z*s, pos.y, pos.x*s + pos.z*c);
            pos.y += sin(uTime*0.7 + aRand*6.2831)*0.07 + arc*0.6*sin(aRand*30.0); // lift + scatter mid-swirl
            pos.x += cos(uTime*0.5 + aRand*6.2831)*0.05;
            // surge toward the camera mid-transition so the dance comes forward
            // and obscures the slide, then recedes back (arc = 0 at rest)
            pos.z += arc * uForward;
          }

          vec4 mv = modelViewMatrix * vec4(pos,1.0);
          gl_PointSize = aSize * (165.0 / -mv.z) * uPix * (0.7 + 0.3*sin(uTime*2.0 + aRand*30.0));
          gl_Position = projectionMatrix * mv;
          vCol = mix(cFrom, cTo, e);
        }`,
      fragmentShader: `
        varying vec3 vCol;
        uniform float uFade, uLightMode;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          if (uLightMode > 0.5) {
            // light theme: darker, more saturated specks that read on a pale bg
            float l = dot(vCol, vec3(0.299, 0.587, 0.114));
            vec3 c = clamp(mix(vec3(l), vCol, 1.45) * 0.5, 0.0, 1.0);
            gl_FragColor = vec4(c, a * 0.9);
          } else {
            // dark theme: bright, radiant additive core
            vec3 col = vCol * (1.15 + 0.5 * (1.0 - d * 2.0));
            gl_FragColor = vec4(col, a * 0.85 * uFade);
          }
        }`,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  /* ---------------- formation generators ---------------- */
  _alloc() { return { pos: new Float32Array(this.N * 3), col: new Float32Array(this.N * 3) }; }
  _setCol(col, i, c, jitter = 0.0) {
    col[i * 3] = c.r * (1 - jitter + Math.random() * jitter * 2);
    col[i * 3 + 1] = c.g * (1 - jitter + Math.random() * jitter * 2);
    col[i * 3 + 2] = c.b * (1 - jitter + Math.random() * jitter * 2);
  }

  _formOrb() {
    const { pos, col } = this._alloc(), N = this.N, R = 3.0;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * GA;
      const rad = R + (Math.random() - 0.5) * 0.5;
      const px = Math.cos(phi) * rr * rad;
      const py = y * rad;
      const pz = Math.sin(phi) * rr * rad;
      pos[i * 3] = px; pos[i * 3 + 1] = py + 0.3; pos[i * 3 + 2] = pz;
      // cool gradient by height; sparse pink
      const tcol = Math.random() < 0.05 ? C.pink : tmp.copy(C.violet).lerp(C.blue, (y + 1) / 2);
      this._setCol(col, i, tcol, 0.08);
    }
    return { pos, col };
  }

  _formRing() {
    const { pos, col } = this._alloc(), N = this.N, R = 3.2, r = 0.42;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const z = (R + r * Math.cos(v)) * Math.sin(u);
      const y = r * Math.sin(v);
      // tilt the ring slightly for an "orbit" read; offset right
      pos[i * 3] = x + 3.4;
      pos[i * 3 + 1] = y + x * 0.18 + 0.3;
      pos[i * 3 + 2] = z;
      const tcol = Math.random() < 0.06 ? C.teal : tmp.copy(C.iris).lerp(C.blue, Math.random());
      this._setCol(col, i, tcol, 0.06);
    }
    return { pos, col };
  }

  _formClusters(n = 4, y = -3.4) {
    const { pos, col } = this._alloc(), N = this.N;
    const palette = [C.blue, C.violet, C.teal, C.gold, C.iris, C.pink];
    const spacing = n <= 3 ? 3.7 : 3.0;
    for (let i = 0; i < N; i++) {
      const g = i % n;
      const cx = (g - (n - 1) / 2) * spacing;
      const rx = (Math.random() - 0.5) * 1.7;
      const ry = (Math.random() - 0.5) * 1.7;
      const rz = (Math.random() - 0.5) * 1.0;
      pos[i * 3] = cx + rx;
      pos[i * 3 + 1] = y + ry;
      pos[i * 3 + 2] = rz;
      this._setCol(col, i, palette[g], 0.12);
    }
    return { pos, col };
  }

  // bright, dense little sphere — the "core". offsetX shifts it aside.
  _formCore(offsetX = 3.3) {
    const { pos, col } = this._alloc(), N = this.N, R = 2.0;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2;
      const ct = 2 * Math.random() - 1;
      const st = Math.sqrt(Math.max(0, 1 - ct * ct));
      const rad = R * (0.45 + 0.55 * Math.random());        // fill the volume a bit
      const px = Math.cos(u) * st * rad;
      const py = ct * rad;
      const pz = Math.sin(u) * st * rad;
      pos[i * 3] = px + offsetX;
      pos[i * 3 + 1] = py + 0.2;
      pos[i * 3 + 2] = pz;
      const near = rad < R * 0.7;
      const tcol = near ? C.white : tmp.copy(C.violet).lerp(C.blue, Math.random());
      this._setCol(col, i, tcol, 0.08);
    }
    return { pos, col };
  }

  // two distinct clouds — the "two sides / trust boundary" duality
  _formSplit() {
    const { pos, col } = this._alloc(), N = this.N;
    for (let i = 0; i < N; i++) {
      const side = i % 2;
      const cx = side ? 3.1 : -3.1;
      const rx = (Math.random() - 0.5) * 2.2;
      const ry = (Math.random() - 0.5) * 3.0;
      const rz = (Math.random() - 0.5) * 1.2;
      pos[i * 3] = cx + rx;
      pos[i * 3 + 1] = ry + 0.2;
      pos[i * 3 + 2] = rz;
      this._setCol(col, i, side ? C.violet : C.blue, 0.1);
    }
    return { pos, col };
  }

  // a lattice plane — the "scan across the content estate"
  _formGrid() {
    const { pos, col } = this._alloc(), N = this.N;
    const cols = Math.round(Math.sqrt(N * 1.7));
    const rows = Math.ceil(N / cols);
    const W = 12, H = 6.5;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const c = i % cols, r = (i / cols) | 0;
      const x = (c / (cols - 1) - 0.5) * W;
      const y = (r / (rows - 1) - 0.5) * H + 0.3;
      const z = Math.sin(c * 0.6) * 0.35 + (Math.random() - 0.5) * 0.25;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      const tcol = Math.random() < 0.08 ? C.gold : tmp.copy(C.teal).lerp(C.blue, c / cols);
      this._setCol(col, i, tcol, 0.06);
    }
    return { pos, col };
  }

  // a horizontal flowing band — the "Build › Validate › Publish › Field" pipeline
  _formStream() {
    const { pos, col } = this._alloc(), N = this.N;
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const u = Math.random();
      const x = (u - 0.5) * 13.5;
      const wave = Math.sin(u * Math.PI * 2.4) * 0.7;
      pos[i * 3] = x;
      pos[i * 3 + 1] = wave - 0.4 + (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 2] = Math.cos(u * Math.PI * 2.0) * 0.6 + (Math.random() - 0.5) * 0.5;
      const tcol = Math.random() < 0.07 ? C.gold : tmp.copy(C.blue).lerp(C.teal, u);
      this._setCol(col, i, tcol, 0.07);
    }
    return { pos, col };
  }

  _formBurst() {
    const { pos, col } = this._alloc(), N = this.N;
    for (let i = 0; i < N; i++) {
      // exploding shell — the celebratory finale
      const dirx = (Math.random() - 0.5) * 2;
      const diry = Math.random();             // bias up
      const dirz = (Math.random() - 0.5) * 2;
      const len = Math.sqrt(dirx * dirx + diry * diry + dirz * dirz) || 1;
      const rad = 1.5 + Math.random() * 5.0;
      pos[i * 3] = (dirx / len) * rad;
      pos[i * 3 + 1] = (diry / len) * rad - 1.0;
      pos[i * 3 + 2] = (dirz / len) * rad;
      const r = Math.random();
      const tcol = r < 0.18 ? ACCENTS[(r * 100 | 0) % ACCENTS.length] : (r < 0.6 ? C.gold : C.white);
      this._setCol(col, i, tcol, 0.1);
    }
    return { pos, col };
  }

  // a big glowing "?" — particles trace the hook, stem and dot of a question mark
  _formQuestion() {
    const { pos, col } = this._alloc(), N = this.N;
    const tmp = new THREE.Color();
    const S = 1.55;                          // overall scale
    const R = 1.55, Cx = 0, Cy = 1.7;        // hook circle
    const a0 = (158 * Math.PI) / 180;        // hook free tip (upper-left)
    const a1 = (-60 * Math.PI) / 180;        // hook sweep end (lower-right), clockwise
    const hex = Cx + R * Math.cos(a1), hey = Cy + R * Math.sin(a1);  // hook end
    const tcx = 0.30, tcy = -0.05;           // tail bezier control
    const sx = 0.0, sy = 0.10;               // stem top (curls back to centre)
    const stemBottomY = -0.55;
    const dotY = -1.45, dotR = 0.30;
    const yCenter = 0.95, baseY = 0.3;       // recentre vertically + slide baseline
    const bez = (t, p0, p1, p2) => { const u = 1 - t; return u * u * p0 + 2 * u * t * p1 + t * t * p2; };
    // particle budget per part, ~ proportional to length
    const wHook = 7.6, wTail = 1.0, wStem = 0.7, wDot = 1.6, wTot = wHook + wTail + wStem + wDot;

    for (let i = 0; i < N; i++) {
      const r = Math.random() * wTot;
      let x, y;
      if (r < wHook) {                        // hook arc
        const t = Math.random();
        const a = a0 + (a1 - a0) * t;
        x = Cx + R * Math.cos(a); y = Cy + R * Math.sin(a);
      } else if (r < wHook + wTail) {         // tail curling to centre
        const t = Math.random();
        x = bez(t, hex, tcx, sx); y = bez(t, hey, tcy, sy);
      } else if (r < wHook + wTail + wStem) { // short straight stem
        const t = Math.random();
        x = sx; y = sy + (stemBottomY - sy) * t;
      } else {                                // the dot
        const u = Math.random() * Math.PI * 2;
        const rr = dotR * Math.sqrt(Math.random());
        x = Math.cos(u) * rr; y = dotY + Math.sin(u) * rr;
      }
      x += (Math.random() - 0.5) * 0.30;      // stroke thickness
      y += (Math.random() - 0.5) * 0.30;
      pos[i * 3] = x * S;                      // standard "?" — hook opens to the left
      pos[i * 3 + 1] = (y - yCenter) * S + baseY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
      const ny = (y + 1.6) / 4.0;             // cool gradient by height; sparse pink
      const tcol = Math.random() < 0.05 ? C.pink : tmp.copy(C.violet).lerp(C.blue, Math.min(1, Math.max(0, ny)));
      this._setCol(col, i, tcol, 0.08);
    }
    return { pos, col };
  }

  // a rocket lifting off — nose cone, body, fins, window + a warm exhaust plume
  _formRocket() {
    const { pos, col } = this._alloc(), N = this.N;
    const tmp = new THREE.Color();
    const S = 1.35;
    const bw = 0.85;                                   // body half-width
    const apexY = 3.2, noseBaseY = 1.5;               // nose cone
    const bodyTopY = 1.5, bodyBotY = -1.4;            // body tube
    const finTopY = -0.2, finBotY = -1.5, finOutX = 1.85, finOutY = -1.95;
    const winX = 0, winY = 0.7, winR = 0.40;          // window
    const exTopY = -1.4, exBotY = -3.1;               // exhaust plume
    const yCenter = 0.05, baseY = 0.3;
    const tri = (ax, ay, bx, by, cx, cy) => {         // uniform point in a triangle
      let r1 = Math.random(), r2 = Math.random();
      if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
      return [ax + (bx - ax) * r1 + (cx - ax) * r2, ay + (by - ay) * r1 + (cy - ay) * r2];
    };
    const wBody = 5.4, wNose = 1.8, wFins = 1.2, wWin = 0.5, wEx = 2.2;
    const wTot = wBody + wNose + wFins + wWin + wEx;

    for (let i = 0; i < N; i++) {
      const r = Math.random() * wTot;
      let x, y, part;
      if (r < wBody) {                                 // body tube
        part = "body";
        x = (Math.random() * 2 - 1) * bw;
        y = bodyBotY + Math.random() * (bodyTopY - bodyBotY);
      } else if (r < wBody + wNose) {                  // nose cone
        part = "nose";
        [x, y] = tri(0, apexY, -bw, noseBaseY, bw, noseBaseY);
      } else if (r < wBody + wNose + wFins) {          // two fins
        part = "fin";
        [x, y] = Math.random() < 0.5
          ? tri(-bw, finTopY, -bw, finBotY, -finOutX, finOutY)
          : tri(bw, finTopY, bw, finBotY, finOutX, finOutY);
      } else if (r < wBody + wNose + wFins + wWin) {   // porthole window
        part = "win";
        const u = Math.random() * Math.PI * 2, rr = winR * Math.sqrt(Math.random());
        x = winX + Math.cos(u) * rr; y = winY + Math.sin(u) * rr;
      } else {                                         // exhaust plume (tapers down)
        part = "exhaust";
        const t = Math.random();
        y = exTopY - t * (exTopY - exBotY);
        x = (Math.random() * 2 - 1) * (bw * 0.8 * (1 - t) + 0.05);
      }
      const j = part === "exhaust" ? 0.12 : 0.08;
      x += (Math.random() - 0.5) * 2 * j;
      y += (Math.random() - 0.5) * 2 * j;
      pos[i * 3] = x * S;
      pos[i * 3 + 1] = (y - yCenter) * S + baseY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
      let tcol;
      if (part === "exhaust") { const rr = Math.random(); tcol = rr < 0.32 ? C.white : (rr < 0.72 ? C.gold : C.pink); }
      else if (part === "win") tcol = Math.random() < 0.5 ? C.teal : C.white;
      else if (part === "nose") tcol = Math.random() < 0.4 ? C.white : tmp.copy(C.violet).lerp(C.blue, Math.random());
      else if (part === "fin") tcol = Math.random() < 0.3 ? C.iris : C.blue;
      else tcol = Math.random() < 0.05 ? C.pink : tmp.copy(C.violet).lerp(C.blue, (y - bodyBotY) / (bodyTopY - bodyBotY));
      this._setCol(col, i, tcol, 0.08);
    }
    return { pos, col };
  }

  // a power "on" symbol — a ring open at the top with a vertical bar through it
  _formPower() {
    const { pos, col } = this._alloc(), N = this.N;
    const tmp = new THREE.Color();
    const cy = 0.3, R = 2.5;
    const gap = (24 * Math.PI) / 180;                 // half-gap at the very top
    const sweepStart = Math.PI / 2 + gap;             // start just past top
    const sweep = Math.PI * 2 - 2 * gap;              // full circle minus the gap
    const barTop = cy + R + 0.55, barBot = cy - 0.15; // vertical bar through the gap
    const baseY = 0.3;
    const wRing = 8.0, wBar = 2.3, wTot = wRing + wBar;

    for (let i = 0; i < N; i++) {
      let x, y, isBar;
      if (Math.random() * wTot < wRing) {             // ring
        isBar = false;
        const a = sweepStart + Math.random() * sweep;
        x = Math.cos(a) * R; y = cy + Math.sin(a) * R;
      } else {                                        // bar
        isBar = true;
        x = 0; y = barBot + Math.random() * (barTop - barBot);
      }
      x += (Math.random() - 0.5) * 0.22;
      y += (Math.random() - 0.5) * 0.22;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y - cy + baseY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
      const tcol = isBar
        ? (Math.random() < 0.5 ? C.white : C.teal)    // the bar glows like an "on" indicator
        : (Math.random() < 0.05 ? C.pink : tmp.copy(C.violet).lerp(C.blue, Math.random()));
      this._setCol(col, i, tcol, 0.08);
    }
    return { pos, col };
  }

  // a checkmark — a short down-stroke into a long up-stroke
  _formCheck() {
    const { pos, col } = this._alloc(), N = this.N;
    const tmp = new THREE.Color();
    const S = 1.9;
    const A = [-1.7, 0.2], B = [-0.5, -1.2], C2 = [2.0, 1.6];  // start, vertex, end
    const xMid = 0.15, yMid = 0.2, baseY = 0.3;
    const len = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    const wAB = len(A, B), wTot = wAB + len(B, C2);

    for (let i = 0; i < N; i++) {
      const t = Math.random();
      let x, y;
      if (Math.random() * wTot < wAB) {               // short stroke A→B
        x = A[0] + (B[0] - A[0]) * t; y = A[1] + (B[1] - A[1]) * t;
      } else {                                        // long stroke B→C
        x = B[0] + (C2[0] - B[0]) * t; y = B[1] + (C2[1] - B[1]) * t;
      }
      x += (Math.random() - 0.5) * 0.26;              // stroke thickness
      y += (Math.random() - 0.5) * 0.26;
      pos[i * 3] = (x - xMid) * S;
      pos[i * 3 + 1] = (y - yMid) * S + baseY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
      const tcol = Math.random() < 0.12 ? C.white : tmp.copy(C.teal).lerp(C.blue, Math.random() * 0.6);
      this._setCol(col, i, tcol, 0.08);
    }
    return { pos, col };
  }

  // fireworks — several coloured bursts scattered across the sky
  _formFireworks() {
    const { pos, col } = this._alloc(), N = this.N;
    const bursts = [
      { x: -4.2, y: 2.4, z: -1.0, r: 2.2, c: C.gold },
      { x: 3.8, y: 2.9, z: 0.5, r: 2.0, c: C.pink },
      { x: -1.0, y: 0.4, z: 0.0, r: 2.4, c: C.teal },
      { x: 4.6, y: -1.2, z: -0.6, r: 1.8, c: C.blue },
      { x: -3.6, y: -1.6, z: 0.4, r: 1.9, c: C.violet },
      { x: 1.2, y: 3.2, z: -0.4, r: 1.7, c: C.iris },
    ];
    const n = bursts.length;
    for (let i = 0; i < N; i++) {
      const b = bursts[i % n];                          // even density per burst
      const u = Math.random() * Math.PI * 2;
      const ct = 2 * Math.random() - 1;
      const st = Math.sqrt(Math.max(0, 1 - ct * ct));
      const rad = b.r * (0.15 + 0.85 * Math.random());  // spray out to the shell
      pos[i * 3] = b.x + Math.cos(u) * st * rad;
      pos[i * 3 + 1] = b.y + ct * rad + 0.2;
      pos[i * 3 + 2] = b.z + Math.sin(u) * st * rad;
      const rr = Math.random();
      const tcol = rr < 0.22 ? C.white : (rr < 0.32 ? C.gold : b.c);  // bright sparks + burst colour
      this._setCol(col, i, tcol, 0.1);
    }
    return { pos, col };
  }

  /* ---------------- live fireworks simulation ----------------
     Real fireworks behaviour driven on the CPU: each shell launches a
     comet from below, bursts into a spreading shell of sparks that arc
     under gravity and fade, then recycles on its own staggered timer.
     Only runs while the fireworks slide is active (uLive = 1). */
  _fwInit() {
    const N = this.N;
    const shells = [
      { bx: -4.2, by: 2.4, bz: -1.0, r: 2.2, col: C.gold,   T: 6.8 },
      { bx: 3.8,  by: 2.9, bz: 0.6,  r: 2.0, col: C.pink,   T: 7.2 },
      { bx: -1.0, by: 1.4, bz: 0.0,  r: 2.4, col: C.teal,   T: 6.4 },
      { bx: 4.6,  by: -0.4,bz: -0.6, r: 1.8, col: C.blue,   T: 7.0 },
      { bx: -3.6, by: -0.2,bz: 0.5,  r: 1.9, col: C.violet, T: 6.6 },
      { bx: 1.2,  by: 3.2, bz: -0.4, r: 1.7, col: C.iris,   T: 7.4 },
      { bx: 0.3,  by: 0.6, bz: 0.3,  r: 2.1, col: C.gold,   T: 6.9 },
    ];
    this._fwRise = 0.85; this._fwBurst = 2.8; this._fwG = 1.1;
    const K = shells.length;
    // spread the initial phases evenly across each cycle so the sky always
    // has a few bursts going (no empty beats) and none start mid-launch
    this.fwShells = shells.map((s, k) => {
      const phase0 = this._fwRise + (k / K) * (s.T - this._fwRise);
      return { ...s, t0: s.T - phase0 };
    });

    const per = Math.ceil(N / K);
    this.fwDir = new Float32Array(N * 3);
    this.fwSpeed = new Float32Array(N);
    this.fwBase = new Float32Array(N * 3);
    this.fwShell = new Uint8Array(N);
    this.fwTail = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const k = Math.min(K - 1, Math.floor(i / per));
      this.fwShell[i] = k;
      const s = shells[k];
      const u = Math.random() * Math.PI * 2, ct = 2 * Math.random() - 1, st = Math.sqrt(Math.max(0, 1 - ct * ct));
      this.fwDir[i * 3] = Math.cos(u) * st;
      this.fwDir[i * 3 + 1] = ct;
      this.fwDir[i * 3 + 2] = Math.sin(u) * st * 0.7;        // flatten depth a touch
      this.fwSpeed[i] = 0.35 + 0.65 * Math.random();
      this.fwTail[i] = Math.random();
      const rr = Math.random();
      const base = rr < 0.7 ? s.col : (rr < 0.92 ? C.white : C.gold);
      this.fwBase[i * 3] = base.r; this.fwBase[i * 3 + 1] = base.g; this.fwBase[i * 3 + 2] = base.b;
    }
  }

  _fwStep(t) {
    const N = this.N, aTo = this.aTo, cTo = this.cTo;
    const rise = this._fwRise, burst = this._fwBurst, g = this._fwG;
    const lt = t - (this.fwT0 || 0);
    for (let i = 0; i < N; i++) {
      const s = this.fwShells[this.fwShell[i]];
      const p = (((lt - s.t0) % s.T) + s.T) % s.T;
      let x, y, z, b;
      if (p < rise) {                                        // comet rising from below
        const u = p / rise, ease = u * (2 - u);
        const ry = -5.0 + (s.by + 5.0) * ease;
        x = s.bx + this.fwDir[i * 3] * 0.05;
        y = ry - this.fwTail[i] * 1.15;                      // stretched into a thin streak
        z = s.bz + this.fwDir[i * 3 + 2] * 0.05;
        b = 0.26 * (0.4 + 0.6 * ease) * (1 - this.fwTail[i] * 0.7); // faint, fades down the tail
      } else if (p < rise + burst) {                         // explosion shell + gravity
        const q = (p - rise) / burst;
        const reach = s.r * this.fwSpeed[i] * (1 - Math.exp(-3.2 * q));
        const lt2 = q * burst;
        x = s.bx + this.fwDir[i * 3] * reach;
        y = s.by + this.fwDir[i * 3 + 1] * reach - 0.5 * g * lt2 * lt2;
        z = s.bz + this.fwDir[i * 3 + 2] * reach;
        b = Math.pow(1 - q, 1.35) * 1.05;                    // bright flash → ember fade
      } else {                                               // dark gap before next launch
        x = s.bx; y = s.by; z = s.bz; b = 0;
      }
      aTo[i * 3] = x; aTo[i * 3 + 1] = y; aTo[i * 3 + 2] = z;
      cTo[i * 3] = this.fwBase[i * 3] * b;
      cTo[i * 3 + 1] = this.fwBase[i * 3 + 1] * b;
      cTo[i * 3 + 2] = this.fwBase[i * 3 + 2] * b;
    }
    const geo = this.points.geometry;
    geo.attributes.aTo.needsUpdate = true;
    geo.attributes.cTo.needsUpdate = true;
  }

  /* ---------------- morph driver ---------------- */
  _morphTo(form, opts = {}) {
    const gsap = this.gsap;
    // bake currently-displayed mix into aFrom so fast skips don't pop
    const e = (() => { const m = Math.min(Math.max(this.uniforms.uMix.value, 0), 1); return m * m * (3 - 2 * m); })();
    for (let i = 0; i < this.aFrom.length; i++) {
      this.aFrom[i] = lerp(this.aFrom[i], this.aTo[i], e);
      this.cFrom[i] = lerp(this.cFrom[i], this.cTo[i], e);
    }
    this.aTo.set(form.pos);
    this.cTo.set(form.col);
    const geo = this.points.geometry;
    geo.attributes.aFrom.needsUpdate = true;
    geo.attributes.aTo.needsUpdate = true;
    geo.attributes.cFrom.needsUpdate = true;
    geo.attributes.cTo.needsUpdate = true;

    this.uniforms.uMix.value = 0;
    gsap.killTweensOf(this.uniforms.uMix);
    gsap.killTweensOf(this.uniforms.uArc);
    this.uniforms.uArc.value = opts.arc ?? 1.4;
    gsap.to(this.uniforms.uMix, { value: 1, duration: opts.dur ?? 1.7, ease: opts.ease ?? "power3.inOut" });
    gsap.to(this.uniforms.uSpin, { value: opts.spin ?? 0.0, duration: 1.5, ease: "power2.out" });
  }

  /* ============================================================
     Formation registry — the platform's public vocabulary.
     Each entry: make(arg) -> {pos,col}, a default camera [x,y,z],
     and default morph opts. Slides select one via HTML:
        <section class="slide" data-formation="clusters:3">
     ============================================================ */
  get _registry() {
    return {
      orb:          { make: () => this._formOrb(),               cam: [0, 0.5, 13.0],  opts: { spin: 0.05, arc: 1.5 } },
      core:         { make: () => this._formCore(3.3),           cam: [-0.6, 0.1, 12.8], opts: { spin: 0.0, arc: 1.3 } },
      "core-center":{ make: () => this._formCore(0),             cam: [0, 0.2, 12.8],  opts: { spin: 0.0, arc: 1.3 } },
      clusters:     { make: (n) => this._formClusters(Math.max(2, parseInt(n) || 3), -3.6),
                                                                 cam: [0, 0.3, 14.2],  opts: { spin: 0.0, arc: 1.8, dur: 1.9 } },
      split:        { make: () => this._formSplit(),             cam: [0, 0.2, 13.6],  opts: { spin: 0.0, arc: 1.6, dur: 1.8 } },
      ring:         { make: () => this._formRing(),              cam: [-0.5, 0.1, 12.8], opts: { spin: 0.10, arc: 1.2 } },
      grid:         { make: () => this._formGrid(),              cam: [0, 0.2, 13.8],  opts: { spin: 0.0, arc: 1.4, dur: 1.9 } },
      stream:       { make: () => this._formStream(),            cam: [0, 0.1, 13.4],  opts: { spin: 0.0, arc: 1.3, dur: 1.8 } },
      burst:        { make: () => this._formBurst(),             cam: [0, 0.0, 13.0],  opts: { spin: 0.06, arc: 2.6, dur: 1.7, ease: "power2.out" } },
      question:     { make: () => this._formQuestion(),          cam: [0, 0.3, 13.6],  opts: { spin: 0.03, arc: 1.6, dur: 1.9 } },
      rocket:       { make: () => this._formRocket(),            cam: [0, 0.25, 14.4], opts: { spin: 0.0, arc: 1.7, dur: 1.9 } },
      power:        { make: () => this._formPower(),             cam: [0, 0.3, 13.8],  opts: { spin: 0.04, arc: 1.5, dur: 1.9 } },
      check:        { make: () => this._formCheck(),             cam: [0, 0.3, 13.6],  opts: { spin: 0.0, arc: 1.6, dur: 1.9 } },
      fireworks:    { make: () => this._formFireworks(),         cam: [0, 0.2, 13.4],  opts: { spin: 0.04, arc: 2.4, dur: 1.7, ease: "power2.out" } },
    };
  }

  /**
   * Public, data-driven entry point. Called once per slide.
   * @param {string} spec   formation name, optionally "name:arg" (e.g. "clusters:4")
   * @param {object} gsap   the GSAP instance
   * @param {object} over   optional overrides: { cam:[x,y,z], spin, arc, dur, ease }
   */
  applyFormation(spec, gsap, over = {}) {
    this.gsap = gsap;
    const [nameRaw, arg] = String(spec || "orb").trim().split(":");
    const def = this._registry[nameRaw] || this._registry.orb;
    this._morphTo(def.make(arg), { ...def.opts, ...over });
    const cam = over.cam || def.cam;
    this._camTo(cam[0], cam[1], cam[2]);

    // live fireworks: morph to the static shape first (whirlwind-in plays),
    // then switch on the CPU sim once it has arrived
    if (this._fwTimer) { this._fwTimer.kill(); this._fwTimer = null; }
    this.live = false;
    if (this.uniforms) this.uniforms.uLive.value = 0;
    if (nameRaw === "fireworks" && !this.reduced) {
      this.liveMode = "fireworks";
      this._fwInit();
      const delay = (over.dur ?? def.opts.dur ?? 1.7) + 0.1;
      this._fwTimer = gsap.delayedCall(delay, () => {
        this.fwT0 = this.elapsed || 0;
        this.live = true;
        this.uniforms.uLive.value = 1;
      });
    } else {
      this.liveMode = null;
    }
  }

  /** Switch the field between dark (additive glow) and light (saturated specks). */
  setTheme(mode) {
    const light = mode === "light";
    this.uniforms.uLightMode.value = light ? 1 : 0;
    const mat = this.points.material;
    mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    mat.needsUpdate = true;
    // the white starfield + additive nebula only read on a dark sky
    if (this.stars) this.stars.visible = !light;
    if (this.nebula) this.nebula.visible = !light;
  }

  /** List available formation names (handy for tooling/docs). */
  get formationNames() { return Object.keys(this._registry); }

  _camTo(x, y, z) {
    this.camBase = { x, y, z };
    this.gsap.to(this.camera.position, { x, y, z, duration: 1.4, ease: "power3.inOut" });
  }

  /* ---------------- events / loop ---------------- */
  _bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (e) => {
      this.pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.uniforms) this.uniforms.uPix.value = this.renderer.getPixelRatio();
  }

  start() {
    const tick = () => { this._frame(); this.renderer.render(this.scene, this.camera); this._raf = requestAnimationFrame(tick); };
    tick();
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed = (this.elapsed || 0) + dt;
    const t = this.elapsed;

    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.05;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.05;
    this.camera.position.x = this.camBase.x + this.pointer.x * 0.8 + Math.sin(t * 0.1) * 0.2;
    this.camera.position.y = this.camBase.y - this.pointer.y * 0.6 + Math.cos(t * 0.12) * 0.15;
    this.camera.lookAt(0, this.camBase.y * 0.2, 0);

    if (this.uniforms) this.uniforms.uTime.value = t;
    if (this.live && this.liveMode === "fireworks") this._fwStep(t);
    if (this.stars) this.stars.rotation.y = t * 0.008;
    if (this.nebula) {
      this.nebula.children.forEach((s) => { s.position.y = s.userData.baseY + Math.sin(t * 0.25 + s.userData.ph) * 0.4; });
    }
  }
}
