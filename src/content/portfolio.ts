export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const projectSlugs = ["whispbook", "wattch"] as const;
export type ProjectSlug = (typeof projectSlugs)[number];

export const projectSectionOrder = [
  "context",
  "ownership",
  "architecture",
  "decisions",
  "reliability",
  "outcome",
  "proof",
] as const;
export type ProjectSectionKey = (typeof projectSectionOrder)[number];

export interface EvidenceReference {
  label: string;
  source: string;
  sourceUrl?: string;
  note: string;
}

export const evidenceReferences = {
  "cvdb:mcq-local-model-optimization": {
    label: "MCQ Scan local-model optimization",
    source: "CVDB / mcq-local-model-optimization",
    note: "Source for the 60% inference-latency reduction.",
  },
  "cvdb:qarnot-powerapi-deployment": {
    label: "PowerAPI deployment at Qarnot / Inria",
    source: "CVDB / qarnot-powerapi-deployment",
    sourceUrl: "https://github.com/powerapi-ng/powerapi",
    note: "Source for the 100+ deployed computing nodes.",
  },
  "cvdb:pyjoules-energy-measurement": {
    label: "pyJoules open-source project",
    source: "CVDB / pyjoules-energy-measurement",
    sourceUrl: "https://pypi.org/project/pyJoules/",
    note: "Source for the recorded 98k total PyPI downloads.",
  },
  "cvdb:mcq-agentic-ai-platform": {
    label: "MCQ Scan agentic AI platform",
    source: "CVDB / mcq-agentic-ai-platform",
    sourceUrl: "https://mcq-scan.com/",
    note: "Evidence for AI-platform architecture and delivery ownership.",
  },
  "cvdb:phd-green-coding": {
    label: "Ph.D. in green coding and energy-aware software",
    source: "CVDB / phd-green-coding",
    note: "Evidence for doctoral research and the 2022 defense.",
  },
  "cvdb:funecs-ooredoo-campaign": {
    label: "Funecs serious-games startup",
    source: "CVDB / funecs-ooredoo-campaign",
    note: "Evidence for founder-level product and client-delivery work.",
  },
  "cvdb:career-timeline": {
    label: "CVDB-derived general career timeline",
    source: "CVDB output / hellowork-general-profile resume",
    note: "Source for the 2014-present chronology and the conservative 10+ years summary.",
  },
  "cvdb:whispbook-agentic-audiobook": {
    label: "Whispbook agentic audiobook pipeline",
    source: "CVDB / whispbook-agentic-audiobook",
    sourceUrl: "https://github.com/chakib-belgaid/whispbook",
    note: "Evidence for planner/coordinator experiments, controlled context, speaker attribution, LoRA and evaluation reports.",
  },
  "cvdb:wattch-rust-energy-profiler": {
    label: "Wattch Rust energy profiler",
    source: "CVDB / wattch-rust-energy-profiler",
    sourceUrl: "https://github.com/chakib-belgaid/Wattch",
    note: "Evidence for the Rust daemon/CLI, RAPL, protobuf and Unix-socket architecture.",
  },
  "repo:whispbook": {
    label: "Whispbook public source repository",
    source: "whispbook / README.md and backend/app",
    sourceUrl: "https://github.com/chakib-belgaid/whispbook",
    note: "Evidence for the current React/FastAPI self-hosted studio, local TTS and export workflow.",
  },
  "repo:whispbook-training": {
    label: "Whispbook speaker-attribution training scaffold",
    source: "whispbook-voice-annotator-training / src and schemas",
    sourceUrl: "https://huggingface.co/chakibmed/whispbook-qwen3-4b-speaker-lora-speaker_lora_v1_easy_evidence_only_cleaned",
    note: "Evidence for schema-constrained attribution, local MLX/Unsloth LoRA preparation and evaluation-report code.",
  },
  "repo:wattch": {
    label: "Wattch public source repository",
    source: "Wattch / README.md, crates and proto",
    sourceUrl: "https://github.com/chakib-belgaid/Wattch",
    note: "Evidence for the original protobuf-framed RAPL daemon/CLI prototype.",
  },
  "repo:wattch-core": {
    label: "Wattch Core local source repository",
    source: "wattch-core / README.md, docs and crates",
    note: "Evidence for the protocol-first rewrite, deterministic daemon, replayable traces and privilege boundary; the local origin URL was not public during the audit.",
  },
} as const satisfies Record<string, EvidenceReference>;

