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
  "repo:whisperbook-mobile": {
    label: "Whisperbook Android source repository",
    source: "whisper-book / README.md, app source and API 36 captures",
    sourceUrl: "https://github.com/chakib-belgaid/whisper-book",
    note: "Evidence for the offline-first Kotlin/Compose app, local EPUB/PDF import, Supertonic 3 narration, Media3 playback, per-book voice casts, read-along UI and MP3 export.",
  },
  "repo:wattch": {
    label: "Wattch public source repository",
    source: "Wattch / README.md, crates and proto",
    sourceUrl: "https://github.com/chakib-belgaid/Wattch",
    note: "Evidence for the original protobuf-framed RAPL daemon/CLI prototype.",
  },
  "repo:wattch-core": {
    label: "Wattch Core public source repository",
    source: "wattch-core / README.md, docs, crates, Python client and VS Code extension",
    sourceUrl: "https://github.com/chakib-belgaid/wattch-core",
    note: "Evidence for the protocol-first Rust daemon/client boundary, deterministic test daemon, replayable traces, pywattch client and Energy Tests extension.",
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
  orientation?: "landscape" | "portrait";
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
    name: "Whisperbook",
    eyebrow: "Private, on-device audiobooks",
    summary: "An offline-first Android app that turns local EPUB and PDF books into synchronized, multi-voice audiobooks without an account, cloud upload or runtime network access.",
    problem: "Turning a book into a listenable audiobook usually means uploading private reading material, waiting for the whole book to render, and losing control over voices, chapters and corrections. Whisperbook keeps import, attribution, synthesis, playback and export on the device.",
    role: "Chakib designed and built the Android product end to end: document import and extraction, chapter preparation, explainable speaker attribution, local voice casting, progressive Supertonic 3 synthesis, Media3 playback, synchronized reading and offline MP3 export.",
    architecture: {
      overview: "A single-module Kotlin/Compose app copies the selected publication into private storage, extracts EPUB or PDF text, detects chapters and speakers, persists the library in Room, and prepares opening audio through WorkManager. Supertonic 3 generates finalized local WAV segments that Media3 can play progressively while later chapters continue preparing.",
      flow: ["Local EPUB or PDF", "Private extraction and chapter detection", "Speaker attribution and voice cast", "Progressive Supertonic 3 synthesis", "Media3 playback and synchronized passages", "Offline book-level MP3 export"],
    },
    responsibilities: [
      "Built the Kotlin/Compose product surfaces and Woodland Paper Theatre design system.",
      "Implemented local EPUB/PDF extraction, bundled OCR fallback and durable per-book state.",
      "Integrated Supertonic 3 through sherpa-onnx with local voice previews and per-book or per-chapter casts.",
      "Built progressive chapter preparation, Media3 playback, read-along checkpoints and chapter continuation.",
      "Added cancellable offline MP3 export that reuses finalized narration and generates only missing audio.",
    ],
    decisions: [
      { decision: "Remove runtime networking entirely.", rationale: "The Android manifest has no INTERNET or ACCESS_NETWORK_STATE permission, so imported books, generated audio and listening history stay inside the device boundary.", rejectedAlternative: "Requiring a hosted model, account or cloud fallback for core narration." },
      { decision: "Stream finalized local segments instead of waiting for the whole book.", rationale: "The opening chapter becomes listenable first while later chapters are prepared sequentially, without sacrificing cache, seek or restart behavior.", rejectedAlternative: "Blocking playback until every chapter has been synthesized." },
    ],
    reliability: [
      "Room, DataStore and WorkManager persist library, settings and preparation checkpoints across restarts.",
      "Finalized WAV microsegments remain the common cache, playback and export representation.",
      "JVM and connected Android tests cover import, synthesis, playback, navigation, voice selection and chapter continuation on the production Compose surfaces.",
    ],
    outcomes: [],
    currentStatus: "Public v0.1 Android release for arm64 devices on Android 8.0 or newer. The app imports local EPUB/PDF files, narrates with bundled Supertonic 3 voices, supports English, French and Arabic book settings, keeps playback synchronized with passages, and exports one local MP3.",
    technologyGroups: [
      { label: "Android", items: ["Kotlin", "Jetpack Compose", "Room", "DataStore", "WorkManager"] },
      { label: "Audio", items: ["Supertonic 3", "sherpa-onnx", "Media3", "AudioTrack", "FFmpegKit"] },
      { label: "Documents", items: ["EPUB", "PDF", "ML Kit OCR", "Storage Access Framework"] },
    ],
    media: [
      { id: "whisperbook-now-playing", kind: "image", orientation: "portrait", src: "/assets/projects/whisperbook/now-playing.webp", alt: "Whisperbook Android now-playing screen with offline status, chapter, speaker, playback, seek, timer and voice-cast controls", caption: "Now Playing keeps the active speaker, chapter controls and offline state visible on the production Compose surface.", evidenceIds: ["repo:whisperbook-mobile"] },
      { id: "whisperbook-read-along", kind: "image", orientation: "portrait", src: "/assets/projects/whisperbook/read-along.webp", alt: "Whisperbook synchronized read-along screen with speaker-labelled passages and playback controls", caption: "Read Along follows the active passage and keeps manual speaker correction available.", evidenceIds: ["repo:whisperbook-mobile"] },
      { id: "whisperbook-voice-cast", kind: "image", orientation: "portrait", src: "/assets/projects/whisperbook/voice-cast.webp", alt: "Whisperbook voice-cast screen with book language and local character voice assignments", caption: "Voice Cast manages per-book language and previewable local voices without leaving the device.", evidenceIds: ["repo:whisperbook-mobile"] },
      { id: "whisperbook-library", kind: "image", orientation: "portrait", src: "/assets/projects/whisperbook/library.webp", alt: "Whisperbook offline library showing continue listening and additional local books", caption: "The Library restores each book's own listening position and preparation state.", evidenceIds: ["repo:whisperbook-mobile"] },
    ],
    proofLinks: [
      { id: "whisperbook-github", label: "Whisperbook source", url: "https://github.com/chakib-belgaid/whisper-book", kind: "repository" },
      { id: "whisperbook-release", label: "Latest Android release", url: "https://github.com/chakib-belgaid/whisper-book/releases/latest", kind: "demo" },
    ],
    metadata: { title: "Whisperbook Android case study | Chakib Belgaid", description: "An offline-first Kotlin/Compose audiobook app with local EPUB/PDF import, Supertonic 3 narration, synchronized reading and MP3 export." },
  },
  wattch: {
    slug: "wattch",
    locale: "en",
    sectionOrder: projectSectionOrder,
    name: "Wattch Core",
    eyebrow: "Trace-first energy measurement",
    summary: "A protocol-first Rust measurement spine that separates privileged energy acquisition from unprivileged CLI, Python and VS Code workflows while preserving replayable raw evidence.",
    problem: "Hardware energy counters can require elevated access, while developers, tests and benchmark tools need a safe workflow that preserves source meaning and does not turn noisy machine-level evidence into false process-level precision.",
    role: "Chakib designed and implemented the daemon/client boundary, typed protocol and validation model, Linux RAPL and synthetic acquisition paths, replayable CLI artifacts, the pywattch client and the Energy Tests developer workflow.",
    architecture: {
      overview: "A privileged wattch-powerd daemon reads Linux RAPL counters or a synthetic source and serves strict, versioned frames over a local Unix socket. Unprivileged CLI and Python clients capture source descriptors and raw sample batches into immutable run artifacts; inspection, tests and later interpretation stay outside the acquisition path.",
      flow: ["Linux RAPL powercap or synthetic source", "wattch-powerd acquisition daemon", "Versioned local Unix-socket protocol", "CLI / pywattch / Energy Tests", "Manifest + descriptors + raw trace", "Offline inspect and validation"],
    },
    responsibilities: [
      "Implemented the Rust domain, protocol, daemon, powerd, deterministic test daemon and CLI crates.",
      "Defined typed source descriptors, evidence classes, sequence invariants and versioned local frames.",
      "Built replayable capture/inspect/validate artifacts and a pyJoules-compatible Python client.",
      "Added Energy Tests discovery and a VS Code results surface with per-domain joule and budget columns.",
      "Documented privilege, socket permissions, counter semantics, failure behavior and explicit non-goals.",
    ],
    decisions: [
      { decision: "Separate privileged acquisition from unprivileged clients.", rationale: "RAPL access can require elevation; the Unix socket becomes a narrow, auditable boundary.", rejectedAlternative: "Letting every Python or CLI process read protected counters directly." },
      { decision: "Keep the daemon deliberately interpretation-free.", rationale: "Raw descriptors and samples remain replayable while aggregation, comparison and claims evolve offline.", rejectedAlternative: "Embedding baselines, joules-per-token, scoring or optimization advice in the acquisition path." },
    ],
    reliability: [
      "Descriptor and sample invariants reject unknown sources, invalid units and non-monotonic sequences.",
      "The deterministic daemon and checked-in scenarios validate the same protocol path without presenting synthetic values as hardware measurements.",
      "CI runs Rust formatting, Clippy with warnings denied, workspace tests, Python-client tests and extension tests.",
    ],
    outcomes: [],
    currentStatus: "The public foundation supports Linux RAPL and synthetic acquisition, a strict local protocol, deterministic test scenarios, CLI capture/inspect/validate workflows, replayable traces, a pywattch Python API and VS Code Energy Tests. It does not claim per-process energy allocation or absolute meter accuracy.",
    technologyGroups: [
      { label: "Systems", items: ["Rust", "Linux", "RAPL", "Unix sockets"] },
      { label: "Clients", items: ["CLI", "Python", "pyJoules API", "VS Code"] },
      { label: "Evidence", items: ["Typed descriptors", "Deterministic daemon", "Replayable traces"] },
    ],
    media: [
      { id: "wattch-deterministic-trace", kind: "terminal", orientation: "landscape", src: "/assets/projects/wattch/deterministic-trace.png", alt: "Terminal transcript from Wattch's deterministic test daemon", caption: "Real dry-run output from the checked-in deterministic laptop scenario; it is protocol evidence, not a hardware-energy claim.", evidenceIds: ["repo:wattch-core"] },
      { id: "wattch-energy-tests", kind: "image", orientation: "landscape", src: "/assets/projects/wattch/energy-tests.png", alt: "Wattch Core Energy Tests result surface showing three deterministic demo tests with time, energy domains and budget columns", caption: "The shipped Energy Tests surface rendered from an actual deterministic demo run; synthetic values verify the workflow, not physical hardware.", evidenceIds: ["repo:wattch-core"] },
    ],
    proofLinks: [
      { id: "wattch-core-github", label: "Wattch Core source", url: "https://github.com/chakib-belgaid/wattch-core", kind: "repository" },
      { id: "wattch-energy-tests-docs", label: "Energy Tests documentation", url: "https://github.com/chakib-belgaid/wattch-core/blob/main/docs/energy-tests.md", kind: "documentation" },
    ],
    metadata: { title: "Wattch Core case study | Chakib Belgaid", description: "A protocol-first Rust measurement spine with a privileged daemon, unprivileged clients, deterministic validation and replayable traces." },
  },
};

