import { useRef, useState, type ReactNode } from "react";
import { CarbonFootprint } from "../sustainability/CarbonFootprint";
import {
  evidenceReferences,
  getAlternateLocale,
  getHomePath,
  getProject,
  getProjectPath,
  portfolioContacts,
  projectSlugs,
  projects,
  resumeLinks,
  siteContent,
  type EvidenceId,
  type EvidenceMetric,
  type Locale,
  type ProjectCaseStudy,
  type ProjectMedia,
  type ProjectSlug
} from "../content/portfolio";

export interface RecruiterRouterProps {
  readonly route: string;
  readonly canonicalBaseUrl?: string;
}

const ui = {
  en: {
    skip: "Skip to content",
    menu: "Menu",
    close: "Close",
    readCase: "Read case study",
    context: "Context and problem",
    ownership: "Ownership and contribution",
    architecture: "Architecture and data flow",
    decisions: "Engineering decisions",
    reliability: "Reliability, security and evaluation",
    outcome: "Outcome and status",
    proof: "Proof and source material",
    responsibilities: "Responsibilities",
    rejected: "Alternative not selected",
    technologies: "Technology groups",
    source: "Evidence",
    back: "Back to selected work",
    notFound: "Page not found",
    notFoundBody: "The page you requested is not part of this portfolio.",
    home: "Return to the portfolio",
    gardenAlt: "Bird-view capture of the Systems Garden interactive lab",
    copyright: "© 2026 Chakib Belgaid"
  },
  fr: {
    skip: "Aller au contenu",
    menu: "Menu",
    close: "Fermer",
    readCase: "Lire l’étude de cas",
    context: "Contexte et problème",
    ownership: "Responsabilité et contribution",
    architecture: "Architecture et flux de données",
    decisions: "Décisions d’ingénierie",
    reliability: "Fiabilité, sécurité et évaluation",
    outcome: "Résultats et état actuel",
    proof: "Preuves et sources",
    responsibilities: "Responsabilités",
    rejected: "Alternative écartée",
    technologies: "Groupes technologiques",
    source: "Preuve",
    back: "Retour aux projets",
    notFound: "Page introuvable",
    notFoundBody: "La page demandée ne fait pas partie de ce portfolio.",
    home: "Retourner au portfolio",
    gardenAlt: "Vue aérienne du laboratoire interactif Systems Garden",
    copyright: "© 2026 Chakib Belgaid"
  }
} as const;

