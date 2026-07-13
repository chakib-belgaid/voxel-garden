# Systems Garden — open-world game specification

Status: ACTIVE DIRECTION · 2026-07-13

## Product boundary

`Systems Garden` is a single-player, third-person voxel exploration game for desktop and mobile browsers. Its deterministic 128 × 72-cell island is authored as a terminal-dashboard website and streamed in chunks around the player. A north-up bird view reveals the complete website composition and its clickable sections. Four eco-technology project modules preserve the restoration challenges and ending. There is no combat, backend, account, currency, advertising, or multiplayer.

## Player fantasy and loop

The player is an AI Systems Gardener crossing a reclaimed technological wilderness. They follow an active compass and visible sky-beam, travel between biomes, discover working research labs and roaming helper crews, watch flying workers service the archive and gardens, solve each outpost restoration challenge, and unlock the next signal. The world remains freely explorable after all four systems are online.

## Four outposts

1. **Wattch — Measure · Analyze · Optimize**: calibrate the northern meadow energy station.
2. **Whispbook — Speak · Structure · Refine**: reconnect the archive-grove voice pipeline.
3. **Agent Commerce — Plan · Act · Verify**: route jobs through the eastern exchange.
4. **Dev Tools — Inspect · Compose · Ship**: repair the western highland workshop.

## Verbs and controls

- Move: camera-relative WASD/arrows, touch directional pad, or gamepad left stick/D-pad.
- Sprint: Shift or gamepad left-stick press.
- Jump: Space, the touch jump control, or gamepad South/A.
- Camera: pointer/touch drag, mouse wheel distance, or gamepad right stick.
- Bird view: B, Overview, or outward wheel intent after reaching maximum exploration distance.
- Interact: E/Enter, contextual action button, pointer selection, or gamepad West/X.
- Wave: F or the touch wave button.
- Pause: Escape/P or gamepad Start.
- Open field log: Tab or HUD button.

## World generation and collision

- One perspective camera follows the player in exploration and transitions to an 18-degree, vertical, north-up map framing in bird view.
- Four 128 × 72 PNG layers author surface material, eight 0.45-meter elevation levels, props, and non-overlapping semantic website zones. A checked-in compiler emits compact typed arrays, map bounds, anchors, and section actions.
- Four research labs—energy, bioglass, robotics, and fabrication—sit on secondary trails. Their geometry, clearings, and collision footprints share one lab-site dataset.
- Fifteen instanced helper robots continuously patrol terrain-following routes around the Garden Heart and labs. Their shared patrol poses drive both rendering and dynamic player collision.
- Two archive drones collect visible book payloads from a depot, fly curved routes, and lower them into Whispbook's library receiver. Three garden tenders refill at Mossglass, fly to authored flower beds, and release visible water droplets while hovering.
- Drone routes, job stages, carried payloads, and watering intensity come from one deterministic simulation module. Large worksite equipment participates in authored player collision while the drones remain safely overhead.
- High quality streams a 7 × 7 chunk neighborhood; low quality streams 5 × 5. Bird view renders the complete authored island.
- Rendering and collision share the same compiled cell layers. Void, water, solid props, lab shells, and visible machinery block movement while validated anchor footprints and approaches remain open.
- Terrain height is simulation-readable. Swept movement prevents tunnelling, slides around props, rejects steps above the player climb threshold, and keeps the player separated from moving helper robots.
- Jumping uses a deterministic grounded vertical simulation with gravity, a roughly 1.4-meter apex, one-jump-per-press gating, and reliable terrain landing. Jumping does not bypass tall structure collision.
- The simulation boundary is derived from the compiled map and its void perimeter remains hidden beyond the streamed fog horizon during normal play.

## Progression and persistence

- Restore order remains guided; restored outposts can be revisited.
- Version-6 `localStorage` saves restored ids, player position, settings, ending state, and schema version. Bird view and pending website-section requests are intentionally ephemeral.
- Existing saves migrate into the expanded world when their position remains valid. Positions caught inside newly solid authored structures are nudged to the nearest walkable point; malformed or procedurally obstructed positions recover to the Garden Heart.
- Saveable gameplay state remains in Zustand. React Three Fiber only renders and controls high-frequency presentation.

## UI and accessibility

- Text-heavy surfaces remain semantic DOM over the WebGL world.
- Normal desktop play shows one compact objective/compass chip and one small menu cluster; portfolio content lives in drawers and dialogs.
- Mobile keeps a compact top bar plus touch movement, jump, wave, and interaction controls.
- Camera drag only starts on the canvas, so modal and HUD pointers do not fight camera control.
- Visible focus, Escape handling, focus restoration, screen-reader labels, reduced motion, high contrast, and optional local audio remain supported.
- Settings includes a persistent color-seed randomizer that recolors individual robot bodies, trim, and equipment without rebuilding the swarm.

## Performance and release acceptance

- Terrain and procedural detail are instanced; geometry/materials are shared.
- DPR is capped at 1.8 desktop and 1.4 mobile in high quality; low quality uses DPR 1 and a smaller stream radius.
- Target: 60 fps desktop and stable 30 fps mobile with no runtime network dependency.
- Acceptance requires deterministic generation tests, collision/save/challenge tests, typecheck, production build, and browser playtests for camera, movement, chunk streaming, outpost interaction, desktop HUD, and mobile controls.
