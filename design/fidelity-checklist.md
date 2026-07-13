# Fidelity checklist

> Historical isometric-reference checklist. Superseded on 2026-07-13 by `design/game-spec.md`; do not use this file as the acceptance gate for the third-person open-world build.

## Before coding

- [x] Approved references are in `design/reference`.
- [x] Config contains every approved viewport, region, route, and state.
- [x] Exact visible copy is transcribed.
- [x] Composition, typography, palette, spacing, effects, crops, and layering are extracted.
- [x] Responsive and interaction behavior is recorded; unreferenced states are labeled extensions.
- [x] Every visible element is classified in the asset inventory.
- [x] Required generated title artwork is produced and recorded.
- [x] Runtime voxel asset kit is implemented and integrated.
- [x] Reference hashes are locked.

## Desktop gameplay region

- [x] Implemented from the extracted contract.
- [x] Captured at 1536 x 1024 in deterministic settled state.
- [x] Reference and actual image inspected directly.
- [x] Copy and line wrapping match.
- [x] Macro panel composition and world-anchor density were directly reviewed.
- [x] Typography and control text match the extracted system.
- [x] Spacing and alignment match the measured panel geometry.
- [x] Palette, effects, borders, and radii match the extracted system.
- [x] Assets, crops, masks, and layers are production assets rather than placeholders.
- [x] Responsive behavior and states are usable.
- [x] Console and asset loading are clean.
- [ ] No P0–P2 issue remains.

## Handoff

- [ ] All configured regions passed.
- [x] All references have current evidence.
- [x] Earlier regions were regression-checked after shared changes.
- [ ] No P0–P2 issue is open.
- [ ] Design QA says PASSED.
- [ ] Fidelity gate exits zero.