const frenchProjectCopy: Record<ProjectSlug, Omit<ProjectCaseStudy, "slug" | "locale" | "sectionOrder" | "technologyGroups" | "media" | "proofLinks"> & { technologyGroups: TechnologyGroup[] }> = {
  whispbook: {
    name: "Whisperbook",
    eyebrow: "Audiobooks privés sur l'appareil",
    summary: "Une application Android offline-first qui transforme des EPUB et PDF locaux en audiobooks multi-voix synchronisés, sans compte, sans cloud et sans accès réseau à l'exécution.",
    problem: "Transformer un livre en audiobook implique souvent d'envoyer un contenu privé, d'attendre la génération complète et de perdre le contrôle des voix, chapitres et corrections. Whisperbook conserve import, attribution, synthèse, lecture et export sur l'appareil.",
    role: "Chakib a conçu et réalisé le produit Android de bout en bout : import et extraction, préparation des chapitres, attribution explicable des locuteurs, casting local, synthèse progressive Supertonic 3, lecture Media3, suivi synchronisé et export MP3 hors ligne.",
    architecture: { overview: "Une application Kotlin/Compose mono-module copie la publication dans un stockage privé, extrait le texte EPUB ou PDF, détecte chapitres et locuteurs, persiste la bibliothèque dans Room et prépare l'audio d'ouverture via WorkManager. Supertonic 3 génère des segments WAV locaux finalisés que Media3 lit progressivement pendant la préparation des chapitres suivants.", flow: ["EPUB ou PDF local", "Extraction privée et détection des chapitres", "Attribution des locuteurs et casting", "Synthèse progressive Supertonic 3", "Lecture Media3 et passages synchronisés", "Export MP3 hors ligne"] },
    responsibilities: ["Création des interfaces Kotlin/Compose et du système visuel Woodland Paper Theatre.", "Implémentation de l'extraction EPUB/PDF, de l'OCR embarqué et de l'état durable par livre.", "Intégration de Supertonic 3 via sherpa-onnx avec préécoute locale et casting par livre ou chapitre.", "Création de la préparation progressive, de la lecture Media3, du suivi de lecture et de l'enchaînement des chapitres.", "Ajout d'un export MP3 annulable qui réutilise l'audio finalisé et ne génère que les segments manquants."],
    decisions: [{ decision: "Supprimer tout réseau à l'exécution.", rationale: "Le manifeste Android n'accorde ni INTERNET ni ACCESS_NETWORK_STATE : livres, audio et historique restent dans la frontière de l'appareil.", rejectedAlternative: "Imposer un modèle hébergé, un compte ou un fallback cloud pour la narration." }, { decision: "Lire des segments locaux finalisés sans attendre le livre complet.", rationale: "Le premier chapitre devient écoutable pendant la préparation séquentielle des suivants, tout en conservant cache, recherche et reprise.", rejectedAlternative: "Bloquer la lecture jusqu'à la synthèse de tous les chapitres." }],
    reliability: ["Room, DataStore et WorkManager persistent la bibliothèque, les réglages et les checkpoints de préparation.", "Les microsegments WAV finalisés servent de représentation commune au cache, à la lecture et à l'export.", "Les tests JVM et Android couvrent import, synthèse, lecture, navigation, choix des voix et enchaînement des chapitres sur les interfaces Compose réelles."],
    outcomes: [],
    currentStatus: "Version Android publique v0.1 pour appareils arm64 sous Android 8.0 ou plus. L'application importe EPUB/PDF, narre avec Supertonic 3, propose l'anglais, le français et l'arabe par livre, synchronise lecture et passages, puis exporte un MP3 local.",
    technologyGroups: [{ label: "Android", items: ["Kotlin", "Jetpack Compose", "Room", "DataStore", "WorkManager"] }, { label: "Audio", items: ["Supertonic 3", "sherpa-onnx", "Media3", "AudioTrack", "FFmpegKit"] }, { label: "Documents", items: ["EPUB", "PDF", "ML Kit OCR", "Storage Access Framework"] }],
    metadata: { title: "Étude de cas Android Whisperbook | Chakib Belgaid", description: "Une application d'audiobook Kotlin/Compose offline-first avec import EPUB/PDF local, narration Supertonic 3, lecture synchronisée et export MP3." },
  },
  wattch: {
    name: "Wattch Core",
    eyebrow: "Mesure énergétique trace-first",
    summary: "Une base de mesure protocol-first en Rust qui sépare acquisition privilégiée et workflows CLI, Python et VS Code non privilégiés tout en préservant les preuves brutes rejouables.",
    problem: "Les compteurs énergétiques matériels peuvent exiger des privilèges, tandis que développeurs, tests et benchmarks ont besoin d'un workflow sûr qui préserve le sens des sources sans transformer une preuve bruitée au niveau machine en fausse précision par processus.",
    role: "Chakib a conçu et implémenté la frontière daemon/client, le protocole typé et le modèle de validation, les chemins RAPL Linux et synthétique, les artefacts CLI rejouables, le client pywattch et le workflow développeur Energy Tests.",
    architecture: { overview: "Un daemon privilégié wattch-powerd lit les compteurs RAPL Linux ou une source synthétique et sert des frames strictes et versionnées sur une socket Unix locale. Les clients CLI et Python non privilégiés capturent des descripteurs et échantillons bruts dans des artefacts immuables ; inspection, tests et interprétation restent hors du chemin d'acquisition.", flow: ["RAPL powercap Linux ou source synthétique", "Daemon d'acquisition wattch-powerd", "Protocole versionné sur socket Unix", "CLI / pywattch / Energy Tests", "Manifeste + descripteurs + trace brute", "Inspection et validation hors ligne"] },
    responsibilities: ["Implémentation des crates Rust de domaine, protocole, daemon, powerd, daemon déterministe et CLI.", "Définition des descripteurs typés, classes de preuve, invariants de séquence et frames versionnées.", "Création des artefacts rejouables capture/inspect/validate et d'un client Python compatible pyJoules.", "Ajout de la découverte Energy Tests et d'une vue VS Code avec colonnes joules et budgets par domaine.", "Documentation des privilèges, permissions de socket, compteurs, échecs et non-objectifs explicites."],
    decisions: [{ decision: "Séparer acquisition privilégiée et clients non privilégiés.", rationale: "RAPL peut demander une élévation ; la socket Unix devient une frontière étroite et auditable.", rejectedAlternative: "Laisser chaque processus Python ou CLI lire directement les compteurs protégés." }, { decision: "Garder le daemon sans interprétation.", rationale: "Descripteurs et échantillons bruts restent rejouables tandis qu'agrégations, comparaisons et conclusions évoluent hors ligne.", rejectedAlternative: "Calculer baselines, joules/token, scores ou conseils dans le chemin d'acquisition." }],
    reliability: ["Les invariants rejettent sources inconnues, unités invalides et séquences non monotones.", "Le daemon déterministe valide le même protocole sans présenter les valeurs synthétiques comme mesures matérielles.", "La CI exécute formatage Rust, Clippy avec warnings interdits, tests du workspace, du client Python et de l'extension."],
    outcomes: [],
    currentStatus: "La base publique prend en charge acquisition RAPL Linux et synthétique, protocole local strict, scénarios de test déterministes, workflows CLI capture/inspect/validate, traces rejouables, API Python pywattch et Energy Tests VS Code. Elle ne revendique ni allocation par processus ni précision absolue du compteur.",
    technologyGroups: [{ label: "Systèmes", items: ["Rust", "Linux", "RAPL", "Unix sockets"] }, { label: "Clients", items: ["CLI", "Python", "API pyJoules", "VS Code"] }, { label: "Preuves", items: ["Descripteurs typés", "Daemon déterministe", "Traces rejouables"] }],
    metadata: { title: "Étude de cas Wattch Core | Chakib Belgaid", description: "Une base de mesure protocol-first en Rust avec daemon privilégié, clients non privilégiés, validation déterministe et traces rejouables." },
  },
};

