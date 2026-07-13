# Asset inventory

Status: COMPLETE

| Id | Reference/region | Visible element | Classification | Source/output path | Dimensions/format | Variants/states | Treatment | Status |
|---|---|---|---|---|---|---|---|---|
| `reference-desktop` | complete viewport | approved source | existing raster | `design/reference/voxel-garden-desktop-1536x1024.png` | 1536 x 1024 PNG | settled gameplay | immutable, hash locked | ready |
| `generated-key-art` | title/credits extension | voxel island illustration | generated raster | source: `design/assets/source/voxel-garden-key-art.png`; ship: `public/assets/generated/voxel-garden-key-art.jpg` | 1672 x 941 PNG / 1400 x 788 JPEG | title, credits | centered crop, dark edge veil, 425 KB shipping copy | integrated |
| `world-terrain` | playfield | island, water, paths, cliffs, forest | Canvas/WebGL | `src/game/world/staticWorld.ts`, `VoxelPrimitives.tsx` | 3,470 authored voxels / 36 material batches | desktop/mobile quality | orthographic, matte, instanced, capped DPR | integrated |
| `world-landmarks` | playfield | lab, domes, reactor, waterfall, solar, turbine, pump, bridge | Canvas/WebGL | `src/game/world/Landmarks.tsx` | procedural/faceted geometry | active/inactive/restored | upper-left light, compact shadows, brass/cyan details | integrated |
| `world-garden` | playfield | seven crop beds, irrigation, produce crate, flowers | Canvas/WebGL animation | `src/game/world/staticWorld.ts`, `GardenParticles.tsx` | procedural instanced geometry | dormant, growing, restored | dense crops, shared materials, reduced-motion particles | integrated |
| `player-voxel` | playfield | gardener and watering can | Canvas/WebGL animation | `src/game/entities/Player.tsx` | procedural voxel rig | idle, walk, interact, wave | cream coat, dark hair, bottom-center pivot | integrated |
| `robots-voxel` | playfield/header/stats | helper bots | Canvas/WebGL animation | `src/game/entities/RobotSwarm.tsx` | procedural voxel rigs / 7 calls | idle, travel, work, celebrate | cream/brass body, cyan face, sprout/antenna | integrated |
| `project-beacons` | playfield | four interactive systems | Canvas/WebGL + DOM | `src/game/world/Landmarks.tsx`, `src/ui/GameUI.tsx` | geometry plus semantic dialogs | dormant, locked, near, active, restored | project-specific accent and proximity-gated restoration | integrated |
| `water-particles` | playfield | waterfall, streams, foam, ripples | Canvas/WebGL animation | `src/game/world/Landmarks.tsx`, `GardenParticles.tsx` | procedural geometry/particles | normal, reduced-motion | cyan/teal, quality-capped particles | integrated |
| `world-signs` | playfield | Whispbook, energy, Wattch, Agent labels | Canvas/WebGL geometry | `src/game/world/Landmarks.tsx` | voxel letter geometry | static/status | diegetic text only, lime/cyan/purple lettering | integrated |
| `hud-panels` | all UI | header, hero, stats, tray, cultivation, footer | code-native UI | `src/ui/GameUI.tsx`, `src/styles/*` | responsive DOM/CSS | desktop, compact, mobile drawers | layered brass borders, scanlines, chamfers | integrated |
| `hud-icons` | all UI | feature/project/status/action icons | icon | `lucide-react` with custom CSS framing | SVG at runtime | default/active/disabled | 1.5–2 px stroke, currentColor | integrated |
| `fonts-display` | UI | brand, hero, diegetic headings | existing licensed font package | `@fontsource/jersey-10/latin-400.css` | locally bundled WOFF/WOFF2 | regular | no runtime font request | integrated |
| `fonts-mono` | UI | navigation, body, controls | existing licensed font package | `@fontsource/ibm-plex-mono/latin-*.css` | locally bundled WOFF/WOFF2 | 400, 500, 600 | no runtime font request | integrated |
| `audio-runtime` | all gameplay | ambience, interactions, success, UI | Web Audio synthesis | `src/audio/AudioManager.ts` | procedural | mute/volume; all cues have visual equivalents | no external copyrighted audio | integrated |

## Provenance

- The desktop reference was supplied by the user in this task.
- `generated-key-art` was produced with OpenAI image generation from the user-supplied reference for this game. The original generated file remains in the Codex generation store; the repository contains a working copy.
- Runtime voxel art is original procedural geometry built for this project. No legacy raster is shipped as gameplay geometry.
- Font and icon packages are bundled through npm/Bun and retain their package licenses.

## Production rule

All listed production assets are integrated, optimized, and browser-verified. No placeholder raster, remote font, stock asset, external audio, or runtime network dependency remains.
