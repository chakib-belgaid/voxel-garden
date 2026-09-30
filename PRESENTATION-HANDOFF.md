# Portfolio presentation and integration — 30 September 2026

Source base: `459d045` (`feat/energy-mode-routes`), matching the published portfolio. The attached old `main` revision predates the recruiter website. The unrelated dirty garden-fidelity checkout was not changed.

Integrated content commit: `5886746`, applied as `d7e1047`. Presentation: `4c06434`, followed by the final integration polish commit. The project-row conflict was resolved by retaining the shortened technology-only metadata and moving its case-study link beside the summary.

## Changed behavior

- Professional `/live` and French pages use system sans-serif headings/body with the existing dark, lime and technical visual language. Pixel typography remains in creative modes.
- Compact opening layout and evidence rail; MCQ Scan leads three selected projects, identified as professional work.
- Project summaries and case-study links are grouped, with deeper detail on bilingual case-study pages. Captions remain readable outside screenshots.
- Mobile menu closes on section selection; Escape closes it and restores button focus.
- Modes and modelled-energy controls occupy a dedicated strip instead of obscuring the headline or project text. Energy state and calculation code are unchanged.
- Downloadable CVs, contact links and optional Systems Garden remain intact. Existing PDFs were not regenerated.

## Verification before publishing

- `bun run check`: map freshness, 100 tests, both TypeScript checks, production build and 10 prerendered documents passed.
- Recruiter static graph: 87.3 KB gzip, below 150 KB limit; no Three.js/game sources.
- Real Chromium inspection at 390, 820 and 1440 px. All eight English/French home and case-study routes: no horizontal document overflow and zero axe WCAG 2 A/AA + 2.1 AA violations (24 route/width combinations). Fixed low contrast on inactive mode measurement labels.
- Mobile menu opening, section selection and Escape focus restoration checked. Screenshot files and accessibility report are in `output/playwright/` (ignored generated evidence).
- Automated accessibility checks are not a complete accessibility certification. No physical phone or assistive-technology session was performed.
- MCQ evidence limits are documented in `CONTENT-HANDOFF.md` and the public case study; no live production audit is claimed.

## Publishing

Target: `chakib-belgaid/chakib-belgaid.github.io`, GitHub Pages from `main` at `/`.
Copy only the generated static build; retain `.git`, `.gitattributes` and `.nojekyll`; omit source maps and Vite build metadata. Final publish receipt and deployed-browser evidence are reported in the chat.
