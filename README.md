# CRO AI Activation Community — Website (bright "shapes" edition)

A clean, bright, community-led website built on a **new floating-3D-shapes engine** —
glossy, candy-coloured shapes (sphere, cube, cylinder, star, octahedron, torus…) drift,
bob and rotate over a white page. Inspired by the Cohesion / Larry Framer aesthetic.

> This is a deliberate departure from the particle engine. The **particle engine is
> untouched** — it still powers `main`, the presentation decks, and the previous
> particle-background version of this site (`site/cro-ai-activation-community`).

## Run it

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

No build step. Three.js + GSAP are vendored locally; fonts load from Google Fonts.

## How it's built

A **hash-routed single-page site** — the 3D background never reloads between pages; the
shapes just reshuffle.

```
index.html            # shell: nav, background canvas, #main, footer
assets/
  css/site.css        # bright/white theme, soft-shadow cards, pill nav
  js/shapes.js        # the new engine — floating glossy 3D shapes
  js/site.js          # router + all page content + nav + forms
  js/scene.js         # (the older particle engine — present but UNUSED here)
  vendor/             # three.js (+ RoomEnvironment, RoundedBoxGeometry) + gsap
```

### The shapes engine (`shapes.js`)

- `MeshPhysicalMaterial` + a `RoomEnvironment` image-based light give the glossy candy
  look; soft drop-shadow sprites sit beneath each shape and fade as it lifts.
- Ten shapes are laid out around the frame edges so page content stays clear; each bobs
  on a sine, spins slowly, and follows the pointer with gentle parallax.
- **One shape per page comes forth.** `feature(route)` is called on every route change:
  it deterministically promotes a different shape to a large, slow "feature" that drifts
  across the page (wrapping at the edges) while the other nine recede (shrink + dim). The
  content sits on frosted glass (translucent panels/cards + a hero veil) so it reads
  cleanly over the moving shape.
- Honours `prefers-reduced-motion` (the feature shape is placed but does not drift).

### Pages

Home · Join · Start Here · Share Your Story · Share Your Work · Submission Gallery ·
Learning Lane · Expert Clinic · Certification Support · AI Activation for Teams ·
License & Access Help · Leaders Listening Post · Recognition & Leaderboard · Community
Calendar · Weekly Challenges.

Content is the same as the particle-background version: real Teams join link, the AI
April portfolio gallery (self-hosted thumbnails), leadership messages (Martyn, Shane,
Eamonn), and the six-cert certification map with voices. Forms are presentational demos
(toast on submit).

---

*Built for the CRO AI Activation Community. Clean, bright, happy — the community wants you.*
