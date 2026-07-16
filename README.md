# Systems Garden

A single-player third-person voxel exploration game and playable portfolio built on a deterministic bitmap-authored island.

Explore the 128 × 72-tile Terminal Garden Dashboard to restore Wattch, Whispbook, Agent Commerce, and Dev Tools through distinct interactive challenges. Zoom out or press `B` and the physical island resolves into a north-up portfolio website: tiled typography, garden modules, stats, projects, cultivation, and contact areas become accessible sections. Robots and drones keep running as ambient details in both views.

## Play

```bash
bun install
bun run dev
```

Open one of the explicit experience routes (Vite will select the next free port when needed):

- `http://127.0.0.1:4173/ascii` — text-only experience
- `http://127.0.0.1:4173/live` — recruiter-facing portfolio
- `http://127.0.0.1:4173/game` — interactive 3D garden

The shared meter keeps an independent, transferred-data-based energy estimate for each mode so the cost difference remains visible while switching routes. `/` and `/garden` remain compatibility redirects to `/live` and `/game`.

### Controls

- Move: `WASD` or arrow keys
- Sprint: `Shift`
- Jump: `Space`
- Look: drag the mouse/touch surface; use the wheel to change camera distance
- Bird view: press `B`, use **Overview**, or keep zooming out at maximum camera distance
- Interact: `E` or `Enter`
- Wave: `F`
- Field log: `Tab`
- Pause/resume: `P` or `Escape`
- Touch: on-screen direction pad plus jump, wave, and action buttons
- Gamepad: left stick movement, right stick camera, left-stick sprint, South/A jump, and West/X interaction
- Robot colors: open Settings and use **Randomize** to roll a new persistent crew palette

## Production checks

```bash
bun run check
bun run preview
```

`bun run check` validates generated map freshness, runs the simulation/collision/camera/UI tests, checks TypeScript, and produces the optimized build. Use `bun run map:build` after intentionally editing any bitmap layer.

## Deployment

The output is a static `dist/` directory. The repository includes:

- `vercel.json` for Vercel
- `netlify.toml` and `_redirects` for Netlify
- a GitHub Actions verification workflow
- immutable asset caching/security headers
- a same-origin service worker for offline reloads after the first visit

No backend, account, external font request, analytics request, or runtime API is required.

## Architecture

- `src/game/store.ts` — authoritative progression, versioned persistence, and input state
- `src/game/challenges.ts` — four validated restoration challenges
- `design/maps/terminal-dashboard/` — durable concept reference, editable 128 × 72 bitmap layers, palette/schema, and anchors
- `scripts/compile-world-map.ts` — deterministic palette, dimension, zone, footprint, reachability, and generated-output validator
- `src/game/collision.ts` — swept movement, bitmap/authored/dynamic colliders, robot separation, sliding, and map bounds
- `src/game/jump.ts` — deterministic grounded jump, gravity, apex, and landing simulation
- `src/game/world/generated/terminalDashboardMap.ts` — compact typed layers plus bounds, anchors, and semantic website sections
- `src/game/world/procedural.ts` — compatibility terrain API backed by the compiled bitmap map
- `src/game/world/ProceduralTerrain.tsx` — locally streamed exploration chunks and complete bird-view island rendering
- `src/game/world/labs.ts` / `LabSites.tsx` — shared lab placement data plus four distinct research facilities
- `src/game/world/drones.ts` / `entities/DroneFleet.tsx` — deterministic courier/tender jobs with instanced flying workers, carried books, and water streams
- `src/game/world/DroneWorksites.tsx` — Whispbook book depot/receiver plus Mossglass refill station and flower beds
- `src/game/world/GameCanvas.tsx` — perspective third-person camera and orbit controls
- `src/game/world/robots.ts` / `entities/RobotSwarm.tsx` — shared patrol simulation, dynamic collision, instanced rendering, and seeded palettes
- `src/ui/GameUI.tsx` — accessible DOM HUD, title, dialogs, settings, mobile controls, and ending
- `src/audio/AudioManager.ts` — optional locally synthesized audio
- `design/` — locked reference, extraction, asset provenance, and visual-QA evidence

The renderer never owns saveable game rules. React Three Fiber draws the world; the Zustand simulation/store owns progression, collision, settings, and persistence.

## Art provenance

The selected fifth bird-view concept is preserved at `outputs/concept-art/voxel-website-birdview/generated/05-terminal-dashboard.png` and beside the authored map as `design/maps/terminal-dashboard/reference.png`. All runtime terrain comes from the local bitmap pack; there is no runtime image or network dependency.