function Arrow({ external = false }: { readonly external?: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d={external ? "M6 4h8v8M14 4 4 14" : "M3 9h11m-4-4 4 4-4 4"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function ExternalLink({
  href,
  children,
  className
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function normalizeRoute(route: string): string {
  const path = route.split(/[?#]/, 1)[0] || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function parseRoute(route: string):
  | { readonly kind: "home"; readonly locale: Locale }
  | { readonly kind: "project"; readonly locale: Locale; readonly slug: ProjectSlug }
  | { readonly kind: "not-found"; readonly locale: Locale } {
  const path = normalizeRoute(route);
  const locale: Locale = path === "/fr" || path.startsWith("/fr/") ? "fr" : "en";

  if (path === "/live" || path === "/fr/live") return { kind: "home", locale };

  const match = path.match(/^\/(?:fr\/)?work\/(mcq-scan|whispbook|wattch)$/);
  if (match) return { kind: "project", locale, slug: match[1] as ProjectSlug };

  return { kind: "not-found", locale };
}

function alternatePath(locale: Locale, slug?: ProjectSlug): string {
  const alternate = getAlternateLocale(locale);
  return slug ? getProjectPath(alternate, slug) : getHomePath(alternate);
}

function resumePdfPath(locale: Locale): string {
  const resume = resumeLinks[locale] as string | { readonly pdf: string };
  return typeof resume === "string" ? resume.replace(/\.html$/, ".pdf") : resume.pdf;
}

function Header({
  locale,
  slug,
  homeLinks = false
}: {
  readonly locale: Locale;
  readonly slug?: ProjectSlug;
  readonly homeLinks?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const copy = siteContent[locale];
  const homePath = getHomePath(locale);
  const sectionLink = (section: string) => homeLinks ? `${homePath}#${section}` : `#${section}`;

  return (
    <header className="portfolio-header" onKeyDown={(event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <div className="portfolio-shell portfolio-header__inner">
        <a className="portfolio-brand" href={homePath} aria-label="Chakib Belgaid — portfolio home">
          CHAKIB BELGAID
        </a>
        <button
          className="portfolio-nav-toggle"
          ref={menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="portfolio-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? ui[locale].close : ui[locale].menu}
        </button>
        <nav id="portfolio-navigation" className="portfolio-nav" data-open={menuOpen} aria-label={locale === "en" ? "Primary" : "Navigation principale"} onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
        }}>
          <a href={sectionLink("work")}>{copy.nav.work}</a>
          <a href={sectionLink("experience")}>{copy.nav.experience}</a>
          <a href={sectionLink("about")}>{copy.nav.about}</a>
          <a href="/game">{copy.nav.garden}</a>
          <a href={resumePdfPath(locale)} download>{copy.nav.cv}</a>
          <a href={alternatePath(locale, slug)} lang={getAlternateLocale(locale)} aria-label={copy.nav.languageLabel}>
            {locale === "en" ? "FR" : "EN"}
          </a>
          <a className="portfolio-nav__contact" href={sectionLink("contact")}>
            {copy.nav.contact} <Arrow />
          </a>
        </nav>
      </div>
    </header>
  );
}

function EvidenceNote({ locale, ids }: { readonly locale: Locale; readonly ids: readonly EvidenceId[] }) {
  if (ids.length === 0) return null;
  return (
    <small className="portfolio-evidence-note">
      {ui[locale].source}: {ids.map((id) => evidenceReferences[id].label).join("; ")}
    </small>
  );
}

function ImpactRail({ locale, metrics }: { readonly locale: Locale; readonly metrics: readonly EvidenceMetric[] }) {
  const supported = metrics.filter((metric) => metric.evidenceIds.length > 0);
  if (supported.length === 0) return null;

  return (
    <section className="portfolio-impact" aria-label={locale === "en" ? "Verified impact" : "Impact vérifié"}>
      {supported.map((metric) => (
        <div className="portfolio-impact__item" key={metric.id} data-evidence-refs={metric.evidenceIds.join(" ")}>
          <strong className="portfolio-impact__value">{metric.value}</strong>
          <span className="portfolio-impact__label">{metric.label}</span>
          <EvidenceNote locale={locale} ids={metric.evidenceIds} />
        </div>
      ))}
    </section>
  );
}

function MediaFrame({ media, priority = false, featured = false }: {
  readonly media: ProjectMedia;
  readonly priority?: boolean;
  readonly featured?: boolean;
}) {
  const classNames = [
    "portfolio-media",
    media.orientation === "portrait" ? "portfolio-media--portrait" : "portfolio-media--landscape",
    featured ? "portfolio-media--featured" : "",
  ].filter(Boolean).join(" ");

  return (
    <figure className={classNames}>
      <img src={media.src} alt={media.alt} loading={priority ? "eager" : "lazy"} decoding="async" />
      <figcaption>{media.caption}</figcaption>
    </figure>
  );
}

function ProjectRow({ locale, project, index }: {
  readonly locale: Locale;
  readonly project: ProjectCaseStudy;
  readonly index: number;
}) {
  const media = project.media[0];
  const technology = project.technologyGroups.flatMap((group) => group.items).slice(0, 5).join(", ");

  return (
    <article className="portfolio-work-row">
      <div className="portfolio-work-row__body">
        <span className="portfolio-work-row__index">{String(index + 1).padStart(2, "0")}</span>
        <h3>{project.name}</h3>
        <p className="portfolio-work-row__summary">{project.summary}</p>
        <a className="portfolio-text-link portfolio-work-row__action" href={getProjectPath(locale, project.slug)}>
          {ui[locale].readCase} <Arrow />
        </a>
      </div>
      <dl className="portfolio-work-row__meta">
        <div>
          <dt>{locale === "en" ? "Technology" : "Technologies"}</dt>
          <dd>{technology}</dd>
        </div>
      </dl>
      {media ? <MediaFrame media={media} featured /> : null}
    </article>
  );
}

function ContactFooter({ locale }: { readonly locale: Locale }) {
  const copy = siteContent[locale].contact;
  return (
    <footer className="portfolio-footer" id="contact">
      <div className="portfolio-shell portfolio-footer__inner">
        <div>
          <h2>{copy.heading}</h2>
          <p>{copy.summary}</p>
        </div>
        <div className="portfolio-contact-links">
          <ExternalLink href={portfolioContacts.github}>{copy.githubLabel} <Arrow external /></ExternalLink>
          <ExternalLink href={portfolioContacts.linkedin}>{copy.linkedinLabel} <Arrow external /></ExternalLink>
          <a href={portfolioContacts.email}>{copy.emailLabel}</a>
        </div>
        <div className="portfolio-footer__meta">
          <span>{ui[locale].copyright}</span>
          <span>{locale === "en" ? "Built for clarity. No tracking." : "Conçu pour être clair. Aucun suivi."}</span>
        </div>
      </div>
    </footer>
  );
}

function HomePage({ locale }: { readonly locale: Locale }) {
  const copy = siteContent[locale];
  const featured = projectSlugs.map((slug) => projects[locale][slug]);

  return (
    <>
      <Header locale={locale} />
      <main id="portfolio-main">
        <div className="portfolio-shell">
          <section className="portfolio-hero" aria-labelledby="portfolio-title">
            <p className="portfolio-hero__name">Chakib Belgaid</p>
            <h1 id="portfolio-title">{copy.hero.title}</h1>
            <p className="portfolio-hero__summary">{copy.hero.summary}</p>
            <div className="portfolio-actions">
              <a className="portfolio-button" href="#work">{copy.hero.primaryCta} <Arrow /></a>
              <a className="portfolio-button portfolio-button--gold" href={resumePdfPath(locale)} download>
                {copy.hero.secondaryCta} <Arrow />
              </a>
              <a className="portfolio-text-link" href="/game">{copy.hero.tertiaryCta} <Arrow /></a>
            </div>
          </section>
          <ImpactRail locale={locale} metrics={copy.impact} />
        </div>

        <section className="portfolio-section" id="work" aria-labelledby="work-title">
          <div className="portfolio-shell">
            <header className="portfolio-section__header">
              <h2 id="work-title">{copy.featuredHeading}</h2>
              <p>{copy.featuredIntro}</p>
            </header>
            <div className="portfolio-work-list">
              {featured.map((project, index) => (
                <ProjectRow key={project.slug} locale={locale} project={project} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="portfolio-section" id="about" aria-labelledby="capabilities-title">
          <div className="portfolio-shell">
            <header className="portfolio-section__header">
              <h2 id="capabilities-title">{locale === "en" ? "Capabilities" : "Compétences"}</h2>
              <p>{locale === "en"
                ? "I connect product decisions to the systems that make them dependable in production."
                : "Je relie les décisions produit aux systèmes qui les rendent fiables en production."}</p>
            </header>
            <div className="portfolio-capabilities">
              {copy.capabilities.map((capability) => (
                <article className="portfolio-capability" key={capability.id}>
                  <h3>{capability.title}</h3>
                  <ul>{capability.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="portfolio-section" id="experience" aria-labelledby="experience-title">
          <div className="portfolio-shell">
            <header className="portfolio-section__header">
              <h2 id="experience-title">{locale === "en" ? "Experience" : "Expérience"}</h2>
              <p>{locale === "en"
                ? "A compact path through product engineering, energy-aware infrastructure, applied research, and full-stack delivery."
                : "Un parcours entre ingénierie produit, infrastructure sobre, recherche appliquée et développement full-stack."}</p>
            </header>
            <div className="portfolio-timeline">
              {copy.timeline.map((item) => (
                <article className="portfolio-timeline__item" key={item.id}>
                  <span className="portfolio-timeline__period">{item.period}</span>
                  <h3>{item.organization}</h3>
                  <div className="portfolio-timeline__body">
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="portfolio-section" aria-labelledby="garden-title">
          <div className="portfolio-shell portfolio-garden">
            <div>
              <span className="portfolio-section-label">{copy.garden.eyebrow}</span>
              <h2 id="garden-title">{copy.garden.title}</h2>
              <p>{copy.garden.summary}</p>
              <span className="portfolio-garden__note">{copy.garden.languageNote}</span>
              <div className="portfolio-actions">
                <a className="portfolio-button" href="/game">{copy.garden.cta} <Arrow /></a>
              </div>
            </div>
            <figure className="portfolio-media">
              <img
                src="/assets/generated/terminal-dashboard-bird-map.png"
                alt={ui[locale].gardenAlt}
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </section>
      </main>
      <ContactFooter locale={locale} />
    </>
  );
}

function CaseSection({
  id,
  number,
  title,
  children
}: {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="portfolio-case-section" id={id}>
      <span className="portfolio-case-section__number">{number}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ProjectPage({ locale, slug }: { readonly locale: Locale; readonly slug: ProjectSlug }) {
  const project = getProject(locale, slug);
  const labels = ui[locale];
  const architectureFlow = Array.isArray(project.architecture.flow)
    ? project.architecture.flow
    : [project.architecture.flow];

  const sectionLinks = [
    ["context", labels.context],
    ["ownership", labels.ownership],
    ["architecture", labels.architecture],
    ["decisions", labels.decisions],
    ["reliability", labels.reliability],
    ["outcome", labels.outcome],
    ["proof", labels.proof]
  ] as const;

  return (
    <>
      <Header locale={locale} slug={slug} homeLinks />
      <main id="portfolio-main">
        <div className="portfolio-shell">
          <section className="portfolio-case-hero">
            <div>
              <span className="portfolio-section-label">{project.eyebrow}</span>
              <h1>{project.name}</h1>
              <p className="portfolio-case-hero__summary">{project.summary}</p>
              <div className="portfolio-actions">
                <a className="portfolio-text-link" href={`${getHomePath(locale)}#work`}><Arrow /> {labels.back}</a>
              </div>
            </div>
            <dl className="portfolio-case-hero__meta">
              <div>
                <dt>{locale === "en" ? "Role" : "Rôle"}</dt>
                <dd>{project.role}</dd>
              </div>
              <div>
                <dt>{locale === "en" ? "Current status" : "État actuel"}</dt>
                <dd>{project.currentStatus}</dd>
              </div>
            </dl>
          </section>
          {project.media[0] ? <MediaFrame media={project.media[0]} priority featured /> : null}

          <div className="portfolio-case-layout">
            <aside className="portfolio-case-layout__aside" aria-label={locale === "en" ? "Case study sections" : "Sections de l’étude de cas"}>
              {sectionLinks.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
            </aside>
            <div className="portfolio-case-content">
              <CaseSection id="context" number="01" title={labels.context}>
                <p>{project.problem}</p>
              </CaseSection>

              <CaseSection id="ownership" number="02" title={labels.ownership}>
                <p>{project.role}</p>
                <h3>{labels.responsibilities}</h3>
                <ul className="portfolio-case-list">
                  {project.responsibilities.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </CaseSection>

              <CaseSection id="architecture" number="03" title={labels.architecture}>
                <p>{project.architecture.overview}</p>
                <ol className="portfolio-flow">
                  {architectureFlow.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </CaseSection>

              <CaseSection id="decisions" number="04" title={labels.decisions}>
                <div className="portfolio-decision-list">
                  {project.decisions.map((decision) => (
                    <article className="portfolio-decision" key={decision.decision}>
                      <h3>{decision.decision}</h3>
                      <p>
                        {decision.rationale}
                        <span className="portfolio-decision__rejected">
                          {labels.rejected}: {decision.rejectedAlternative}
                        </span>
                      </p>
                    </article>
                  ))}
                </div>
              </CaseSection>

              <CaseSection id="reliability" number="05" title={labels.reliability}>
                <ul className="portfolio-case-list">
                  {project.reliability.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </CaseSection>

              <CaseSection id="outcome" number="06" title={labels.outcome}>
                {project.outcomes.length > 0 ? (
                  <div className="portfolio-outcomes">
                    {project.outcomes.filter((outcome) => outcome.evidenceIds.length > 0).map((outcome) => (
                      <div className="portfolio-outcome" key={outcome.id} data-evidence-refs={outcome.evidenceIds.join(" ")}>
                        <strong>{outcome.value}</strong>
                        <span>{outcome.label}</span>
                        <EvidenceNote locale={locale} ids={outcome.evidenceIds} />
                      </div>
                    ))}
                  </div>
                ) : null}
                <p>{project.currentStatus}</p>
                <h3>{labels.technologies}</h3>
                <div className="portfolio-case-tech">
                  {project.technologyGroups.map((group) => (
                    <div key={group.label}>
                      <h3>{group.label}</h3>
                      <p>{group.items.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </CaseSection>

              <CaseSection id="proof" number="07" title={labels.proof}>
                {project.evidenceIds ? <EvidenceNote locale={locale} ids={project.evidenceIds} /> : null}
                {project.media.length > 1 ? (
                  <div className="portfolio-media-grid">
                    {project.media.slice(1).map((media) => <MediaFrame media={media} key={media.id} />)}
                  </div>
                ) : null}
                <div className="portfolio-proof-links">
                  {project.proofLinks.map((link) => (
                    <ExternalLink href={link.url} key={link.id}>{link.label} <Arrow external /></ExternalLink>
                  ))}
                </div>
              </CaseSection>
            </div>
          </div>
        </div>
      </main>
      <ContactFooter locale={locale} />
    </>
  );
}

function NotFoundPage({ locale }: { readonly locale: Locale }) {
  const labels = ui[locale];
  return (
    <>
      <Header locale={locale} homeLinks />
      <main className="portfolio-shell portfolio-not-found" id="portfolio-main">
        <h1>{labels.notFound}</h1>
        <p>{labels.notFoundBody}</p>
        <a className="portfolio-button" href={getHomePath(locale)}>{labels.home} <Arrow /></a>
      </main>
      <ContactFooter locale={locale} />
    </>
  );
}

export function RecruiterRouter({ route }: RecruiterRouterProps) {
  const parsed = parseRoute(route);

  return (
    <div className="portfolio-site" data-locale={parsed.locale}>
      <a className="portfolio-skip-link" href="#portfolio-main">{ui[parsed.locale].skip}</a>
      {parsed.kind === "home" ? <HomePage locale={parsed.locale} /> : null}
      {parsed.kind === "project" ? <ProjectPage locale={parsed.locale} slug={parsed.slug} /> : null}
      {parsed.kind === "not-found" ? <NotFoundPage locale={parsed.locale} /> : null}
      <CarbonFootprint locale={parsed.locale} />
    </div>
  );
}

export default RecruiterRouter;
