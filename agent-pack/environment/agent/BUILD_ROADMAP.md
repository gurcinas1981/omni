# BUILD PLAN & ACCEPTANCE CHECKLIST

## Phase 0 — Read and map

- Inspect reference artwork in full resolution and compare against the positions in `architecture/scene-spec.json`.
- Establish a scene coordinate system normalised to the reference 1648×928 image.
- Catalogue individual models and required source assets. Decide on original geometry, procedural materials and optional bespoke 3D files.
- Prepare a CSS/HTML fallback and clarify public/private route boundaries.

## Phase 1 — Functional foundation

- Create Next.js/TypeScript app with isolated `app`, `components/scene`, `components/ui`, `lib/registry`, `lib/auth`, `lib/telemetry` modules.
- Create scene state machine and data-driven nodes sourced from validated registry.
- Build semantic/keyboard-friendly fallback UI before integrating expensive 3D.
- Render loading, disconnected and failure states explicitly.

## Phase 2 — 3D scene

- Camera: constrained cinematic 3/4 forward view corresponding to art; controlled focus and reset.
- Geometry: two brain halves, fox logo, one or more orbits, symbolic frames and medallions, altar, obelisk silhouettes, perspective floor.
- Background: high-detail temple architecture and statues in layered geometry/3D models, parallax or environment texture with independent interactive entities.
- Special effects: neural particles, travel-path pulses, limited bloom, volumetric glow, Matrix-like glyphs.
- All important elements must be independently selectable (raycast/pointer) and addressable by stable ID.

## Phase 3 — Interaction and information

- Intro with 'Skip', deep-linkable nodes and selection panels.
- Hover/focus highlighting, tap-to-select, camera focus, reset, tool search and keyboard shortcuts.
- FOX registry panel and route navigation.
- Correct external links: confirm user intent before leaving if an unsaved operation would be lost.

## Phase 4 — Operational backend (only where credentials/services exist)

- Authenticated user/role/access handling. Default deny for private areas.
- Typed server-side integrations with FOX tool endpoints; no direct insecure scraping from browser.
- Connection diagnostics (connected/disconnected/unknown) with timestamps and source provenance.
- Optional WebSocket/SSE only where a real backend supports it.
- Error logging and observability without leaking private fields.

## Phase 5 — Quality and deployment

- Responsive performance profile, device pixel ratio limits, lazy asset loading, scene quality presets.
- `prefers-reduced-motion`, focus outlines, meaningful ARIA labels and no keyboard traps.
- Verify touchscreen usability at 390px viewport; desktop at 1440px and 1920px.
- Include FPS, loading/time budget and reduced power tests.
- Document local installation, Vercel deployment, environment variables and update process.

## Pass/fail acceptance

- [ ] The central brain visibly has distinct organic left and digital right hemispheres.
- [ ] The fox logo is visually centred in the vertical energy beam.
- [ ] Eight symbols are separately interactive, correct and readable.
- [ ] Ancient glyph columns, guardians, pyramids and circuit floor evoke the reference.
- [ ] It is actual 3D (at least core foreground architecture) rather than a static image with fake hotspots.
- [ ] User can hover/focus, select, leave a panel, restore view and follow an existing FOX website destination.
- [ ] External links appear only where known; unresolved targets are marked unconfigured.
- [ ] Private data isn't accessible through public JS or unauthorised API calls.
- [ ] No fabricated operational statuses are displayed.
- [ ] Desktop, tablet and phone are usable; fallback works without WebGL.
- [ ] All major animations respect reduced-motion preferences.
- [ ] Build passes lint/typecheck and Vercel production build.