export type EvidenceId = keyof typeof evidenceReferences;

export interface EvidenceMetric {
  id: string;
  label: string;
  value: string;
  evidenceIds: EvidenceId[];
}

export interface ProofLink {
  id: string;
  label: string;
  url: string;
  kind: "repository" | "documentation" | "demo" | "profile" | "model";
}

export interface ProjectMedia {
  id: string;
  kind: "image" | "terminal" | "diagram";
  src: string;
  alt: string;
  caption: string;
  evidenceIds: EvidenceId[];
}

export interface TechnologyGroup {
  label: string;
  items: string[];
}

export interface EngineeringDecision {
  decision: string;
  rationale: string;
  rejectedAlternative: string;
}

export interface ProjectCaseStudy {
  slug: ProjectSlug;
  locale: Locale;
  sectionOrder: readonly ProjectSectionKey[];
  name: string;
  eyebrow: string;
  summary: string;
  problem: string;
  role: string;
  architecture: { overview: string; flow: string[] };
  responsibilities: string[];
  decisions: EngineeringDecision[];
  reliability: string[];
  outcomes: EvidenceMetric[];
  currentStatus: string;
  technologyGroups: TechnologyGroup[];
  media: ProjectMedia[];
  proofLinks: ProofLink[];
  metadata: { title: string; description: string };
}

export interface PortfolioSiteContent {
  locale: Locale;
  nav: {
    work: string;
    experience: string;
    about: string;
    garden: string;
    cv: string;
    contact: string;
    languageLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    summary: string;
    primaryCta: string;
    secondaryCta: string;
    tertiaryCta: string;
    evidenceIds: EvidenceId[];
  };
  impact: EvidenceMetric[];
  featuredHeading: string;
  featuredIntro: string;
  capabilities: {
    id: "product-interfaces" | "apis-backend" | "applied-ai" | "systems-infrastructure";
    title: string;
    items: string[];
  }[];
  timeline: {
    id: "mcq" | "qarnot" | "phd" | "funecs";
    period: string;
    title: string;
    organization: string;
    summary: string;
    evidenceIds: EvidenceId[];
  }[];
  garden: {
    eyebrow: string;
    title: string;
    summary: string;
    cta: string;
    languageNote: string;
  };
  contact: {
    heading: string;
    summary: string;
    emailLabel: string;
    githubLabel: string;
    linkedinLabel: string;
  };
  metadata: { title: string; description: string };
}

