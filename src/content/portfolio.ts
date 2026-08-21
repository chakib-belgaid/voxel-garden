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
    note: "Evidence for the current React/FastAPI studio, document workflow, local TTS engines, character casts, streaming generation, subtitles and M4B export.",
  },
  "repo:whispbook-training": {
    label: "Whispbook speaker-attribution training scaffold",
    source: "whispbook-voice-annotator-training / src and schemas",
    sourceUrl: "https://huggingface.co/chakibmed/whispbook-qwen3-4b-speaker-lora-speaker_lora_v1_easy_evidence_only_cleaned",
    note: "Evidence for schema-constrained attribution, local MLX/Unsloth LoRA preparation and evaluation-report code.",
  },
  "repo:wattch": {
    label: "Wattch public source repository",
    source: "Wattch / README.md, crates, proto and tests",
    sourceUrl: "https://github.com/chakib-belgaid/Wattch",
    note: "Evidence for the public v0.1-alpha Rust RAPL daemon/CLI, protobuf framing, Unix-socket protocol and deterministic fake backend.",
  },
  "repo:wattch-core": {
    label: "Wattch deterministic validation",
    source: "Wattch / README.md, docs and tests",
    sourceUrl: "https://github.com/chakib-belgaid/Wattch",
    note: "Evidence for protocol-first validation, deterministic fake-source testing and reproducibility-focused development in the public Wattch repository.",
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
    eyebrow: "Local-first audiobook production",
    summary: "A self-hosted React and FastAPI audiobook studio that turns local documents into editable, multi-voice audiobooks with local TTS, character casts, subtitles and M4B export.",
    problem: "Turning a manuscript into a polished audiobook requires document cleanup, voice control, long-running generation, subtitles and packaging while keeping the working corpus and media under the user's control.",
    role: "Chakib owns the product workflow and backend/frontend implementation, including document ingestion, editing, local TTS integration, character voice controls, generation jobs and audiobook packaging; speaker-attribution model work remains a separate research track.",
    architecture: {
      overview: "Whispbook converts local selectable-text documents into editable chapters and paragraphs. Users choose chapters, voices and narration settings, preview paragraphs, assign Chatterbox Turbo character voices and inline paralinguistic cues, then run background synthesis while listening to completed paragraphs. The backend packages chapter audio, VTT/SRT subtitles and a final M4B audiobook.",
      flow: ["Local selectable-text document", "Editable chapters and paragraphs", "Voice/style and character assignments", "Paragraph preview", "Background local TTS generation", "Chapter audio + VTT/SRT + M4B export"],
    },
    responsibilities: [
      "Built the React writing desk and FastAPI storage/job APIs.",
      "Integrated Kokoro, Chatterbox and Chatterbox Turbo for preview and full-book generation.",
      "Added custom narration styles, Turbo character casts, highlighted voice ranges and inline paralinguistic tags.",
      "Built chapter audio, VTT/SRT subtitle and M4B packaging plus exportable Python generation scripts.",
      "Maintained the separate schema-constrained speaker-attribution and LoRA evaluation research path.",
    ],
    decisions: [
      { decision: "Keep manuscript processing and generation local-first.", rationale: "Books, edits, voices and generated media remain in a self-hosted storage boundary.", rejectedAlternative: "Making a hosted model or cloud storage service mandatory." },
      { decision: "Separate the shipping studio from model-attribution experiments.", rationale: "The runnable product can stay reliable while attribution datasets, adapters and evaluations evolve independently.", rejectedAlternative: "Wiring an unvalidated model directly into the production annotation path." },
    ],
    reliability: [
      "Frontend and backend have independent CI checks; a mock TTS engine supports deterministic smoke tests.",
      "Generation snapshots the current book edits and TTS settings so exported scripts can reproduce the configured job.",
      "The public studio does not require a separate model-based annotation provider; speaker-attribution research remains isolated from the shipping workflow.",
    ],
    outcomes: [],
    currentStatus: "Active self-hosted studio with document import, editable chapters, Kokoro/Chatterbox/Chatterbox Turbo, custom styles and character casts, background generation with listen-while-creating, subtitles and M4B export. Speaker-attribution model training and evaluation remain a separate experimental track.",
    technologyGroups: [
      { label: "Product", items: ["React", "TypeScript", "FastAPI", "Docker"] },
      { label: "Media", items: ["Kokoro", "Chatterbox", "Chatterbox Turbo", "ffmpeg", "M4B", "VTT", "SRT"] },
      { label: "Applied AI", items: ["LoRA", "MLX-LM", "Unsloth", "JSON Schema"] },
    ],
    media: [],
    proofLinks: [
      { id: "whispbook-github", label: "Whispbook source", url: "https://github.com/chakib-belgaid/whispbook", kind: "repository" },
      { id: "whispbook-lora", label: "Speaker LoRA run", url: "https://huggingface.co/chakibmed/whispbook-qwen3-4b-speaker-lora-speaker_lora_v1_easy_evidence_only_cleaned", kind: "model" },
    ],
    metadata: { title: "Whispbook case study | Chakib Belgaid", description: "A self-hosted React/FastAPI audiobook studio with local TTS, Chatterbox Turbo character casts, streaming generation, subtitles and M4B export." },
  },
  wattch: {
    slug: "wattch",
    locale: "en",
    sectionOrder: projectSectionOrder,
    name: "Wattch",
    eyebrow: "Protocol-first energy measurement",
    summary: "A Rust RAPL daemon and CLI for local energy measurement, with length-prefixed protobuf over Unix sockets and a deterministic fake backend for repeatable validation.",
    problem: "Hardware energy counters can require elevated access, while developers and benchmark tools need a safe, reproducible, unprivileged workflow that does not overstate what machine-level RAPL measurements can prove.",
    role: "Chakib designed and implemented the Rust daemon/CLI boundary, shared protocol crates, RAPL source discovery, command-wrapper measurement path and deterministic test backend.",
    architecture: {
      overview: "The privileged rapl-wattchd process discovers Linux RAPL powercap sources and samples counters. The unprivileged wattch CLI talks to it through a Unix-domain socket using length-prefixed protobuf messages, then lists sources, streams samples or measures the energy observed while a child command runs. A deterministic in-memory source exercises the same protocol without root or hardware counters.",
      flow: ["Linux RAPL powercap or deterministic fake source", "rapl-wattchd Rust daemon", "Length-prefixed protobuf over Unix socket", "wattch CLI", "sources / stream / run workflows", "Table or CSV output"],
    },
    responsibilities: [
      "Implemented the Rust daemon, CLI and shared protocol/domain crates.",
      "Defined the protobuf framing and validation boundary, including a 1 MiB maximum message size.",
      "Added deterministic fake-source tests and an end-to-end smoke script that exercise the real daemon/CLI protocol path.",
      "Built Linux release packaging for Debian/Ubuntu and RPM-based distributions.",
    ],
    decisions: [
      { decision: "Separate privileged acquisition from unprivileged clients.", rationale: "RAPL access can require elevation; the Unix socket becomes a narrow, auditable boundary while the CLI can run without root once socket ownership is handed off safely.", rejectedAlternative: "Letting every client process read protected counters directly." },
      { decision: "Keep attribution claims conservative.", rationale: "The command wrapper reports RAPL energy observed while the child runs, without claiming process-exclusive or function-level attribution.", rejectedAlternative: "Presenting machine-level counter deltas as exact per-process energy." },
    ],
    reliability: [
      "Every protobuf message is length-prefixed and capped at 1 MiB before decoding.",
      "The deterministic fake backend validates protocol and CLI behavior without presenting synthetic samples as hardware evidence.",
      "The quality gate runs cargo metadata, formatting, clippy with warnings denied, tests and a locked workspace build.",
    ],
    outcomes: [],
    currentStatus: "Public v0.1-alpha exploratory prototype. It supports Linux RAPL source discovery, protobuf-framed Unix-socket communication, sources/stream/run CLI workflows, deterministic fake-backend tests and Linux package builds. It intentionally does not claim process-level or function-level energy attribution.",
    technologyGroups: [
      { label: "Systems", items: ["Rust", "Linux", "RAPL", "Unix sockets"] },
      { label: "Protocol", items: ["Protobuf", "Length-prefixed frames", "Typed validation"] },
      { label: "Validation", items: ["Deterministic fake backend", "Smoke tests", "cargo fmt / clippy / test / build"] },
    ],
    media: [
      { id: "wattch-deterministic-trace", kind: "terminal", src: "/assets/projects/wattch/deterministic-trace.svg", alt: "Terminal transcript from Wattch's deterministic test daemon", caption: "Deterministic protocol smoke output used to validate the local daemon/CLI path; it is test evidence, not a hardware-energy claim.", evidenceIds: ["repo:wattch-core"] },
    ],
    proofLinks: [{ id: "wattch-github", label: "Wattch source", url: "https://github.com/chakib-belgaid/Wattch", kind: "repository" }],
    metadata: { title: "Wattch case study | Chakib Belgaid", description: "A Rust RAPL daemon and CLI with protobuf-framed Unix sockets, deterministic validation and conservative energy-measurement semantics." },
  },
};

