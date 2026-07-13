# Design specification

Status: COMPLETE

## References and scope

| Reference id | File | Route/state | Native viewport | Region | Notes |
|---|---|---|---|---|---|
| `voxel-garden-desktop-1536x1024` | `design/reference/voxel-garden-desktop-1536x1024.png` | `/?qa=reference`, settled gameplay | 1536 x 1024 | complete first viewport | Approved user reference. Coordinates below are measured estimates. |

The reference is the visual contract for the desktop gameplay state. The new product is a real-time voxel adaptation, so the central pixel-art garden is intentionally rebuilt as procedural WebGL geometry while its object inventory, orthographic framing, density, silhouettes, palette, and UI composition remain the comparison target. Mobile, menu, pause, dialog, focus, and game-complete states are extensions because the supplied reference does not show them.

## Exact visible copy

### Header and terminal

- `CHAKIB BELGAID`
- `AI SYSTEMS GARDENER`
- `HOME`, `PROJECTS`, `ABOUT`, `BLOG`, `EXPERIMENTS`, `CONTACT`
- `>.building useful things.`
- `measuring what matters.`

### Left hero

- `I GROW SYSTEMS`
- `THAT THINK, MEASURE`
- `AND SAVE ENERGY.`
- `I build AI systems, developer tools and infrastructure that are intelligent, efficient and impactful.`
- `AI Agents & Automation`
- `Developer Tools`
- `Energy-Aware Systems`
- `Research & Prototyping`
- `_Measure before you optimize.`
- `"Understand before you build."`
- `VIEW PROJECTS`
- `READ THE BLOG`

### Diegetic world labels

- `VEGAPUNK`, `01`
- `MEASURE`, `LOG`, `LEARN`, `IMPROVE`
- `ENERGY`, `AWARE`, `BY DESIGN`
- `WATTCH`, `87%`

### Statistics and project tray

- `GITHUB STATS`
- `82+` / `Repositories`
- `1.5k+` / `Stars`
- `300+` / `Contributions`
- `2017` / `Joined GitHub`
- `Building in public since day one.` / `100%`
- `FEATURED PROJECTS`
- `WATTCH` — `Energy profiler for AI workloads. Measure. Analyze. Optimize.`
- `WHISPBOOK` — `AI voice system to create books using TTS.`
- `AGENT COMMERCE` — `Exploring agentic commerce systems & autonomous workflows.`
- `DEV TOOLS` — `CLIs, libraries and tools that make developers 10x more productive.`
- `VIEW ALL PROJECTS →`

### Cultivation panel and footer

- `CURRENTLY CULTIVATING`
- `Local-first AI systems`
- `Energy-aware research`
- `Open source everything`
- `Always learning, always building.`
- `© 2024 Chakib Belgaid`
- `Built with 💚, React & lots of ☕`
- `Let's build a better future.`

## Composition and grid

- Native page: fixed first viewport, 1536 x 1024. It is a dense poster-like composition with almost no conventional whitespace.
- Brand plaque: x14–396, y10–91.
- Top navigation: x397–1231, y0–61; active `HOME` control x415–503.
- Terminal plaque: x1234–1521, y12–83.
- Left hero: x14–392, y115–691.
- GitHub stats: x15–385, y707–986.
- Featured-project tray: x397–1078, y736–987.
- Currently-cultivating panel: x1201–1521, y769–1000.
- Footer: y987–1024.
- World/playfield starts near x390, y60 and continues behind the lower overlays. Its main anchors are the player near (790,443), lab/tree dome near (652,127), bioreactor near (879,211), waterfall near (1035,139), flower dome near (1367,299), and turbine near (1424,180).
- Negative space is created by stone paths, water, and dark panel interiors; a landmark or crop cluster appears about every 64–100 px.
- Layer order: water/ground → paths/plot foundations → crops/buildings → actors/props → foliage/particles → code-native HUD.
- Foliage and brass corner details may cross panel edges to visually join world and interface.

## Typography

| Role | Family | Size | Weight | Line height | Tracking | Width/wrap rule |
|---|---|---:|---:|---:|---:|---|
| Brand | Jersey 10, pixel-display fallback | 32 px | 400 | 0.9 | 0.04em | single line at desktop |
| Hero display | Jersey 10 | 38 px | 400 | 0.96 | 0.035em | three authored lines |
| Navigation | IBM Plex Mono | 15 px | 500 | 1 | 0.08em | uppercase, single line |
| Panel title | IBM Plex Mono | 15–17 px | 500 | 1.15 | 0.06em | uppercase |
| Body | IBM Plex Mono | 13–15 px | 400 | 1.55 | 0 | preserve readable measure |
| Diegetic sign | Jersey 10 | 18–24 px | 400 | 1 | 0.03em | neon lime, narrow |
| Mobile HUD | IBM Plex Mono | 12–14 px | 500 | 1.25 | 0.03em | truncate only non-critical labels |

Display text uses a compact dark offset shadow. Code-native UI stays full-resolution even when the WebGL scene uses a lower internal DPR/pixelation treatment.

## Color and effects