const enProjects: Record<ProjectSlug, ProjectCaseStudy> = {
  whispbook: {
    slug: "whispbook",
    locale: "en",
    sectionOrder: projectSectionOrder,
    name: "Whispbook",
    eyebrow: "Local-first AI audiobook workflows",
    summary: "A self-hosted React and FastAPI audiobook studio, paired with research tooling for schema-constrained speaker attribution and local LoRA evaluation.",
    problem: "Turning a manuscript into editable, chaptered audio involves document cleanup, voice control, long-running generation, subtitles and character attribution without sending the working corpus to a hosted black box.",
    role: "Chakib owns the product workflow and backend/frontend implementation, and built the separate attribution research path for controlled context, structured tool outputs, local LoRA adapters and evaluation reports.",
    architecture: {
      overview: "The product path converts local documents into editable chapters, snapshots book state and TTS settings, then generates chapter audio, subtitles and an M4B package. The research path prepares speaker candidates and surrounding evidence for schema-constrained attribution and evaluates local adapters separately.",
      flow: ["Local selectable-text document", "Chapter and paragraph workspace", "Planner/coordinator workflow with bounded context", "Speaker attribution / voice mapping", "Local TTS generation jobs", "Chapter audio + VTT/SRT + M4B export"],
    },
    responsibilities: ["Built the React writing desk and FastAPI storage/job APIs.", "Integrated local/open TTS engines, preview, generation and subtitle packaging.", "Defined structured attribution/export schemas and candidate-aware context preparation.", "Built MLX-LM and Unsloth LoRA asset generation plus checkpoint evaluation-report tooling."],
    decisions: [
      { decision: "Keep manuscript processing and generation local-first.", rationale: "Books, edits, voices and generated media remain in a self-hosted storage boundary.", rejectedAlternative: "Making a hosted model or cloud storage service mandatory." },
      { decision: "Separate the shipping studio from model-attribution experiments.", rationale: "The runnable product can stay reliable while attribution datasets, adapters and evaluations evolve independently.", rejectedAlternative: "Wiring an unvalidated model directly into the production annotation path." },
    ],
    reliability: ["Structured JSON Schemas validate attribution examples, tool-call outputs and annotation exports.", "Frontend and backend have independent CI checks; a mock TTS path supports deterministic smoke tests.", "The public studio currently does not wire a separate model-based annotation provider; attribution remains a separate research workflow."],
    outcomes: [],
    currentStatus: "Active self-hosted studio with document import, local TTS, chapter/subtitle export and CI. Speaker-attribution training and evaluation are maintained as a separate experimental track.",
    technologyGroups: [{ label: "Product", items: ["React", "TypeScript", "FastAPI", "Docker"] }, { label: "Media", items: ["Kokoro", "Chatterbox", "ffmpeg", "M4B", "VTT", "SRT"] }, { label: "Applied AI", items: ["FunctionGemma", "LoRA", "MLX-LM", "Unsloth", "JSON Schema"] }],
    media: [],
    proofLinks: [
      { id: "whispbook-github", label: "Whispbook source", url: "https://github.com/chakib-belgaid/whispbook", kind: "repository" },
      { id: "whispbook-lora", label: "Speaker LoRA run", url: "https://huggingface.co/chakibmed/whispbook-qwen3-4b-speaker-lora-speaker_lora_v1_easy_evidence_only_cleaned", kind: "model" },
    ],
    metadata: { title: "Whispbook case study | Chakib Belgaid", description: "A local-first audiobook studio and structured speaker-attribution workflow spanning React, FastAPI, local TTS and LoRA evaluation." },
  },
  wattch: {
    slug: "wattch",
    locale: "en",
    sectionOrder: projectSectionOrder,
    name: "Wattch",
    eyebrow: "Protocol-first energy measurement",
    summary: "A Rust daemon and CLI boundary for local energy and system-telemetry capture, designed around explicit evidence classes, deterministic validation and replayable traces.",
    problem: "Hardware energy counters can require elevated access, while developers and benchmark tools need a safe, reproducible, unprivileged workflow that does not overstate noisy measurements.",
    role: "Chakib designed the daemon/client boundary, protocol and validation model, built the RAPL prototype and evolved it into a backend-independent trace-first foundation with deterministic test scenarios.",
    architecture: {
      overview: "A privileged acquisition daemon reads raw counters and serves a strict local socket protocol. Unprivileged CLI and Python clients capture source descriptors and sample batches into replayable run artifacts; interpretation stays offline.",
      flow: ["Linux RAPL powercap or deterministic source", "Rust acquisition daemon", "Framed local Unix socket protocol", "CLI / Python client", "Immutable raw trace artifact", "Offline inspect and validation"],
    },
    responsibilities: ["Implemented the Rust daemon, CLI and shared protocol/domain crates.", "Defined protobuf framing in the v0 prototype and a strict versioned frame envelope in Wattch Core.", "Added deterministic scenarios and golden validation before hardware-specific claims.", "Documented privilege, peer-authentication, counter semantics and failure behavior."],
    decisions: [
      { decision: "Separate privileged acquisition from unprivileged clients.", rationale: "RAPL access can require elevation; the Unix socket becomes a narrow, auditable boundary.", rejectedAlternative: "Letting every Python or CLI process read protected counters directly." },
      { decision: "Keep the daemon deliberately interpretation-free.", rationale: "Raw evidence remains replayable while baselines, aggregation and benchmark claims can evolve offline.", rejectedAlternative: "Embedding joules-per-token, scoring or report generation in the hot acquisition path." },
    ],
    reliability: ["Descriptor and sample invariants reject unknown sources and non-monotonic sequences.", "A deterministic daemon validates protocol behavior without pretending synthetic values are hardware evidence.", "The production-oriented daemon documents socket permissions, Linux peer credentials, stale-socket recovery and partial-source failures."],
    outcomes: [],
    currentStatus: "The public v0 Rust prototype proves RAPL, protobuf framing and Unix-socket collection. A local protocol-first rewrite adds replayable trace artifacts and deterministic validation; that rewrite was not publicly reachable during the audit.",
    technologyGroups: [{ label: "Systems", items: ["Rust", "Linux", "RAPL", "Unix sockets"] }, { label: "Protocol", items: ["Protobuf", "Binary frames", "Typed descriptors"] }, { label: "Validation", items: ["Deterministic daemon", "Golden tests", "Replayable traces"] }],
    media: [
      { id: "wattch-deterministic-trace", kind: "terminal", src: "/assets/projects/wattch/deterministic-trace.svg", alt: "Terminal transcript from Wattch's deterministic test daemon", caption: "Real dry-run output from the checked-in deterministic laptop scenario; it is protocol evidence, not a hardware-energy claim.", evidenceIds: ["repo:wattch-core"] },
    ],
    proofLinks: [{ id: "wattch-github", label: "Wattch v0 source", url: "https://github.com/chakib-belgaid/Wattch", kind: "repository" }],
    metadata: { title: "Wattch case study | Chakib Belgaid", description: "A protocol-first Rust energy-measurement stack with RAPL acquisition, Unix sockets, deterministic validation and replayable traces." },
  },
};