const frenchProjectCopy: Record<ProjectSlug, Omit<ProjectCaseStudy, "slug" | "locale" | "sectionOrder" | "technologyGroups" | "media" | "proofLinks"> & { technologyGroups: TechnologyGroup[] }> = {
  whispbook: {
    name: "Whispbook",
    eyebrow: "Production d'audiobooks local-first",
    summary: "Un studio d'audiobook auto-hébergé en React et FastAPI qui transforme des documents locaux en audiobooks éditables et multi-voix avec TTS local, casts de personnages, sous-titres et export M4B.",
    problem: "Transformer un manuscrit en audiobook abouti demande nettoyage, contrôle des voix, génération longue, sous-titres et packaging tout en gardant le corpus et les médias sous le contrôle de l'utilisateur.",
    role: "Chakib porte le workflow produit et l'implémentation backend/frontend : import de documents, édition, TTS local, contrôle des voix de personnages, jobs de génération et packaging audiobook ; l'attribution automatique des locuteurs reste une piste de recherche séparée.",
    architecture: { overview: "Whispbook convertit les documents locaux à texte sélectionnable en chapitres et paragraphes éditables. L'utilisateur choisit chapitres, voix et réglages, préécoute un paragraphe, attribue des voix Chatterbox Turbo aux personnages et des indications paralinguistiques, puis lance la synthèse en arrière-plan tout en écoutant les paragraphes terminés. Le backend produit audio par chapitre, sous-titres VTT/SRT et audiobook M4B final.", flow: ["Document local à texte sélectionnable", "Chapitres et paragraphes éditables", "Styles, voix et personnages", "Préécoute d'un paragraphe", "Génération TTS locale en arrière-plan", "Audio + VTT/SRT + M4B"] },
    responsibilities: ["Création de l'éditeur React et des API FastAPI de stockage et de jobs.", "Intégration de Kokoro, Chatterbox et Chatterbox Turbo pour la préécoute et la génération complète.", "Ajout des styles personnalisés, casts Turbo, plages de voix surlignées et balises paralinguistiques inline.", "Création du packaging audio par chapitre, VTT/SRT, M4B et des scripts Python exportables.", "Maintien séparé du workflow de recherche d'attribution de locuteurs et d'évaluation LoRA."],
    decisions: [{ decision: "Garder le traitement et la génération local-first.", rationale: "Livres, modifications, voix et médias restent dans une frontière auto-hébergée.", rejectedAlternative: "Rendre obligatoire un modèle hébergé ou un stockage cloud." }, { decision: "Séparer le studio des expériences d'attribution.", rationale: "Le produit exécutable reste fiable pendant que datasets, adapters et évaluations évoluent.", rejectedAlternative: "Brancher directement un modèle non validé dans le chemin d'annotation produit." }],
    reliability: ["Frontend et backend ont des contrôles CI séparés ; un TTS mock rend les smoke tests déterministes.", "La génération fige l'état courant du livre et des réglages TTS afin que les scripts exportés puissent reproduire le job configuré.", "Le studio public n'impose pas de fournisseur d'annotation par modèle ; la recherche d'attribution reste isolée du workflow livré."],
    outcomes: [],
    currentStatus: "Studio auto-hébergé actif avec import, chapitres éditables, Kokoro/Chatterbox/Chatterbox Turbo, styles et casts de personnages, génération en arrière-plan avec écoute progressive, sous-titres et export M4B. L'entraînement et l'évaluation des modèles d'attribution restent expérimentaux et séparés.",
    technologyGroups: [{ label: "Produit", items: ["React", "TypeScript", "FastAPI", "Docker"] }, { label: "Média", items: ["Kokoro", "Chatterbox", "Chatterbox Turbo", "ffmpeg", "M4B", "VTT", "SRT"] }, { label: "IA appliquée", items: ["LoRA", "MLX-LM", "Unsloth", "JSON Schema"] }],
    metadata: { title: "Étude de cas Whispbook | Chakib Belgaid", description: "Un studio d'audiobook React/FastAPI auto-hébergé avec TTS local, casts Chatterbox Turbo, génération progressive, sous-titres et export M4B." },
  },
  wattch: {
    name: "Wattch",
    eyebrow: "Mesure énergétique protocol-first",
    summary: "Un daemon RAPL et une CLI en Rust pour la mesure énergétique locale, avec protobuf préfixé par longueur sur sockets Unix et un backend déterministe pour des validations reproductibles.",
    problem: "Les compteurs énergétiques matériels peuvent exiger des privilèges, tandis que développeurs et outils de benchmark ont besoin d'un workflow sûr, reproductible et non privilégié qui ne surinterprète pas ce que les mesures RAPL de la machine peuvent prouver.",
    role: "Chakib a conçu et implémenté la frontière daemon/CLI en Rust, les crates de protocole partagées, la découverte des sources RAPL, le wrapper de commandes et le backend déterministe de test.",
    architecture: { overview: "Le processus privilégié rapl-wattchd découvre les sources RAPL powercap Linux et échantillonne les compteurs. La CLI wattch non privilégiée communique via une socket Unix avec des messages protobuf préfixés par leur longueur, puis liste les sources, diffuse les échantillons ou mesure l'énergie observée pendant l'exécution d'une commande enfant. Une source déterministe en mémoire exerce le même protocole sans root ni compteurs matériels.", flow: ["RAPL powercap Linux ou source déterministe", "Daemon Rust rapl-wattchd", "Protobuf préfixé par longueur sur socket Unix", "CLI wattch", "Workflows sources / stream / run", "Sortie table ou CSV"] },
    responsibilities: ["Implémentation du daemon, de la CLI et des crates partagées en Rust.", "Définition du framing protobuf et de la validation, avec une taille maximale de message de 1 Mio.", "Ajout d'une source déterministe et d'un smoke test end-to-end qui exercent le vrai chemin protocole daemon/CLI.", "Création des packages Linux pour Debian/Ubuntu et les distributions basées sur RPM."],
    decisions: [{ decision: "Séparer acquisition privilégiée et clients non privilégiés.", rationale: "RAPL peut demander une élévation ; la socket Unix devient une frontière étroite et auditable tandis que la CLI peut fonctionner sans root après transfert sécurisé de la socket.", rejectedAlternative: "Laisser chaque client lire directement les compteurs protégés." }, { decision: "Rester conservateur sur l'attribution.", rationale: "Le wrapper rapporte l'énergie RAPL observée pendant l'exécution de l'enfant sans prétendre à une attribution exclusive par processus ou fonction.", rejectedAlternative: "Présenter les deltas des compteurs machine comme une énergie exacte par processus." }],
    reliability: ["Chaque message protobuf est préfixé par sa longueur et limité à 1 Mio avant décodage.", "Le backend déterministe valide protocole et CLI sans présenter les valeurs synthétiques comme mesures matérielles.", "Le quality gate exécute cargo metadata, formatage, clippy avec warnings interdits, tests et build verrouillé du workspace."],
    outcomes: [],
    currentStatus: "Prototype exploratoire public v0.1-alpha. Il prend en charge la découverte RAPL Linux, la communication protobuf sur socket Unix, les workflows CLI sources/stream/run, les tests avec backend déterministe et les packages Linux. Il ne revendique volontairement aucune attribution énergétique au niveau processus ou fonction.",
    technologyGroups: [{ label: "Systèmes", items: ["Rust", "Linux", "RAPL", "Unix sockets"] }, { label: "Protocole", items: ["Protobuf", "Frames préfixées par longueur", "Validation typée"] }, { label: "Validation", items: ["Backend déterministe", "Smoke tests", "cargo fmt / clippy / test / build"] }],
    metadata: { title: "Étude de cas Wattch | Chakib Belgaid", description: "Un daemon RAPL et une CLI Rust avec protobuf sur sockets Unix, validation déterministe et sémantique de mesure énergétique conservatrice." },
  },
};

