# PRIMARY INSTRUCTION — BUILD OMNISYNAPSE Ω

You are a senior creative technology director, 3D web developer, systems architect and interaction designer. Implement **OMNISYNAPSE Ω — The Cognitive Universe**, an interactive visual command gateway above FOX ORBIT, NEXUS, LAND IQ and the connected FOX tool ecosystem.

## Input files (review all before coding)

- `reference/omnisynapse-reference.png` — visual source of truth.
- `agent/MASTER_DESIGN_BRIEF.md` — exact composition, iconography, effects and behaviour.
- `architecture/scene-spec.json` — machine-readable scene configuration and clickable positions.
- `architecture/symbol-interaction-map.json` — meanings and actions for historic/futuristic symbols.
- `architecture/fox-tool-registry.json` — FOX navigation and platform integration registry.
- `agent/BUILD_ROADMAP.md` — delivery milestones and acceptance criteria.
- `prototype/` — a runnable 2.5D interaction proof-of-concept, **not** the target production implementation.

## Mission

Design and build a visually faithful cinematic, **truly interactive 3D** environment corresponding to the reference image. Every major object must have individual identity, depth, appropriate movement, and meaningful interaction. The interface should provide an intuitive way to discover, navigate, and (with real APIs/permissions) observe the FOX ecosystem.

Do not reproduce the page as a single full-screen image with a few invisible link regions and call it 3D. Instead, build separate 3D models / meshes for the organic/AI hemispheres, rotating orbital rings, fox insignia, symbolic medallions, altar and energy conduit. For detailed architecture, hybrid depth-layered assets are acceptable when full modelling cannot achieve production quality within budget.

## Implementation priorities

1. **Visual fidelity:** symmetry, monumental temple, central bifurcated brain, fox gold, blue/gold contrast, specific symbol positions.
2. **Usable interaction:** smooth intro, hover, selection, fly-to, reset, keyboard and touch, accessible information panels.
3. **Modular FOX registry:** data-driven node creation and routing, not hard-coded one-off pages.
4. **Reliable security:** public visitor intro vs authenticated private command tools, source-of-truth server-side permissions.
5. **Performance:** 60 FPS target on capable desktop, graceful fallback on phones, no motion dependence for essential functionality.

## Production target

- Next.js (App Router), TypeScript and React.
- React Three Fiber + Three.js + Drei.
- GSAP camera timelines, selectively applied postprocessing, accessible HTML overlay.
- Responsive Desktop/Tablet/Mobile design.
- A FOX registry data model that can be expanded to include existing tools, agents, skills, MCP connectors, telemetry and future environments.
- Clean reusable code with a clear separation of `scene`, `ui`, `data-registry`, `auth`, `integrations` and `telemetry`.
- Deployment-ready for Vercel, with documented environment variables and simple local setup.

## UX navigation states

`DORMANT → AWAKENING → TEMPLE_IDLE → NODE_FOCUSED → NODE_DETAILS → EXTERNAL_TOOL`.

Additional distinct states: `BRAIN_COMMAND`, `FOX_ECOSYSTEM`, `ERROR`, `OFFLINE`, `LOW_POWER`.

- Brain click opens **OMNISYNAPSE**.
- Fox logo click opens the **FOX ecosystem** node overview.
- Gold Eye symbols open observer/monitoring conceptual areas.
- Guard statues open access, integrity and security areas.
- Symbols open their domain explanations and optionally mapped FOX tools.
- Display *unavailable/not connected* rather than fabricated 'online' if backend state is absent.

## Hard constraints

- The reference image is supplied by the user for this project; retain it in the project as a visual reference.
- Labels must be accurately written and visually elegant; no random illegible text in functional controls.
- The Egyptian and Mesoamerican motifs are artistic inspirations; do not invent exact translations or historical claims.
- Never expose Supabase service-role secrets, OAuth tokens, GitHub tokens or other credentials in the browser.
- Do not crawl or clone third-party services without explicit permission.
- Preserve user control over agent actions; no autonomous deployment or access changes without authorisation.
- Respect reduced-motion, WCAG keyboard focus and mobile touch.

## Required outputs

1. Working source code, config and setup instructions.
2. Reusable 3D scene components, node registry and UI overlays.
3. Well-defined live-connection API interfaces; mock clearly marked in demo/dev mode only.
4. Working click, hover/focus, zoom, reset, keyboard, touch and search/navigation.
5. A documented low-motion/low-power view.
6. A production build + verification report, and Vercel deploy guide.

**Begin by reading all included files. Then provide an implementation plan, identify any external assets requiring original design/modelling, and implement in phases. Do not ask for details already provided.**