const frenchProjectCopy: Record<ProjectSlug, Omit<ProjectCaseStudy, "slug" | "locale" | "sectionOrder" | "technologyGroups" | "media" | "proofLinks"> & { technologyGroups: TechnologyGroup[] }> = {
  whispbook: {
    name: "Whispbook",
    eyebrow: "Workflows IA d'audiobook local-first",
    summary: "Un studio d'audiobook auto-hébergé en React et FastAPI, associé à des outils de recherche pour l'attribution de locuteurs sous schéma et l'évaluation locale d'adapters LoRA.",
    problem: "Transformer un manuscrit en audio éditable et chapitré demande nettoyage, contrôle des voix, génération longue, sous-titres et attribution des personnages, sans envoyer le corpus à un service opaque.",
    role: "Chakib porte le workflow produit et l'implémentation backend/frontend, ainsi qu'une voie de recherche séparée pour le contexte contrôlé, les sorties structurées, les adapters LoRA locaux et les rapports d'évaluation.",
    architecture: { overview: "Le produit transforme les documents locaux en chapitres éditables, fige l'état du livre et les réglages TTS, puis génère audio, sous-titres et M4B. La recherche prépare séparément candidats et indices contextuels pour l'attribution structurée.", flow: ["Document local à texte sélectionnable", "Espace chapitres et paragraphes", "Workflow planificateur/coordinateur à contexte borné", "Attribution du locuteur / association de voix", "Jobs TTS locaux", "Audio par chapitre + VTT/SRT + M4B"] },
    responsibilities: ["Création de l'éditeur React et des API FastAPI de stockage et de jobs.", "Intégration des moteurs TTS locaux/ouverts, de la préécoute, de la génération et des sous-titres.", "Définition de schémas structurés d'attribution/export et du contexte fondé sur des candidats.", "Création des ressources LoRA MLX-LM/Unsloth et des rapports d'évaluation par checkpoint."],
    decisions: [{ decision: "Garder le traitement et la génération local-first.", rationale: "Livres, modifications, voix et médias restent dans une frontière auto-hébergée.", rejectedAlternative: "Rendre obligatoire un modèle hébergé ou un stockage cloud." }, { decision: "Séparer le studio des expériences d'attribution.", rationale: "Le produit exécutable reste fiable pendant que datasets, adapters et évaluations évoluent.", rejectedAlternative: "Brancher directement un modèle non validé dans le chemin d'annotation produit." }],
    reliability: ["Des JSON Schemas valident exemples d'attribution, appels d'outils et exports.", "Frontend et backend ont des contrôles CI séparés ; un TTS mock rend les smoke tests déterministes.", "Le studio public ne branche pas encore de fournisseur d'annotation par modèle ; l'attribution reste un workflow de recherche séparé."],
    outcomes: [],
    currentStatus: "Studio auto-hébergé actif avec import, TTS local, chapitres/sous-titres et CI. L'entraînement et l'évaluation d'attribution restent une piste expérimentale séparée.",
    technologyGroups: [{ label: "Produit", items: ["React", "TypeScript", "FastAPI", "Docker"] }, { label: "Média", items: ["Kokoro", "Chatterbox", "ffmpeg", "M4B", "VTT", "SRT"] }, { label: "IA appliquée", items: ["FunctionGemma", "LoRA", "MLX-LM", "Unsloth", "JSON Schema"] }],
    metadata: { title: "Étude de cas Whispbook | Chakib Belgaid", description: "Un studio d'audiobook local-first et un workflow d'attribution structurée avec React, FastAPI, TTS local et évaluation LoRA." },
  },
  wattch: {
    name: "Wattch",
    eyebrow: "Mesure énergétique protocol-first",
    summary: "Une frontière daemon/CLI en Rust pour la capture locale d'énergie et de télémétrie, fondée sur des classes de preuve explicites, la validation déterministe et des traces rejouables.",
    problem: "Les compteurs énergétiques matériels peuvent exiger des privilèges, tandis que développeurs et outils de benchmark ont besoin d'un workflow sûr, reproductible et non privilégié qui ne surinterprète pas le bruit.",
    role: "Chakib a conçu la frontière daemon/client, le protocole et le modèle de validation, réalisé le prototype RAPL puis l'a fait évoluer vers une base indépendante du backend, centrée sur les traces et les scénarios déterministes.",
    architecture: { overview: "Un daemon d'acquisition privilégié lit les compteurs bruts et sert un protocole strict sur socket local. Les clients CLI et Python non privilégiés capturent des descripteurs et lots d'échantillons dans des artefacts rejouables ; l'interprétation reste hors ligne.", flow: ["RAPL powercap Linux ou source déterministe", "Daemon d'acquisition Rust", "Protocole local Unix socket encadré", "Client CLI / Python", "Artefact de trace brute immuable", "Inspection et validation hors ligne"] },
    responsibilities: ["Implémentation du daemon, de la CLI et des crates partagées en Rust.", "Définition du framing protobuf du prototype v0 et d'une enveloppe versionnée stricte dans Wattch Core.", "Ajout de scénarios déterministes et de validations golden avant les affirmations matérielles.", "Documentation des privilèges, de l'authentification des pairs, des compteurs et des échecs."],
    decisions: [{ decision: "Séparer acquisition privilégiée et clients non privilégiés.", rationale: "RAPL peut demander une élévation ; la socket Unix devient une frontière étroite et auditable.", rejectedAlternative: "Laisser chaque processus Python ou CLI lire directement les compteurs protégés." }, { decision: "Garder le daemon sans interprétation.", rationale: "Les preuves brutes restent rejouables et les baselines, agrégations et conclusions évoluent hors ligne.", rejectedAlternative: "Calculer joules/token, scores ou rapports dans le chemin d'acquisition critique." }],
    reliability: ["Les invariants rejettent sources inconnues et séquences non monotones.", "Un daemon déterministe valide le protocole sans présenter les valeurs synthétiques comme mesures matérielles.", "Le daemon orienté production documente permissions de socket, identité Linux du pair, récupération des sockets obsolètes et pannes partielles."],
    outcomes: [],
    currentStatus: "Le prototype Rust v0 public prouve RAPL, le framing protobuf et la collecte Unix socket. Une réécriture protocol-first locale ajoute traces rejouables et validation déterministe ; elle n'était pas publiquement accessible pendant l'audit.",
    technologyGroups: [{ label: "Systèmes", items: ["Rust", "Linux", "RAPL", "Unix sockets"] }, { label: "Protocole", items: ["Protobuf", "Frames binaires", "Descripteurs typés"] }, { label: "Validation", items: ["Daemon déterministe", "Golden tests", "Traces rejouables"] }],
    metadata: { title: "Étude de cas Wattch | Chakib Belgaid", description: "Une pile Rust protocol-first pour la mesure énergétique : RAPL, sockets Unix, validation déterministe et traces rejouables." },
  },
};

