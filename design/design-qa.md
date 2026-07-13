# Design QA — superseded reference direction

> Superseded on 2026-07-13 by the approved third-person procedural open-world direction. The isometric screenshot comparison below is retained as historical evidence only and is no longer an acceptance gate.

Final result: SUPERSEDED

## Run information

- Date: 2026-07-11
- Application revision: uncommitted initial production build
- Browser/capture method: Playwright CLI direct review plus Visual Fidelity `visual-qa.mjs`
- Base URLs: Vite QA at `http://127.0.0.1:4190`; production preview at `http://127.0.0.1:4191`
- Functional checks: 29/29 Vitest tests, TypeScript, production build, production browser boot, full four-challenge DOM journey, save/continue, keyboard movement, WATTCH proximity/calibration, pause/settings/field-log, 390 x 844 touch layout, and zero console/page errors

## Reference evidence

| Reference id | Source | Actual screenshot | Diff/overlay | Viewport/state | Directly inspected | Result |
|---|---|---|---|---|---|---|
| `voxel-garden-desktop-1536x1024` | `design/reference/voxel-garden-desktop-1536x1024.png` | `design/qa/actual/voxel-garden-desktop-1536x1024.png` | `design/qa/diff/voxel-garden-desktop-1536x1024.png` | 1536 x 1024 / settled gameplay | yes | blocked by VF-002 |

## Mismatch ledger

| Id | Severity | Reference | Status | Mismatch | Source evidence | Render evidence | Fix/resolution |
|---|---|---|---|---|---|---|---|
| VF-001 | P0 | desktop | verified | QA evidence was initially missing. | locked reference | current actual/diff/report | Captured exact viewport, inspected both images, and verified clean console/assets. |
| VF-002 | P1 | desktop | open | Raw pixel mismatch is 51.6434%. The approved source is flattened pixel art while the user explicitly requires a real-time voxel game; the central rendering medium therefore cannot meet the plugin's default pixel threshold without replacing or hiding the requested voxel world. | `design/reference/voxel-garden-desktop-1536x1024.png` | `design/qa/actual/voxel-garden-desktop-1536x1024.png` | Panel geometry, copy, palette, density, x390 world seam, player/turbine/lab anchors, object inventory, and layers were iterated and directly reviewed. Remaining raw mismatch is the intentional pixel-art-to-voxel conversion and cannot be downgraded under the plugin rubric. A newly approved voxel gameplay reference would unblock strict pixel gating. |

## Direct comparison

- **Copy:** brand, navigation, hero statement, feature list, quote, stats, project titles/descriptions, cultivation list, and footer copy are present with the reference capitalization and desktop line structure.
- **Composition:** brand x14–396, hero x14–392/y115–691, stats x15–385/y707–986, project tray x397–1078/y736–987, cultivation x1201–1521/y769–1000, and footer y987–1024 are preserved. The live world begins at the x390 seam.
- **World anchors:** the final camera pass puts the player near x790, turbine near x1440, northwest lab near x540, and project/energy signs in the same visual bands as the source.
- **Typography and UI materials:** local pixel-display plus monospaced fonts, near-black panels, brass keylines, scanlines, chamfers, cream copy, lime active states, and cyan system accents match the extracted system.
- **Voxel assets:** the world includes seven planted beds, domes, lab, reactor, waterfall, stream/bridge, solar arrays, turbine, well, pipes, signs, player, robots, forest edge, and particles as real geometry.
- **Responsive extension:** 390 x 844 title/gameplay/drawer/pause/settings/log states have no overflow, maintain 48 px visible controls, and preserve a clear playfield. Mobile is usable but is not claimed as reference-matched because no mobile source was supplied.
- **Runtime:** automated capture found matching 1536 x 1024 dimensions, no console errors, no runtime errors, and no failed document/script/style/font/image requests.

## Intentional deviations

- The central pixel-art raster is a live, orthographic voxel world as explicitly requested. This is the blocking P1 for strict pixel comparison, not an unrecorded approximation.
- Title, pause, settings, challenge, completion, fallback, touch, responsive, and offline states extend the supplied single desktop frame.
- Unverified external portfolio/contact destinations remain safe in-game information surfaces rather than invented links.

## Regression check

The desktop region was recaptured after shared font, app-shell, camera zoom, camera target, project inspection, and objective-HUD changes. Mobile title/gameplay/drawer and production preview were recaptured after the final UI and chunking fixes. The current production preview has zero console warnings/errors.