function buildFrenchProject(slug: ProjectSlug): ProjectCaseStudy {
  const english = enProjects[slug];
  return {
    ...english,
    ...frenchProjectCopy[slug],
    locale: "fr",
    architecture: frenchProjectCopy[slug].architecture,
    sectionOrder: projectSectionOrder,
    media: english.media.map((item) => ({
      ...item,
      alt: item.id === "wattch-deterministic-trace" ? "Transcription du daemon de test déterministe Wattch" : item.alt,
      caption: item.id === "wattch-deterministic-trace" ? "Sortie de test déterministe utilisée pour valider le chemin daemon/CLI ; preuve de protocole, pas mesure énergétique matérielle." : item.caption,
    })),
  };
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

export { portfolioContacts } from "./contacts";

export const resumeLinks = {
  en: { html: "/resume/chakib-belgaid-product-engineer-en.html", pdf: "/resume/chakib-belgaid-product-engineer-en.pdf" },
  fr: { html: "/resume/chakib-belgaid-product-engineer-fr.html", pdf: "/resume/chakib-belgaid-product-engineer-fr.pdf" },
} as const satisfies Record<Locale, { html: string; pdf: string }>;

export function getProject(locale: Locale, slug: ProjectSlug): ProjectCaseStudy {
  return projects[locale][slug];
}

export function getHomePath(locale: Locale): "/live" | "/fr/live" {
  return locale === "fr" ? "/fr/live" : "/live";
}

export function getProjectPath(locale: Locale, slug: ProjectSlug): string {
  return locale === "fr" ? `/fr/work/${slug}` : `/work/${slug}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "en" ? "fr" : "en";
}