function buildFrenchProject(slug: ProjectSlug): ProjectCaseStudy {
  const english = enProjects[slug];
  return { ...english, ...frenchProjectCopy[slug], locale: "fr", architecture: frenchProjectCopy[slug].architecture, sectionOrder: projectSectionOrder, media: english.media.map((item) => ({ ...item, alt: item.id === "wattch-deterministic-trace" ? "Transcription du daemon de test déterministe Wattch" : item.alt, caption: item.id === "wattch-deterministic-trace" ? "Sortie réelle du scénario déterministe versionné ; preuve de protocole, pas mesure énergétique matérielle." : item.caption })) };
}

const frProjects: Record<ProjectSlug, ProjectCaseStudy> = {
  whispbook: buildFrenchProject("whispbook"),
  wattch: buildFrenchProject("wattch"),
};

export const projects = { en: enProjects, fr: frProjects } as const satisfies Record<Locale, Record<ProjectSlug, ProjectCaseStudy>>;

const impactEn: EvidenceMetric[] = [
  { id: "latency", label: "Inference latency reduction", value: "60%", evidenceIds: ["cvdb:mcq-local-model-optimization"] },
  { id: "nodes", label: "PowerAPI deployment", value: "100+ nodes", evidenceIds: ["cvdb:qarnot-powerapi-deployment"] },
  { id: "downloads", label: "pyJoules total PyPI downloads", value: "98k", evidenceIds: ["cvdb:pyjoules-energy-measurement"] },
];