| Token | Value | Usage |
|---|---|---|
| `--void-950` | `#020b0e` | page void and deep shadow |
| `--panel-900` | `#041317` | main panel surface |
| `--panel-800` | `#071a1d` | lifted panel surface |
| `--brass-700` | `#3b351d` | outer frame |
| `--brass-400` | `#756238` | bevel highlights and rivets |
| `--cream-100` | `#e7ded0` | primary copy |
| `--cream-400` | `#aaa093` | muted copy |
| `--brand-gold` | `#e7a43d` | nameplate and reward |
| `--lime-400` | `#9bd42b` | active navigation and healthy status |
| `--leaf-700` | `#245d17` | deep foliage |
| `--leaf-500` | `#6fa523` | highlights/crops |
| `--cyan-400` | `#29b8c7` | screens, water, interaction |
| `--cyan-200` | `#70d8df` | foam and glow |
| `--water-600` | `#006b79` | water body |
| `--stone-400` | `#8d8962` | paths and foundations |
| `--soil-700` | `#3b3017` | beds |
| `--solar-700` | `#0b3766` | panels |
| `--purple-500` | `#8537da` | Whispbook accent |
| `--orange-500` | `#dd8615` | Dev Tools/harvest accent |
| `--red-500` | `#c74726` | heart/crop warning |

Panels are opaque blue-black metal/glass surfaces with layered 1–2 px aged-brass borders, compact down-right shadows, chamfered corners, corner rivets, subtle scanlines, and occasional moss. No soft glassmorphism, generic gradients, large blur, or rounded SaaS cards.

## Spacing and sizing

- Base spacing unit: 8 px; half step: 4 px.
- Desktop panel padding: 22–36 px; compact tray padding: 12–16 px.
- Desktop control height: 40–44 px; mobile touch target: minimum 48 x 48 CSS px.
- Borders: 1 px inner cyan/brass keyline plus 2–3 px outer dark/brass frame.
- Corners: 2–6 px or clipped/chamfered; never pill-shaped except compact status chips.
- Persistent UI follows the reference at ≥1440 px. Gameplay modals are centered but limited to 560 px and pause the simulation.

## Asset treatment and layering

- Generated key art: 1672 x 941 PNG source, used only behind the title/credits surfaces, cropped center with a dark edge veil. It contains no interface text.
- Gameplay world: real-time Canvas/WebGL using authored voxel geometry. Camera is orthographic, pitched approximately 55°, with restrained yaw and no free-perspective orbit in the reference state.
- Voxel materials use matte colors, upper-left key light, dark bottom/right faces, compact shadows, and shared material instances. Avoid smooth realistic PBR and sparse Minecraft-like terrain.
- Domes and water may use stepped low-poly transparent meshes; pipes, turbine blades, and round machinery use deliberately faceted meshes so silhouettes remain readable.
- Repeated terrain, path, crop, water-edge, and foliage voxels are instanced.
- Main player: cream coat, dark trousers/hair, warm skin, cyan watering can. Robots: cream/brass cuboid body, cyan face screen, dark wheels/feet, tiny sprout/antenna.
- The runtime world includes: eco-lab/tree dome, sapling bioreactor, waterfall/stream, solar arrays, turbine, flower dome, seven beds, harvest crate, circular well, exposed pipe network, bridge, forest perimeter, drones/robots, particles, flowers, stones, and signage.

## Components and states

- `GameShell`: loading, title, gameplay, paused, completion, WebGL-fallback.
- `TopRail`: desktop brand/navigation/terminal; active, hover, focus-visible.
- `HeroPanel`, `StatsPanel`, `ProjectsTray`, `CultivationPanel`, `FooterRail`: desktop reference composition; tray/panels collapse into drawers under 1024 px.
- `ObjectiveChip`, `InteractionPrompt`, `EnergyMeter`, `ToolBelt`, `TouchControls`: normal, warning, completed, disabled.
- `ProjectDialog`: four project variants, challenge steps, restored state; focus trapped and Escape-safe.
- `PauseMenu`, `SettingsDialog`, `ResetConfirm`, `FieldLog`: open/closed with world input gated.
- `VoxelWorld`: loading, settled, moving, interacting, paused, restored.
- Motion: water flow, turbine/drone/robot idle, crop sway, dome shimmer, ripples, cursor blink, and limited particles. Reduced-motion disables decorative particles, bobbing, camera easing, and non-essential transitions.

## Responsive contract

- ≥1440 px: preserve the approved 1536 x 1024 composition proportionally, including the x390 UI/world seam and the fixed lower trays.
- 1024–1439 px: retain a narrower left HUD, center the camera nearer the player, collapse the project tray on demand, and preserve the top rail.
- <1024 px: full-screen world; hero, stats, projects, and cultivation content become drawers/sheets opened from a compact top HUD.
- Portrait/mobile: fixed playable camera centered on player, compact objective chip, bottom tool/action dock, virtual movement pad, safe-area padding, and 48 px targets. Do not shrink the entire desktop poster until copy is unreadable.
- World input is disabled whenever a drawer or modal is open. Keyboard, pointer, touch, and gamepad prompts reflect the most recent modality.
- Mobile is an intentional extension and is verified for usability, but is not claimed as visually matched until a mobile reference is supplied and locked.

## Intentional deviations

- The central flattened pixel-art world becomes a live voxel reconstruction so the supplied image can function as a game.
- Reference portfolio links are represented as safe in-game panels unless verified external destinations exist.
- `© 2024` is preserved in the reference-comparison desktop state; production footer uses the current year outside deterministic QA mode.
- Menu, pause, challenge, completion, fallback, responsive, accessibility, and reduced-motion views extend the extracted system because they are absent from the reference.

## Unresolved blockers

None for the configured desktop gameplay region. Additional approved references are needed before mobile or modal states can be described as visually faithful.