const frenchMediaCopy: Record<string, { alt: string; caption: string }> = {
  "whisperbook-now-playing": {
    alt: "Écran de lecture Android Whisperbook avec état hors ligne, chapitre, locuteur, contrôles, minuteur et casting",
    caption: "La lecture garde visibles le locuteur actif, les contrôles du chapitre et l'état hors ligne sur l'interface Compose réelle.",
  },
  "whisperbook-read-along": {
    alt: "Écran de lecture synchronisée Whisperbook avec passages étiquetés par locuteur et contrôles audio",
    caption: "La lecture synchronisée suit le passage actif tout en permettant de corriger manuellement le locuteur.",
  },
  "whisperbook-voice-cast": {
    alt: "Écran de casting Whisperbook avec langue du livre et voix locales attribuées aux personnages",
    caption: "Le casting gère la langue du livre et les voix locales préécoutables sans quitter l'appareil.",
  },
  "whisperbook-library": {
    alt: "Bibliothèque hors ligne Whisperbook avec reprise de lecture et autres livres locaux",
    caption: "La bibliothèque restaure la position d'écoute et l'état de préparation propres à chaque livre.",
  },
  "wattch-deterministic-trace": {
    alt: "Transcription du daemon de test déterministe Wattch Core",
    caption: "Sortie réelle du scénario déterministe versionné ; preuve de protocole, pas mesure énergétique matérielle.",
  },
  "wattch-energy-tests": {
    alt: "Vue Energy Tests de Wattch Core avec trois tests déterministes, leur durée, les domaines énergétiques et les budgets",
    caption: "La vue Energy Tests livrée, rendue depuis une exécution déterministe réelle ; les valeurs synthétiques valident le workflow, pas le matériel.",
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
    media: english.media.map((item) => ({ ...item, ...frenchMediaCopy[item.id] })),
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
      { id: "product-interfaces", title: "Product interfaces", items: ["Kotlin/Compose and React/TypeScript", "Workflow design", "Accessible, responsive UI"] },
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
    metadata: { title: "Chakib Belgaid | Full-stack Product Engineer", description: "Full-stack product engineer building AI systems and developer tools. Selected work: Whisperbook Android and Wattch Core." },
  },
  fr: {
    locale: "fr",
    nav: { work: "Projets", experience: "Expérience", about: "À propos", garden: "Jardin", cv: "CV", contact: "Contact", languageLabel: "English" },
    hero: { eyebrow: "Mohammed Chakib Belgaid, Ph.D.", title: "Ingénieur produit full-stack pour les systèmes IA et les outils développeurs.", summary: "Docteur en génie logiciel avec plus de 10 ans entre produit, backend et IA appliquée, des applications mobiles portées comme fondateur aux infrastructures de mesure de niveau recherche et aux workflows d'agents en production.", primaryCta: "Voir les projets", secondaryCta: "Télécharger le CV", tertiaryCta: "Entrer dans Systems Garden", evidenceIds: ["cvdb:career-timeline", "cvdb:mcq-agentic-ai-platform", "cvdb:phd-green-coding"] },
    impact: impactEn.map((metric) => ({ ...metric, label: metric.id === "latency" ? "Réduction de latence d'inférence" : metric.id === "nodes" ? "Déploiement PowerAPI" : "Téléchargements PyPI totaux de pyJoules", value: metric.id === "nodes" ? "100+ nœuds" : metric.value })),
    featuredHeading: "Projets sélectionnés",
    featuredIntro: "Deux systèmes documentés par leur architecture, leurs compromis, leur état actuel et des preuves vérifiables.",
    capabilities: [
      { id: "product-interfaces", title: "Interfaces produit", items: ["Kotlin/Compose et React/TypeScript", "Conception de workflows", "UI accessible et responsive"] },
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
    metadata: { title: "Chakib Belgaid | Ingénieur produit full-stack", description: "Ingénieur produit full-stack spécialisé en systèmes IA et outils développeurs. Projets : Whisperbook Android et Wattch Core." },
  },
} as const satisfies Record<Locale, PortfolioSiteContent>;

export { portfolioContacts } from "./contacts";

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

export function getHomePath(locale: Locale): "/live" | "/fr/live" {
  return locale === "fr" ? "/fr/live" : "/live";
}

export function getProjectPath(locale: Locale, slug: ProjectSlug): string {
  return locale === "fr" ? `/fr/work/${slug}` : `/work/${slug}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "en" ? "fr" : "en";
}
