# Portfolio content handoff — 30 September 2026

Base: `459d045`, the clean `feat/energy-mode-routes` source at `/Users/chakib/Documents/github/voxel-garden-energy-routes`. The initially attached detached revision `ef681c1` predates the recruiter site. Generated Pages destination: `/Users/chakib/Documents/github/chakib-belgaid.github.io`. This branch changes source only; the presentation task should integrate it, visually verify the combined site, and publish once.

## Content

- Applied AI headline, summary, metadata, structured data and home social-card text in English and French.
- MCQ Scan first in selected work, with bilingual routes `/work/mcq-scan` and `/fr/work/mcq-scan` and static prerender registration.
- Homepage project rows retain summary, technologies and case-study link. Long role and architecture descriptions stay on case-study pages.
- France-based worldwide remote availability, no mandatory travel, and English/French near contact.
- Whisperbook, Wattch Core and Systems Garden preserved. No new Booksy feature.

## Claim sources

`/Users/chakib/Documents/applications/cvs`: `UV_CACHE_DIR=/tmp/portfolio-cvdb-cache uv run python scripts/validate_cvdb.py` returned `CV DB valid: 6 sections, 19 evidence cards`.

- `cvdb/evidence/mcq-agentic-ai-platform.yaml`: no-code multi-agent platform, ad/ops workflows, API/frontend/deployment ownership, two-person engineering coordination.
- `cvdb/evidence/mcq-gcp-deployment.yaml`: Cloud Run, Secret Manager, Artifact Registry, Docker, GitHub Actions.
- `cvdb/evidence/structured-output-llm-pipelines.yaml`: constrained decoding and structured outputs. Avoided presenting schema validity as semantic accuracy.
- `cvdb/evidence/mcq-local-model-optimization.yaml`: reported 60% inference-latency reduction and 7B-class model fine-tuning. Did not add the 95% task-accuracy metric without a public task/evaluation definition.
- Direct user account supplied in task: platform architecture/deployment on GCP and compilation for a client-infrastructure delivery without providing source. No protection guarantee, reverse-engineering prevention, or saved-deal claim.
- Direct user preference: based in France, worldwide remote while staying in France, no mandatory travel.

## Evidence limits

MCQ source code, client topology, screenshots, benchmark baseline/methodology, evaluation datasets and deployment manifests are not public in the material supplied. The case study visibly states these limits and identifies the company website as company context, not independent proof. Do not add invented users, revenue, accuracy, uptime or client names. No live production audit was performed.

Existing downloadable resume files remain the existing artifacts; this update does not claim to regenerate their PDFs. Final browser/layout QA belongs to the presentation integration, including the media-free MCQ row, long French text, MCQ route navigation and social-card text fit.

## Validation

`bun run check` passed: authored map freshness, 100 tests across 10 files, application/tool TypeScript checks, client/server builds, recruiter bundle isolation, and prerender of 10 recruiter documents. `git diff --check` passed. Generated English/French MCQ documents contain the full case study and language-specific metadata. Existing tests were updated for the intentional headline and route additions.