export const siteContent = {
  en: {
    locale: "en",
    nav: { work: "Work", experience: "Experience", about: "About", garden: "Garden", cv: "CV", contact: "Contact", languageLabel: "Français" },
    hero: { eyebrow: "Mohammed Chakib Belgaid, Ph.D.", title: "Full-stack Product Engineer for AI systems and developer tools.", summary: "Ph.D. in software engineering with 10+ years across product delivery, backend and applied AI, from founder-led mobile products to research-grade measurement infrastructure and production agent workflows.", primaryCta: "View selected work", secondaryCta: "Download CV", tertiaryCta: "Enter Systems Garden", evidenceIds: ["cvdb:career-timeline", "cvdb:mcq-agentic-ai-platform", "cvdb:phd-green-coding"] },
    impact: impactEn,
    featuredHeading: "Selected work",
    featuredIntro: "Two systems, each documented with architecture, trade-offs, current status and verifiable proof.",
    capabilities: [
      { id: "product-interfaces", title: "Product interfaces", items: ["React and TypeScript", "Workflow design", "Accessible, responsive UI"] },
      { id: "apis-backend", title: "APIs and backend", items: ["Python and FastAPI", "Storage and job orchestration", "Cloud deployment and CI/CD"] },
      { id: "applied-ai", title: "Applied AI workflows", items: ["Agent orchestration", "Local/open models", "Structured outputs and evaluation"] },
      { id: "systems-infrastructure", title: "Systems and infrastructure", items: ["Rust and Linux", "Measurement protocols", "Reproducible benchmarking"] },
    ],
    timeline: [
      { id: "mcq", period: "2024–present", title: "AI Research Engineer / Lead AI Engineer", organization: "MCQ Scan", summary: "Leads production-facing agent workflows, model optimization, APIs, frontend integration and deployment.", evidenceIds: ["cvdb:career-timeline", "cvdb:mcq-agentic-ai-platform", "cvdb:mcq-local-model-optimization"] },
      { id: "qarnot", period: "2022–2024", title: "Software Engineer / Research Engineer", organization: "Qarnot Computing / Inria", summary: "Moved energy-measurement research toward operational infrastructure and deployed PowerAPI across 100+ nodes.", evidenceIds: ["cvdb:career-timeline", "cvdb:qarnot-powerapi-deployment"] },
      { id: "phd", period: "2018–2022", title: "Ph.D. Researcher", organization: "University of Lille / Inria", summary: "Doctoral research on green coding and empirical, energy-aware software engineering.", evidenceIds: ["cvdb:career-timeline", "cvdb:phd-green-coding"] },
      { id: "funecs", period: "2014–2018", title: "Co-founder / CTO", organization: "Funecs", summary: "Led product, engineering and client delivery for a serious-games advertising startup.", evidenceIds: ["cvdb:career-timeline", "cvdb:funecs-ooredoo-campaign"] },
    ],
    garden: { eyebrow: "Interactive lab", title: "Systems Garden", summary: "A separate creative-engineering experiment that turns systems concepts into a playable voxel world. It loads only when you choose to enter.", cta: "Enter the garden", languageNote: "The interactive experience is in English." },
    contact: { heading: "Build something useful", summary: "For product engineering, applied AI or developer-tooling work, reach out directly.", emailLabel: "Email", githubLabel: "GitHub", linkedinLabel: "LinkedIn" },
    metadata: { title: "Chakib Belgaid | Full-stack Product Engineer", description: "Full-stack product engineer building AI systems and developer tools. Selected work: Whispbook and Wattch." },
  },
  fr: {
    locale: "fr",
    nav: { work: "Projets", experience: "Expérience", about: "À propos", garden: "Jardin", cv: "CV", contact: "Contact", languageLabel: "English" },
    hero: { eyebrow: "Mohammed Chakib Belgaid, Ph.D.", title: "Ingénieur produit full-stack pour les systèmes IA et les outils développeurs.", summary: "Docteur en génie logiciel avec plus de 10 ans entre produit, backend et IA appliquée, des applications mobiles portées comme fondateur aux infrastructures de mesure de niveau recherche et aux workflows d'agents en production.", primaryCta: "Voir les projets", secondaryCta: "Télécharger le CV", tertiaryCta: "Entrer dans Systems Garden", evidenceIds: ["cvdb:career-timeline", "cvdb:mcq-agentic-ai-platform", "cvdb:phd-green-coding"] },
    impact: impactEn.map((metric) => ({ ...metric, label: metric.id === "latency" ? "Réduction de latence d'inférence" : metric.id === "nodes" ? "Déploiement PowerAPI" : "Téléchargements PyPI totaux de pyJoules", value: metric.id === "nodes" ? "100+ nœuds" : metric.value })),
    featuredHeading: "Projets sélectionnés",
    featuredIntro: "Deux systèmes documentés par leur architecture, leurs compromis, leur état actuel et des preuves vérifiables.",
    capabilities: [
      { id: "product-interfaces", title: "Interfaces produit", items: ["React et TypeScript", "Conception de workflows", "UI accessible et responsive"] },
      { id: "apis-backend", title: "API et backend", items: ["Python et FastAPI", "Stockage et orchestration de jobs", "Déploiement cloud et CI/CD"] },
      { id: "applied-ai", title: "Workflows IA appliquée", items: ["Orchestration d'agents", "Modèles locaux/ouverts", "Sorties structurées et évaluation"] },
      { id: "systems-infrastructure", title: "Systèmes et infrastructure", items: ["Rust et Linux", "Protocoles de mesure", "Benchmarking reproductible"] },
    ],
    timeline: [
      { id: "mcq", period: "2024–aujourd'hui", title: "AI Research Engineer / Lead AI Engineer", organization: "MCQ Scan", summary: "Pilotage de workflows d'agents, optimisation de modèles, API, intégration frontend et déploiement.", evidenceIds: ["cvdb:career-timeline", "cvdb:mcq-agentic-ai-platform", "cvdb:mcq-local-model-optimization"] },
      { id: "qarnot", period: "2022–2024", title: "Software Engineer / Research Engineer", organization: "Qarnot Computing / Inria", summary: "Passage de la recherche en mesure énergétique vers l'infrastructure et déploiement PowerAPI sur plus de 100 nœuds.", evidenceIds: ["cvdb:career-timeline", "cvdb:qarnot-powerapi-deployment"] },
      { id: "phd", period: "2018–2022", title: "Doctorant", organization: "Université de Lille / Inria", summary: "Recherche doctorale sur le green coding et l'ingénierie logicielle empirique et énergétique.", evidenceIds: ["cvdb:career-timeline", "cvdb:phd-green-coding"] },
      { id: "funecs", period: "2014–2018", title: "Co-fondateur / CTO", organization: "Funecs", summary: "Direction produit, technique et client d'une startup de serious games publicitaires.", evidenceIds: ["cvdb:career-timeline", "cvdb:funecs-ooredoo-campaign"] },
    ],
    garden: { eyebrow: "Laboratoire interactif", title: "Systems Garden", summary: "Une expérience séparée de creative engineering qui transforme des concepts systèmes en monde voxel jouable. Elle ne se charge que si vous choisissez d'entrer.", cta: "Entrer dans le jardin", languageNote: "L'expérience interactive est en anglais." },
    contact: { heading: "Construisons quelque chose d'utile", summary: "Pour des missions en ingénierie produit, IA appliquée ou outils développeurs, contactez-moi directement.", emailLabel: "E-mail", githubLabel: "GitHub", linkedinLabel: "LinkedIn" },
    metadata: { title: "Chakib Belgaid | Ingénieur produit full-stack", description: "Ingénieur produit full-stack spécialisé en systèmes IA et outils développeurs. Projets : Whispbook et Wattch." },
  },
} as const satisfies Record<Locale, PortfolioSiteContent>;

export const portfolioContacts = {
  email: "mailto:chakib.belgaid@gmail.com",
  github: "https://github.com/chakib-belgaid",
  linkedin: "https://www.linkedin.com/in/chakib-belgaid",
} as const;

export const resumeLinks = {
  en: {
    html: "/resume/chakib-belgaid-product-engineer-en.html",
    pdf: "/resume/chakib-belgaid-product-engineer-en.pdf",
  },
  fr: {
    html: "/resume/chakib-belgaid-product-engineer-fr.html",
    pdf: "/resume/chakib-belgaid-product-engineer-fr.pdf",
  },
} as const satisfies Record<Locale, { html: string; pdf: string }>;

export function getProject(locale: Locale, slug: ProjectSlug): ProjectCaseStudy {
  return projects[locale][slug];
}

export function getHomePath(locale: Locale): "/" | "/fr" {
  return locale === "fr" ? "/fr" : "/";
}

export function getProjectPath(locale: Locale, slug: ProjectSlug): string {
  return locale === "fr" ? `/fr/work/${slug}` : `/work/${slug}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "en" ? "fr" : "en";
}
