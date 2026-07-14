import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BatteryCharging,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Code2,
  Coffee,
  Cpu,
  Droplets,
  FlaskConical,
  FolderKanban,
  Github,
  Heart,
  Info,
  Leaf,
  Linkedin,
  Mail,
  Map,
  Menu,
  MessageSquareText,
  Pause,
  Palette,
  Play,
  Power,
  RefreshCcw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Terminal,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRobotColorSeed, useGameStore } from '../game/store';
import { getNearestSystem, getSystemById, isSystemUnlocked } from '../game/content';
import { queueJumpRequest } from '../game/jump';
import type { InputAction, InputDirection } from '../game/types';
import { WEBSITE_SECTIONS } from '../game/world/generated/terminalDashboardMap';
import type {
  WebsiteDrawerId,
  WebsiteSection,
  WebsiteSectionId,
} from '../game/world/map/schema';
import { getGardenCaseStudyPath } from '../garden/caseStudyLinks';
import '../styles/theme.css';
import '../styles/ui.css';

type ProjectId = 'wattch' | 'whispbook' | 'agent-commerce' | 'dev-tools';
type DrawerId = WebsiteDrawerId | null;
type NavDestination = Exclude<DrawerId, null> | 'log';
type MovementDirection = InputDirection;

interface ProjectUI {
  id: ProjectId;
  title: string;
  eyebrow: string;
  description: string;
  accent: string;
  icon: typeof Zap;
  objective: string;
}

const PROJECTS: readonly ProjectUI[] = [
  {
    id: 'wattch',
    title: 'WATTCH',
    eyebrow: 'MEASURE · ANALYZE · OPTIMIZE',
    description: 'Energy profiler for AI workloads. Measure. Analyze. Optimize.',
    accent: '#9bd42b',
    icon: Zap,
    objective: 'Calibrate the energy meter inside its efficient 87% target band.',
  },
  {
    id: 'whispbook',
    title: 'WHISPBOOK',
    eyebrow: 'SPEAK · STRUCTURE · REFINE',
    description: 'AI voice system to create books using TTS.',
    accent: '#9b59e8',
    icon: Volume2,
    objective: 'Restore the voice pipeline in the correct stage order.',
  },
  {
    id: 'agent-commerce',
    title: 'AGENT COMMERCE',
    eyebrow: 'PLAN · ACT · VERIFY',
    description: 'Exploring agentic commerce systems & autonomous workflows.',
    accent: '#29b8c7',
    icon: Bot,
    objective: 'Route every agent job through a safe operational loop.',
  },
  {
    id: 'dev-tools',
    title: 'DEV TOOLS',
    eyebrow: 'INSPECT · COMPOSE · SHIP',
    description: 'CLIs, libraries and tools that make developers 10x more productive.',
    accent: '#e7a43d',
    icon: Code2,
    objective: 'Activate the local-first delivery pipeline from source to release.',
  },
] as const;

const FIRST_FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialogFocus(onDismiss?: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FIRST_FOCUSABLE);
    (focusables?.[0] ?? dialog)?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissRef.current) {
        event.preventDefault();
        dismissRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FIRST_FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, []);

  return dialogRef;
}

function PanelFrame({
  className = '',
  children,
  as: Element = 'section',
  ...props
}: {
  className?: string;
  children: ReactNode;
  as?: 'section' | 'aside' | 'header' | 'footer' | 'div';
} & Record<string, unknown>) {
  return (
    <Element className={`metal-panel ${className}`} {...props}>
      <span className="panel-rivet panel-rivet--tl" aria-hidden="true" />
      <span className="panel-rivet panel-rivet--tr" aria-hidden="true" />
      <span className="panel-rivet panel-rivet--bl" aria-hidden="true" />
      <span className="panel-rivet panel-rivet--br" aria-hidden="true" />
      {children}
    </Element>
  );
}

function Brand() {
  return (
    <PanelFrame className="brand-plaque" as="div">
      <div className="brand-mark" aria-hidden="true">
        <Bot strokeWidth={1.6} />
        <Sprout className="brand-sprout" strokeWidth={2} />
      </div>
      <div className="brand-copy">
        <strong>CHAKIB BELGAID</strong>
        <span>AI SYSTEMS GARDENER</span>
      </div>
      <Leaf className="brand-leaf" aria-hidden="true" />
    </PanelFrame>
  );
}

function TopRail({ onNavigate }: { onNavigate: (destination: NavDestination) => void }) {
  const links: readonly [string, NavDestination][] = [
    ['HOME', 'profile'],
    ['PROJECTS', 'projects'],
    ['ABOUT', 'profile'],
    ['BLOG', 'log'],
    ['EXPERIMENTS', 'cultivation'],
    ['CONTACT', 'contact'],
  ];
  return (
    <header className="top-rail" aria-label="Primary game navigation">
      <Brand />
      <nav className="site-nav" aria-label="Portfolio sections">
        {links.map(([link, destination], index) => (
          <button
            className={index === 0 ? 'is-active' : ''}
            key={link}
            type="button"
            onClick={() => onNavigate(destination)}
            aria-current={index === 0 ? 'page' : undefined}
          >
            {link}
          </button>
        ))}
      </nav>
      <PanelFrame className="terminal-plaque" as="div">
        <span>
          &gt;.building useful things.
          <br />
          <span>measuring what matters.</span>
        </span>
        <i className="terminal-cursor" aria-hidden="true" />
      </PanelFrame>
    </header>
  );
}

function HeroPanel({ onOpenProjects, onOpenLog }: { onOpenProjects: () => void; onOpenLog: () => void }) {
  return (
    <PanelFrame className="hero-panel" aria-labelledby="hero-title">
      <div className="hero-flourish" aria-hidden="true">
        <span />
        <Leaf size={14} />
        <span />
      </div>
      <h1 id="hero-title">
        I GROW SYSTEMS
        <br />
        THAT <em>THINK, MEASURE</em>
        <br />
        AND <strong>SAVE ENERGY.</strong>
      </h1>
      <div className="section-rule" aria-hidden="true">
        <span />
        <Sprout size={13} />
        <span />
      </div>
      <p className="hero-intro">
        I build AI systems, developer tools and infrastructure that are intelligent, efficient and
        impactful.
      </p>
      <ul className="feature-list">
        <li>
          <Bot aria-hidden="true" /> AI Agents &amp; Automation
        </li>
        <li>
          <Terminal aria-hidden="true" /> Developer Tools
        </li>
        <li>
          <Zap aria-hidden="true" /> Energy-Aware Systems
        </li>
        <li>
          <FlaskConical aria-hidden="true" /> Research &amp; Prototyping
        </li>
      </ul>
      <blockquote>
        <Leaf aria-hidden="true" />
        <span>
          _Measure before you optimize.
          <br />
          &quot;Understand before you build.&quot;
        </span>
      </blockquote>
      <div className="hero-actions">
        <button className="pixel-button pixel-button--primary" type="button" onClick={onOpenProjects}>
          VIEW PROJECTS <ChevronRight aria-hidden="true" />
        </button>
        <button className="pixel-button" type="button" onClick={onOpenLog}>
          READ THE BLOG <BookOpen aria-hidden="true" />
        </button>
      </div>
    </PanelFrame>
  );
}

function StatsPanel() {
  const stats = [
    ['82+', 'Repositories'],
    ['1.5k+', 'Stars'],
    ['300+', 'Contributions'],
    ['2017', 'Joined GitHub'],
  ];
  return (
    <PanelFrame className="stats-panel" aria-labelledby="stats-title">
      <div className="stats-mascot" aria-hidden="true">
        <Sprout />
        <Bot />
        <Droplets />
      </div>
      <div className="stats-copy">
        <h2 id="stats-title">GITHUB STATS</h2>
        <dl>
          {stats.map(([value, label]) => (
            <div key={label}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="build-meter">
        <span>Building in public since day one.</span>
        <div className="segmented-bar" aria-label="Building in public progress: 100 percent">
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <strong>100%</strong>
      </div>
    </PanelFrame>
  );
}

function ProjectCard({
  project,
  restored,
  onOpen,
}: {
  project: ProjectUI;
  restored: boolean;
  onOpen: (id: ProjectId) => void;
}) {
  const Icon = project.icon;
  const caseStudyPath = getGardenCaseStudyPath(project.id);
  const gardenAction = restored ? 'EXPLORE SYSTEM' : 'PLAY CHALLENGE';
  return (
    <article
      className={`project-card ${restored ? 'is-restored' : ''}`}
      style={{ '--project-accent': project.accent } as CSSProperties}
    >
      <button
        className="project-card__garden-action"
        type="button"
        onClick={() => onOpen(project.id)}
        aria-label={`${gardenAction}: ${project.title}`}
      >
        <span className="project-card__title">
          <Icon aria-hidden="true" /> {project.title}
        </span>
        <span className="project-card__description">{project.description}</span>
        <span className="project-card__signal" aria-hidden="true">
          {restored ? (
            <>
              <CheckCircle2 /> RESTORED
            </>
          ) : project.id === 'whispbook' ? (
            <span className="waveform" />
          ) : project.id === 'wattch' ? (
            <span className="sparkline">⌁╱╲╱⌁╲</span>
          ) : project.id === 'agent-commerce' ? (
            <Bot />
          ) : (
            <Terminal />
          )}
        </span>
        <span className="project-card__action-label">{gardenAction}</span>
      </button>
      {caseStudyPath && (
        <a className="project-card__case-link" href={caseStudyPath}>
          READ FULL CASE STUDY <BookOpen aria-hidden="true" />
        </a>
      )}
    </article>
  );
}

function ProjectsTray({ restoredIds, onOpen }: { restoredIds: string[]; onOpen: (id: ProjectId) => void }) {
  return (
    <PanelFrame className="projects-tray" aria-labelledby="projects-title">
      <h2 id="projects-title">FEATURED PROJECTS</h2>
      <div className="project-grid">
        {PROJECTS.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            restored={restoredIds.includes(project.id)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <button className="tray-button" type="button" onClick={() => onOpen('wattch')}>
        VIEW ALL PROJECTS <ArrowRight aria-hidden="true" />
      </button>
    </PanelFrame>
  );
}

function CultivationPanel() {
  return (
    <PanelFrame className="cultivation-panel" aria-labelledby="cultivation-title">
      <h2 id="cultivation-title">CURRENTLY CULTIVATING</h2>
      <ul>
        <li>
          <Sprout aria-hidden="true" /> Local-first AI systems
        </li>
        <li>
          <Zap aria-hidden="true" /> Energy-aware research
        </li>
        <li>
          <Heart aria-hidden="true" /> Open source everything
        </li>
      </ul>
      <div className="cultivation-progress">
        <span>Always learning, always building.</span>
        <div className="segmented-bar" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <i key={index} className={index > 6 ? 'is-dim' : ''} />
          ))}
        </div>
      </div>
    </PanelFrame>
  );
}

function FooterRail({ onOpenProfile }: { onOpenProfile: () => void }) {
  return (
    <footer className="footer-rail">
      <div className="social-links" aria-label="Social links">
        <button type="button" aria-label="GitHub profile information" onClick={onOpenProfile}>
          <Github />
        </button>
        <button type="button" aria-label="LinkedIn profile information" onClick={onOpenProfile}>
          <Linkedin />
        </button>
        <button type="button" aria-label="Contact information" onClick={onOpenProfile}>
          <Mail />
        </button>
      </div>
      <span>© 2024 Chakib Belgaid</span>
      <span className="built-with">
        Built with <Heart aria-label="care" />, React &amp; lots of <Coffee aria-label="coffee" />
      </span>
      <span>Let&apos;s build a better future.</span>
    </footer>
  );
}

function DesktopPortfolio({
  restoredIds,
  onOpenProject,
  onNavigate,
}: {
  restoredIds: string[];
  onOpenProject: (id: ProjectId) => void;
  onNavigate: (destination: NavDestination) => void;
}) {
  return (
    <div className="desktop-portfolio">
      <TopRail onNavigate={onNavigate} />
      <HeroPanel onOpenProjects={() => onNavigate('projects')} onOpenLog={() => onNavigate('log')} />
      <StatsPanel />
      <ProjectsTray restoredIds={restoredIds} onOpen={onOpenProject} />
      <CultivationPanel />
      <FooterRail onOpenProfile={() => onNavigate('profile')} />
    </div>
  );
}

function ProgressHUD({
  restoredIds,
  playerPosition,
  onPause,
  onOpenLog,
  onOpenProjects,
  onOpenMenu,
  onToggleOverview,
}: {
  restoredIds: string[];
  playerPosition: { x: number; z: number };
  onPause: () => void;
  onOpenLog: () => void;
  onOpenProjects: () => void;
  onOpenMenu: () => void;
  onToggleOverview: () => void;
}) {
  const nextProject = PROJECTS.find((project) => !restoredIds.includes(project.id));
  const nextSystem = getSystemById(nextProject?.id);
  const distance = nextSystem
    ? Math.round(Math.hypot(nextSystem.position.x - playerPosition.x, nextSystem.position.z - playerPosition.z))
    : 0;
  const bearing = nextSystem
    ? Math.atan2(nextSystem.position.x - playerPosition.x, -(nextSystem.position.z - playerPosition.z)) * 180 / Math.PI
    : 0;
  const percent = Math.round((restoredIds.length / PROJECTS.length) * 100);
  return (
    <>
      <section className="objective-chip" aria-label="Current objective">
        <div className="objective-chip__icon" aria-hidden="true">
          {nextProject ? <CircleGauge /> : <Sparkles />}
        </div>
        <div>
          <span>{nextProject ? 'CURRENT OBJECTIVE' : 'GARDEN RESTORED'}</span>
          <strong>{nextProject ? `Restore ${nextProject.title}` : 'Return to the heart of the garden'}</strong>
        </div>
        <div
          className="objective-chip__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={restoredIds.length}
          aria-label={`${restoredIds.length} of 4 systems restored`}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <b>{restoredIds.length}/4</b>
        {nextSystem && (
          <span className="objective-chip__range">
            <ArrowUp style={{ transform: `rotate(${bearing}deg)` }} aria-hidden="true" />
            {distance}M
          </span>
        )}
      </section>
      <div className="utility-buttons">
        <button
          type="button"
          onClick={onToggleOverview}
          aria-label="Open bird's-eye website view"
          aria-pressed="false"
          aria-keyshortcuts="B"
          title="Bird's-eye website view (B)"
        >
          <Map />
        </button>
        <button type="button" onClick={onOpenMenu} aria-label="Open garden menu" title="Garden menu">
          <Menu />
        </button>
        <button type="button" onClick={onOpenProjects} aria-label="Projects" title="Projects">
          <FolderKanban />
        </button>
        <button type="button" onClick={onOpenLog} aria-label="Field log" title="Field log (Tab)">
          <BookOpen />
        </button>
        <button type="button" onClick={onPause} aria-label="Pause game" title="Pause (P)">
          <Pause />
        </button>
        <a className="portfolio-action" href="/" aria-label="Portfolio" title="Return to portfolio">
          <ArrowLeft aria-hidden="true" /> <span>PORTFOLIO</span>
        </a>
      </div>
    </>
  );
}

function InteractionPrompt({ notice, nearbyTitle }: { notice: string | null; nearbyTitle?: string }) {
  return (
    <div
      className={`interaction-prompt ${notice ? 'has-notice' : ''}`}
      data-testid="interaction-prompt"
      role="status"
      aria-live="polite"
    >
      {notice ? (
        <>
          <Info aria-hidden="true" /> <span>{notice}</span>
        </>
      ) : nearbyTitle ? (
        <>
          <kbd>E</kbd>
          <span>INTERACT WITH {nearbyTitle} BEACON</span>
        </>
      ) : (
        <>
          <CircleGauge aria-hidden="true" />
          <span>FOLLOW THE COMPASS · SPACE TO JUMP · SHIFT TO SPRINT</span>
        </>
      )}
    </div>
  );
}

function MobileHud({
  restoredIds,
  onDrawer,
  onOpenLog,
  onPause,
  onToggleOverview,
}: {
  restoredIds: string[];
  onDrawer: (drawer: DrawerId) => void;
  onOpenLog: () => void;
  onPause: () => void;
  onToggleOverview: () => void;
}) {
  return (
    <div className="mobile-hud">
      <div className="mobile-topbar">
        <button type="button" aria-label="Open information menu" onClick={() => onDrawer('profile')}>
          <Menu />
        </button>
        <div>
          <Sprout aria-hidden="true" />
          <span>SYSTEMS GARDEN</span>
          <b>{restoredIds.length}/4</b>
        </div>
        <button type="button" aria-label="Pause game" onClick={onPause}>
          <Pause />
        </button>
      </div>
      <div className="mobile-quickbar">
        <button
          className="mobile-overview-button"
          type="button"
          onClick={onToggleOverview}
          aria-label="Open bird's-eye website view"
          aria-pressed="false"
          aria-keyshortcuts="B"
        >
          <Map /> OVERVIEW
        </button>
        <button type="button" onClick={() => onDrawer('projects')}>
          <FolderKanban /> Projects
        </button>
        <button type="button" onClick={onOpenLog} aria-label="Field log">
          <BookOpen /> Field log
        </button>
        <a href="/" aria-label="Portfolio">
          <ArrowLeft aria-hidden="true" /> Portfolio
        </a>
      </div>
    </div>
  );
}

function BirdViewHUD({
  sectionsOpen,
  onOpenSections,
  onPause,
  onReturn,
}: {
  sectionsOpen: boolean;
  onOpenSections: () => void;
  onPause: () => void;
  onReturn: () => void;
}) {
  return (
    <section className="bird-view-hud" aria-label="Bird's-eye website controls">
      <div className="bird-view-hud__status">
        <Map aria-hidden="true" />
        <span>ISLAND OVERVIEW</span>
        <small>SELECT A PHYSICAL WEBSITE SECTION</small>
      </div>
      <div className="bird-view-hud__actions">
        <button
          type="button"
          onClick={onOpenSections}
          aria-haspopup="dialog"
          aria-expanded={sectionsOpen}
        >
          <Menu aria-hidden="true" /> SECTIONS
        </button>
        <button type="button" onClick={onPause}>
          <Pause aria-hidden="true" /> PAUSE
        </button>
        <button
          className="bird-return-action"
          type="button"
          onClick={onReturn}
          aria-label="Return to garden exploration"
          aria-pressed="true"
          aria-keyshortcuts="B"
        >
          <ArrowDown aria-hidden="true" /> RETURN TO GARDEN
        </button>
        <a className="bird-portfolio-action" href="/" aria-label="Portfolio">
          <ArrowLeft aria-hidden="true" /> PORTFOLIO
        </a>
      </div>
    </section>
  );
}

function BirdSectionsMenu({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (id: WebsiteSectionId) => void;
}) {
  return (
    <DialogFrame
      title="ISLAND SECTIONS"
      eyebrow="ACCESSIBLE WEBSITE NAVIGATION"
      onClose={onClose}
      className="website-sections-dialog"
      testId="website-sections-menu"
    >
      <p className="website-sections-intro">
        Choose the same sections represented by the physical tiles below.
      </p>
      <nav className="website-sections-menu" aria-label="Island website sections">
        {WEBSITE_SECTIONS.map((section: WebsiteSection, index: number) => (
          <button
            type="button"
            key={`${section.id}-${index}`}
            onClick={() => onSelect(section.id)}
            aria-label={`Open ${section.label} section`}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <b>{section.label}</b>
            <ChevronRight aria-hidden="true" />
          </button>
        ))}
      </nav>
    </DialogFrame>
  );
}

function ContactPanel() {
  return (
    <section className="contact-panel" aria-labelledby="contact-title">
      <Mail aria-hidden="true" />
      <div>
        <span>CONTACT CHANNELS</span>
        <h2 id="contact-title">LET&apos;S BUILD USEFUL SYSTEMS.</h2>
        <p>
          Open to conversations about applied AI, developer tooling, local-first systems and
          energy-aware software.
        </p>
      </div>
      <ul aria-label="Available contact channels">
        <li><Github aria-hidden="true" /> GitHub</li>
        <li><Linkedin aria-hidden="true" /> LinkedIn</li>
        <li><Mail aria-hidden="true" /> Email</li>
      </ul>
    </section>
  );
}

function Drawer({
  drawer,
  restoredIds,
  onClose,
  onOpenProject,
  onSetDrawer,
}: {
  drawer: Exclude<DrawerId, null>;
  restoredIds: string[];
  onClose: () => void;
  onOpenProject: (id: ProjectId) => void;
  onSetDrawer: (drawer: DrawerId) => void;
}) {
  const close = useCallback(() => onClose(), [onClose]);
  const dialogRef = useDialogFocus(close);
  return (
    <div className="modal-backdrop mobile-drawer-backdrop" onPointerDown={onClose}>
      <div
        className="mobile-drawer metal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Garden information"
        tabIndex={-1}
        ref={dialogRef}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-handle" aria-hidden="true" />
        <div className="drawer-heading">
          <span>GARDEN CONSOLE</span>
          <button type="button" onClick={onClose} aria-label="Close information menu">
            <X />
          </button>
        </div>
        <nav className="drawer-tabs" aria-label="Garden information sections">
          {(['profile', 'stats', 'projects', 'cultivation', 'contact'] as const).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => onSetDrawer(item)}
              aria-current={drawer === item ? 'page' : undefined}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="drawer-body">
          {drawer === 'profile' && (
            <>
              <Brand />
              <h2>I GROW SYSTEMS THAT THINK, MEASURE AND SAVE ENERGY.</h2>
              <p>
                I build AI systems, developer tools and infrastructure that are intelligent,
                efficient and impactful.
              </p>
              <ul className="feature-list">
                <li><Bot /> AI Agents &amp; Automation</li>
                <li><Terminal /> Developer Tools</li>
                <li><Zap /> Energy-Aware Systems</li>
              </ul>
            </>
          )}
          {drawer === 'stats' && <StatsPanel />}
          {drawer === 'projects' && (
            <div className="drawer-projects">
              {PROJECTS.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  restored={restoredIds.includes(project.id)}
                  onOpen={onOpenProject}
                />
              ))}
            </div>
          )}
          {drawer === 'cultivation' && <CultivationPanel />}
          {drawer === 'contact' && <ContactPanel />}
        </div>
      </div>
    </div>
  );
}

function TouchControls({
  setInput,
  onInteract,
  onWave,
}: {
  setInput: (input: InputAction, active: boolean) => void;
  onInteract: () => void;
  onWave: () => void;
}) {
  const bindDirection = (direction: MovementDirection) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      setInput(direction, true);
    },
    onPointerUp: () => setInput(direction, false),
    onPointerCancel: () => setInput(direction, false),
    onLostPointerCapture: () => setInput(direction, false),
  });

  const bindJump = {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      queueJumpRequest();
      setInput('jump', true);
    },
    onPointerUp: () => setInput('jump', false),
    onPointerCancel: () => setInput('jump', false),
    onLostPointerCapture: () => setInput('jump', false),
  };

  return (
    <div className="touch-controls" data-testid="touch-controls">
      <div className="touch-dpad" aria-label="Movement controls">
        <button type="button" className="dpad-up" aria-label="Move up" {...bindDirection('up')}>
          <ArrowUp />
        </button>
        <button type="button" className="dpad-left" aria-label="Move left" {...bindDirection('left')}>
          <ArrowLeft />
        </button>
        <span className="dpad-center" aria-hidden="true" />
        <button type="button" className="dpad-right" aria-label="Move right" {...bindDirection('right')}>
          <ArrowRight />
        </button>
        <button type="button" className="dpad-down" aria-label="Move down" {...bindDirection('down')}>
          <ArrowDown />
        </button>
      </div>
      <div className="touch-actions">
        <button type="button" className="touch-wave" aria-label="Wave" title="Wave" onClick={onWave}>
          <Waves />
        </button>
        <button type="button" className="touch-jump" aria-label="Jump" title="Jump" {...bindJump}>
          <ArrowUp />
          <span>JUMP</span>
        </button>
        <button type="button" className="touch-interact" aria-label="Interact" onClick={onInteract}>
          <Zap />
          <span>ACT</span>
        </button>
      </div>
    </div>
  );
}

function TitleScreen({
  hasSave,
  onNew,
  onContinue,
  onSettings,
}: {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
  onSettings: () => void;
}) {
  return (
    <main className="cinematic-screen title-screen" data-testid="title-screen">
      <div className="cinematic-art" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <section className="title-console metal-panel" aria-labelledby="game-title">
        <div className="title-kicker">
          <Sprout aria-hidden="true" /> A CHAKIB BELGAID GARDEN
        </div>
        <h1 id="game-title">
          SYSTEMS
          <span>GARDEN</span>
        </h1>
        <p>
          Explore a living terminal island, discover four technology districts and bring the garden back online.
        </p>
        <div className="title-actions">
          <button className="pixel-button pixel-button--primary" type="button" onClick={onNew} aria-label="New game" autoFocus={!hasSave}>
            <Play aria-hidden="true" /> NEW GAME
          </button>
          <button className="pixel-button" type="button" onClick={onContinue} disabled={!hasSave} aria-label="Continue" autoFocus={hasSave}>
            <RefreshCcw aria-hidden="true" /> CONTINUE
          </button>
          <button className="icon-text-button" type="button" onClick={onSettings} aria-label="Settings">
            <Settings aria-hidden="true" /> SETTINGS
          </button>
          <a className="icon-text-button" href="/" aria-label="Portfolio">
            <ArrowLeft aria-hidden="true" /> PORTFOLIO
          </a>
        </div>
        <div className="title-controls" aria-label="Game controls">
          <span><kbd>WASD</kbd> MOVE</span>
          <span><kbd>SHIFT</kbd> SPRINT</span>
          <span><kbd>SPACE</kbd> JUMP</span>
          <span><kbd>DRAG</kbd> LOOK</span>
          <span><kbd>E</kbd> INTERACT</span>
          <span><kbd>B</kbd> OVERVIEW</span>
          <span><kbd>TAB</kbd> FIELD LOG</span>
        </div>
      </section>
      <div className="title-status">
        <i /> LOCAL SAVE · OFFLINE READY
      </div>
    </main>
  );
}

function DialogFrame({
  title,
  eyebrow,
  onClose,
  children,
  className = '',
  testId,
}: {
  title: string;
  eyebrow?: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  const titleId = useId();
  const close = useCallback(() => onClose?.(), [onClose]);
  const dialogRef = useDialogFocus(onClose ? close : undefined);
  return (
    <div className="modal-backdrop">
      <div
        className={`dialog-frame metal-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
        data-testid={testId}
      >
        <div className="dialog-header">
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2 id={titleId}>{title}</h2>
          </div>
          {onClose && (
            <button type="button" className="dialog-close" onClick={onClose} aria-label={`Close ${title}`}>
              <X />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function ChallengeResult({
  complete,
  feedback,
  onRestore,
}: {
  complete: boolean;
  feedback: string;
  onRestore: () => void;
}) {
  return (
    <div className={`challenge-result ${complete ? 'is-complete' : ''}`} aria-live="polite">
      <span>{feedback}</span>
      <button
        className="pixel-button pixel-button--primary"
        type="button"
        disabled={!complete}
        onClick={onRestore}
      >
        <Power aria-hidden="true" /> RESTORE SYSTEM
      </button>
    </div>
  );
}

function WattchChallenge({ onRestore }: { onRestore: (answer: unknown) => void }) {
  const [value, setValue] = useState(42);
  const calibrated = value >= 84 && value <= 90;
  const feedback = calibrated
      ? 'Stable signal acquired. Efficiency is inside the 87% target band.'
    : value < 84
      ? 'Signal underpowered. Raise the energy profile toward the green band.'
      : 'Thermal overhead detected. Lower the energy profile into the green band.';
  return (
    <div className="challenge challenge--wattch">
      <p>Balance useful compute against energy draw. Set the meter between 84 and 90.</p>
      <div className="meter-readout">
        <BatteryCharging aria-hidden="true" />
        <strong>{value}%</strong>
        <span>{calibrated ? 'EFFICIENT' : value < 84 ? 'UNDER TARGET' : 'OVER TARGET'}</span>
      </div>
      <div className="range-wrap">
        <span className="target-band" aria-hidden="true" />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-label="Energy calibration percentage"
        />
      </div>
      <div className="range-labels" aria-hidden="true"><span>0</span><span>TARGET 84–90 · IDEAL 87</span><span>100</span></div>
      <ChallengeResult complete={calibrated} feedback={feedback} onRestore={() => onRestore({ value })} />
    </div>
  );
}

function WhispbookChallenge({ onRestore }: { onRestore: (answer: unknown) => void }) {
  const stages = ['SPEAK', 'STRUCTURE', 'REFINE'] as const;
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const complete = selected.length === stages.length;

  const choose = (stage: string) => {
    if (complete) return;
    if (stage === stages[selected.length]) {
      setSelected((current) => [...current, stage]);
      setError(false);
    } else {
      setSelected([]);
      setError(true);
    }
  };

  return (
    <div className="challenge challenge--sequence">
      <p>Reconnect the book-making voice pipeline. Select each stage in production order.</p>
      <div className="voice-signal" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => <i key={index} />)}
      </div>
      <div className="sequence-buttons">
        {['REFINE', 'SPEAK', 'STRUCTURE'].map((stage) => {
          const index = selected.indexOf(stage);
          return (
            <button
              type="button"
              key={stage}
              className={index >= 0 ? 'is-selected' : ''}
              onClick={() => choose(stage)}
            >
              {index >= 0 ? <Check /> : <MessageSquareText />}
              <span>{stage}</span>
              {index >= 0 && <b>0{index + 1}</b>}
            </button>
          );
        })}
      </div>
      <ChallengeResult
        complete={complete}
        feedback={complete ? 'Voice pipeline synchronized.' : error ? 'Sequence lost. Start from the source signal.' : `${selected.length}/3 stages linked.`}
        onRestore={() => onRestore({ steps: selected.map((stage) => stage.toLowerCase()) })}
      />
    </div>
  );
}

type AgentStage = 'PLAN' | 'ACT' | 'VERIFY';
const AGENT_STAGES: readonly AgentStage[] = ['PLAN', 'ACT', 'VERIFY'];

function AgentCommerceChallenge({ onRestore }: { onRestore: (answer: unknown) => void }) {
  const jobs = ['ENERGY AUDIT', 'SEED ORDER', 'HELPER DEPLOY'];
  const [progress, setProgress] = useState<Record<string, number>>(() => Object.fromEntries(jobs.map((job) => [job, 0])));
  const [feedback, setFeedback] = useState('Every job must be planned, acted on, and verified.');
  const complete = jobs.every((job) => progress[job] === 3);

  const advance = (job: string, stage: AgentStage) => {
    const expected = AGENT_STAGES[progress[job]];
    if (stage !== expected) {
      setFeedback(`${job}: ${expected ?? 'COMPLETE'} must come next.`);
      return;
    }
    setProgress((current) => ({ ...current, [job]: current[job] + 1 }));
    setFeedback(`${job}: ${stage} recorded safely.`);
  };

  return (
    <div className="challenge challenge--agents">
      <p>Route all three autonomous jobs through the safe operating loop.</p>
      <div className="agent-jobs">
        {jobs.map((job) => (
          <div className="agent-job" key={job}>
            <span><Bot /> {job}</span>
            <div>
              {AGENT_STAGES.map((stage, index) => (
                <button
                  type="button"
                  key={stage}
                  className={progress[job] > index ? 'is-selected' : ''}
                  onClick={() => advance(job, stage)}
                  disabled={progress[job] > index}
                >
                  {progress[job] > index ? <Check /> : null}{stage}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ChallengeResult
        complete={complete}
        feedback={complete ? 'All jobs completed with verified outcomes.' : feedback}
        onRestore={() => onRestore({
          routes: {
            'energy-audit': ['plan', 'act', 'verify'],
            'seed-order': ['plan', 'act', 'verify'],
            'helper-deploy': ['plan', 'act', 'verify'],
          },
        })}
      />
    </div>
  );
}

function DevToolsChallenge({ onRestore }: { onRestore: (answer: unknown) => void }) {
  const nodes = ['SOURCE', 'INSPECT', 'COMPOSE', 'TEST', 'SHIP'] as const;
  const [active, setActive] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('Start at the local source node.');
  const complete = active.length === nodes.length;

  const select = (node: string) => {
    if (node !== nodes[active.length]) {
      setActive([]);
      setFeedback('Dependency order broken. Pipeline reset to local source.');
      return;
    }
    setActive((current) => [...current, node]);
    setFeedback(node === 'SHIP' ? 'Release artifact is reproducible and ready.' : `${node} connected.`);
  };

  return (
    <div className="challenge challenge--pipeline">
      <p>Repair the local-first delivery pipeline. Activate each node from source to release.</p>
      <div className="pipeline-nodes">
        {['COMPOSE', 'SOURCE', 'SHIP', 'INSPECT', 'TEST'].map((node) => {
          const nodeIndex = nodes.indexOf(node as (typeof nodes)[number]);
          const isActive = active.includes(node);
          return (
            <button
              type="button"
              key={node}
              className={isActive ? 'is-selected' : ''}
              onClick={() => select(node)}
              style={{ '--node-order': nodeIndex } as CSSProperties}
            >
              {isActive ? <CheckCircle2 /> : <Cpu />}
              <span>{node}</span>
              <small>0{nodeIndex + 1}</small>
            </button>
          );
        })}
      </div>
      <ChallengeResult
        complete={complete}
        feedback={complete ? 'Pipeline integrity confirmed.' : feedback}
        onRestore={() => onRestore({
          activated: ['source', 'inspect', 'compose', 'test', 'ship'],
          testsPassed: true,
        })}
      />
    </div>
  );
}

function ProjectDialog({
  projectId,
  restored,
  nearby,
  unlocked,
  onClose,
  onRestore,
}: {
  projectId: ProjectId;
  restored: boolean;
  nearby: boolean;
  unlocked: boolean;
  onClose: () => void;
  onRestore: (id: ProjectId, answer: unknown) => void;
}) {
  const project = PROJECTS.find((item) => item.id === projectId) ?? PROJECTS[0];
  const Icon = project.icon;
  const caseStudyPath = getGardenCaseStudyPath(project.id);
  const restore = (answer: unknown) => onRestore(project.id, answer);
  return (
    <DialogFrame
      title={project.title}
      eyebrow={project.eyebrow}
      onClose={onClose}
      className="project-dialog"
      testId="project-dialog"
    >
      <div className="project-dialog__intro" style={{ '--project-accent': project.accent } as CSSProperties}>
        <div className="project-dialog__icon"><Icon aria-hidden="true" /></div>
        <div>
          <span>{restored ? 'SYSTEM ONLINE' : 'DORMANT SYSTEM DETECTED'}</span>
          <p>{project.objective}</p>
        </div>
      </div>
      {caseStudyPath && (
        <a className="project-dialog__case-link" href={caseStudyPath}>
          <BookOpen aria-hidden="true" /> READ FULL CASE STUDY
        </a>
      )}
      {restored ? (
        <div className="restored-review">
          <CheckCircle2 aria-hidden="true" />
          <h3>This system is thriving.</h3>
          <p>The restored workflow remains available in the field log for review.</p>
          <button className="pixel-button pixel-button--primary" type="button" onClick={onClose}>RETURN TO GARDEN</button>
        </div>
      ) : !unlocked ? (
        <div className="restored-review">
          <Info aria-hidden="true" />
          <h3>This beacon is still dormant.</h3>
          <p>Restore the preceding system first. Its signal will wake this project station.</p>
          <button className="pixel-button pixel-button--primary" type="button" onClick={onClose}>RETURN TO GARDEN</button>
        </div>
      ) : !nearby ? (
        <div className="restored-review">
          <CircleGauge aria-hidden="true" />
          <h3>Locate this beacon in the garden.</h3>
          <p>Project details stay readable here, but restoration begins only when the gardener reaches the glowing station.</p>
          <button className="pixel-button pixel-button--primary" type="button" onClick={onClose}>LOCATE IN GARDEN</button>
        </div>
      ) : project.id === 'wattch' ? (
        <WattchChallenge onRestore={restore} />
      ) : project.id === 'whispbook' ? (
        <WhispbookChallenge onRestore={restore} />
      ) : project.id === 'agent-commerce' ? (
        <AgentCommerceChallenge onRestore={restore} />
      ) : (
        <DevToolsChallenge onRestore={restore} />
      )}
    </DialogFrame>
  );
}

function SettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: {
    sound: boolean;
    volume: number;
    reducedMotion: boolean;
    highContrast: boolean;
    quality: 'low' | 'high';
    robotColorSeed: number;
  };
  onChange: (partial: Partial<typeof settings>) => void;
  onClose: () => void;
}) {
  return (
    <DialogFrame title="SETTINGS" eyebrow="GARDEN CALIBRATION" onClose={onClose} className="settings-dialog">
      <div className="settings-list">
        <label className="setting-row">
          <span>{settings.sound ? <Volume2 /> : <VolumeX />}<b>SOUND</b><small>Local synthesized ambience and cues</small></span>
          <input type="checkbox" checked={settings.sound} onChange={(event) => onChange({ sound: event.target.checked })} />
        </label>
        <label className="setting-row setting-row--range">
          <span><Activity /><b>VOLUME</b><small>{Math.round(settings.volume * 100)}%</small></span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(settings.volume * 100)}
            disabled={!settings.sound}
            onChange={(event) => onChange({ volume: Number(event.target.value) / 100 })}
          />
        </label>
        <label className="setting-row">
          <span><Wind /><b>REDUCED MOTION</b><small>Disable decorative motion and camera easing</small></span>
          <input type="checkbox" checked={settings.reducedMotion} onChange={(event) => onChange({ reducedMotion: event.target.checked })} />
        </label>
        <label className="setting-row">
          <span><ShieldCheck /><b>HIGH CONTRAST</b><small>Strengthen silhouettes and control outlines</small></span>
          <input type="checkbox" checked={settings.highContrast} onChange={(event) => onChange({ highContrast: event.target.checked })} />
        </label>
        <fieldset className="quality-setting">
          <legend><SlidersHorizontal /> WORLD QUALITY</legend>
          <label><input type="radio" name="quality" checked={settings.quality === 'low'} onChange={() => onChange({ quality: 'low' })} /> LOW</label>
          <label><input type="radio" name="quality" checked={settings.quality === 'high'} onChange={() => onChange({ quality: 'high' })} /> HIGH</label>
        </fieldset>
        <div className="robot-randomizer">
          <span>
            <Palette />
            <b>ROBOT COLORS</b>
            <small>Palette set {String(settings.robotColorSeed % 10_000).padStart(4, '0')}</small>
          </span>
          <button
            type="button"
            onClick={() => onChange({
              robotColorSeed: createRobotColorSeed(
                settings.robotColorSeed,
                Date.now() ^ Math.floor(performance.now() * 1000),
              ),
            })}
          >
            <Shuffle /> RANDOMIZE
          </button>
        </div>
      </div>
      <button className="pixel-button pixel-button--primary dialog-done" type="button" onClick={onClose}>DONE</button>
    </DialogFrame>
  );
}

function ResetConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <DialogFrame title="RESET PROGRESS?" eyebrow="IRREVERSIBLE ACTION" onClose={onCancel} className="confirm-dialog">
      <div className="confirm-warning"><RotateCcw /><p>This clears restored systems and player position. Accessibility and audio settings are preserved.</p></div>
      <div className="confirm-actions">
        <button className="pixel-button" type="button" onClick={onCancel}>KEEP GARDEN</button>
        <button className="pixel-button pixel-button--danger" type="button" onClick={onConfirm}>RESET PROGRESS</button>
      </div>
    </DialogFrame>
  );
}

function PauseMenu({
  restoredCount,
  onResume,
  onSettings,
  onFieldLog,
  onReset,
}: {
  restoredCount: number;
  onResume: () => void;
  onSettings: () => void;
  onFieldLog: () => void;
  onReset: () => void;
}) {
  return (
    <DialogFrame title="GARDEN PAUSED" eyebrow={`${restoredCount}/4 SYSTEMS RESTORED`} className="pause-dialog" testId="pause-menu">
      <div className="pause-emblem" aria-hidden="true"><Sprout /><span /><Bot /></div>
      <div className="pause-actions">
        <button className="pixel-button pixel-button--primary" type="button" onClick={onResume}><Play /> RESUME GARDEN</button>
        <button className="pixel-button" type="button" onClick={onFieldLog} aria-label="Field log"><BookOpen /> FIELD LOG</button>
        <button className="pixel-button" type="button" onClick={onSettings} aria-label="Settings"><Settings /> SETTINGS</button>
        <a className="pixel-button" href="/" aria-label="Portfolio"><ArrowLeft /> PORTFOLIO</a>
        <button className="icon-text-button danger-link" type="button" onClick={onReset}><RotateCcw /> RESET PROGRESS</button>
      </div>
      <p className="pause-hint"><kbd>ESC</kbd> RESUME</p>
    </DialogFrame>
  );
}

function FieldLog({ restoredIds, onClose, onOpenProject }: { restoredIds: string[]; onClose: () => void; onOpenProject: (id: ProjectId) => void }) {
  return (
    <DialogFrame title="FIELD LOG" eyebrow="SYSTEM RESTORATION RECORD" onClose={onClose} className="field-log-dialog">
      <div className="field-log-summary">
        <BarChart3 aria-hidden="true" />
        <div><strong>{restoredIds.length} / 4</strong><span>SYSTEMS ONLINE</span></div>
        <div className="field-log-bar"><span style={{ width: `${restoredIds.length * 25}%` }} /></div>
      </div>
      <ol className="field-log-list">
        {PROJECTS.map((project, index) => {
          const restored = restoredIds.includes(project.id);
          const Icon = project.icon;
          return (
            <li key={project.id} className={restored ? 'is-restored' : ''}>
              <span>0{index + 1}</span>
              <Icon aria-hidden="true" />
              <div><b>{project.title}</b><small>{project.eyebrow}</small></div>
              <button type="button" onClick={() => onOpenProject(project.id)}>
                {restored ? 'REVIEW' : 'LOCATE'} <ChevronRight />
              </button>
            </li>
          );
        })}
      </ol>
    </DialogFrame>
  );
}

function CompletionScreen({ onContinue, onReset }: { onContinue: () => void; onReset: () => void }) {
  return (
    <main className="cinematic-screen completion-screen" data-testid="completion-screen">
      <div className="cinematic-art" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <section className="ending-console metal-panel" aria-labelledby="ending-title">
        <div className="ending-icon" aria-hidden="true"><Sparkles /><Sprout /></div>
        <span>ALL FOUR SYSTEMS ONLINE</span>
        <h1 id="ending-title">THE GARDEN REMEMBERS.</h1>
        <p>
          You measured before optimizing, understood before building, and returned useful energy to
          every corner of the island.
        </p>
        <div className="ending-systems">
          {PROJECTS.map((project) => {
            const Icon = project.icon;
            return <span key={project.id}><Icon />{project.title}</span>;
          })}
        </div>
        <div className="ending-actions">
          <button className="pixel-button pixel-button--primary" type="button" onClick={onContinue} autoFocus><Sprout /> WALK THE RESTORED GARDEN</button>
          <a className="pixel-button" href="/" aria-label="Portfolio"><ArrowLeft /> PORTFOLIO</a>
          <button className="icon-text-button" type="button" onClick={onReset}><RefreshCcw /> PLAY AGAIN</button>
        </div>
      </section>
      <div className="ending-credit">SYSTEMS GARDEN · BUILT WITH REACT, THREE.JS &amp; CARE</div>
    </main>
  );
}

export function GameUI() {
  const {
    phase,
    viewMode,
    requestedWebsiteSection,
    restoredIds,
    activeSystemId,
    playerPosition,
    settings,
    hasSave,
    notice,
    enterBirdView,
    exitBirdView,
    toggleBirdView,
    requestWebsiteSection,
    consumeWebsiteSection,
    startNewGame,
    continueGame,
    pauseGame,
    resumeGame,
    inspectSystem,
    openSystem,
    closeSystem,
    submitChallenge,
    setInput,
    setSettings,
    resetProgress,
    setNotice,
  } = useGameStore();

  const [drawer, setDrawer] = useState<DrawerId>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showFieldLog, setShowFieldLog] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [resumeAfterOverlay, setResumeAfterOverlay] = useState(false);

  const localOverlayOpen = Boolean(drawer || showSettings || showReset || showFieldLog || showSections);
  const worldInputBlocked = phase !== 'playing' || viewMode === 'bird' || localOverlayOpen;

  const clearMovement = useCallback(() => {
    (['up', 'down', 'left', 'right', 'jump'] as InputAction[]).forEach((input) => setInput(input, false));
  }, [setInput]);

  const closeLocalOverlays = useCallback(() => {
    setDrawer(null);
    setShowSettings(false);
    setShowReset(false);
    setShowFieldLog(false);
    setShowSections(false);
    setResumeAfterOverlay(false);
  }, []);

  const openDrawer = useCallback((nextDrawer: DrawerId) => {
    if (!nextDrawer) return;
    const shouldResume = phase === 'playing';
    setResumeAfterOverlay(shouldResume);
    if (shouldResume) pauseGame();
    setDrawer(nextDrawer);
  }, [pauseGame, phase]);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    if (resumeAfterOverlay) resumeGame();
    setResumeAfterOverlay(false);
  }, [resumeAfterOverlay, resumeGame]);

  const openFieldLog = useCallback(() => {
    const shouldResume = phase === 'playing';
    setResumeAfterOverlay(shouldResume);
    if (shouldResume) pauseGame();
    setShowFieldLog(true);
  }, [pauseGame, phase]);

  const closeFieldLog = useCallback(() => {
    setShowFieldLog(false);
    if (resumeAfterOverlay) resumeGame();
    setResumeAfterOverlay(false);
  }, [resumeAfterOverlay, resumeGame]);

  const runWebsiteAction = useCallback((section: WebsiteSection) => {
    setShowSections(false);
    switch (section.action.kind) {
      case 'open-drawer':
        openDrawer(section.action.drawer);
        return;
      case 'open-project':
        inspectSystem(section.action.projectId);
        return;
      case 'open-field-log':
        openFieldLog();
        return;
      case 'none':
        setNotice(`${section.label} is part of the physical island composition.`);
        return;
    }
  }, [inspectSystem, openDrawer, openFieldLog, setNotice]);

  useEffect(() => {
    if (!requestedWebsiteSection) return;
    const section = WEBSITE_SECTIONS.find(
      (candidate: WebsiteSection) => candidate.id === requestedWebsiteSection,
    );
    consumeWebsiteSection();
    if (!section) {
      setNotice('That website section could not be found on the island.');
      return;
    }
    runWebsiteAction(section);
  }, [consumeWebsiteSection, requestedWebsiteSection, runWebsiteAction, setNotice]);

  useEffect(() => {
    if (viewMode === 'explore') setShowSections(false);
  }, [viewMode]);

  useEffect(() => {
    if (worldInputBlocked) clearMovement();
  }, [clearMovement, worldInputBlocked]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target;
      const textEntry = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable);
      const interactive = textEntry || target instanceof HTMLButtonElement;

      if (event.key === 'Escape' && phase === 'paused' && !localOverlayOpen) {
        event.preventDefault();
        resumeGame();
        return;
      }

      if (event.key === 'Escape' && phase === 'playing' && viewMode === 'bird' && !localOverlayOpen) {
        event.preventDefault();
        exitBirdView();
        return;
      }

      if (
        (event.key === 'b' || event.key === 'B')
        && phase === 'playing'
        && !localOverlayOpen
        && !textEntry
      ) {
        event.preventDefault();
        toggleBirdView();
        return;
      }

      if (interactive) return;

      if ((event.key === 'p' || event.key === 'P') && phase === 'playing' && !localOverlayOpen) {
        event.preventDefault();
        pauseGame();
      }
      if (event.key === 'Tab' && phase === 'playing' && viewMode === 'explore' && !localOverlayOpen) {
        event.preventDefault();
        openFieldLog();
      }
      if ((event.key === 'f' || event.key === 'F') && phase === 'playing' && viewMode === 'explore' && !localOverlayOpen) {
        setNotice('You wave. A helper robot chirps back from the garden.');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [exitBirdView, localOverlayOpen, openFieldLog, pauseGame, phase, resumeGame, setNotice, toggleBirdView, viewMode]);

  const beginNewGame = useCallback(() => {
    closeLocalOverlays();
    startNewGame();
  }, [closeLocalOverlays, startNewGame]);

  const doReset = useCallback(() => {
    closeLocalOverlays();
    resetProgress();
  }, [closeLocalOverlays, resetProgress]);

  const confirmNewGame = useCallback(() => {
    closeLocalOverlays();
    resetProgress();
    startNewGame();
  }, [closeLocalOverlays, resetProgress, startNewGame]);

  const openProject = useCallback((id: ProjectId) => {
    const shouldResume = phase === 'paused' && Boolean(drawer || showFieldLog);
    setDrawer(null);
    setShowFieldLog(false);
    if (shouldResume) resumeGame();
    setResumeAfterOverlay(false);
    inspectSystem(id);
  }, [drawer, inspectSystem, phase, resumeGame, showFieldLog]);

  const nearbyDefinition = getNearestSystem(playerPosition, {
    maxDistance: 4.8,
    restoredIds,
    includeLocked: true,
    includeRestored: true,
  });

  const interact = useCallback(() => {
    if (nearbyDefinition) {
      openSystem(nearbyDefinition.id);
      return;
    }
    setNotice(
      restoredIds.length === PROJECTS.length
        ? 'Every system is online. The restored garden is ready to explore.'
        : 'Follow the compass and the active sky-beam to the next outpost.',
    );
  }, [nearbyDefinition, openSystem, restoredIds.length, setNotice]);

  const activeDefinition = getSystemById(activeSystemId);
  const activeNearby = activeDefinition
    ? Math.hypot(
        playerPosition.x - activeDefinition.position.x,
        playerPosition.z - activeDefinition.position.z,
      ) <= activeDefinition.interactionRadius + 0.5
    : false;
  const activeUnlocked = activeDefinition
    ? isSystemUnlocked(activeDefinition.id, restoredIds)
    : false;

  const rootClass = useMemo(
    () => [
      'game-ui',
      settings.highContrast ? 'is-high-contrast' : '',
      settings.reducedMotion ? 'is-reduced-motion' : '',
      viewMode === 'bird' ? 'is-bird-view' : '',
      worldInputBlocked ? 'is-input-blocked' : '',
    ].filter(Boolean).join(' '),
    [settings.highContrast, settings.reducedMotion, viewMode, worldInputBlocked],
  );

  if (phase === 'title') {
    return (
      <div className={rootClass} data-testid="game-ui" data-world-input={worldInputBlocked ? 'blocked' : 'enabled'}>
        {!showReset && (
          <TitleScreen
            hasSave={hasSave}
            onNew={hasSave ? () => setShowReset(true) : beginNewGame}
            onContinue={continueGame}
            onSettings={() => setShowSettings(true)}
          />
        )}
        {showSettings && <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
        {showReset && <ResetConfirm onConfirm={confirmNewGame} onCancel={() => setShowReset(false)} />}
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className={rootClass} data-testid="game-ui" data-world-input="blocked">
        <CompletionScreen onContinue={resumeGame} onReset={() => setShowReset(true)} />
        {showReset && <ResetConfirm onConfirm={confirmNewGame} onCancel={() => setShowReset(false)} />}
      </div>
    );
  }

  return (
    <div
      className={rootClass}
      data-testid="game-ui"
      data-view-mode={viewMode}
      data-world-input={worldInputBlocked ? 'blocked' : 'enabled'}
    >
      <div className="view-mode-announcement" role="status" aria-live="polite" aria-atomic="true">
        {viewMode === 'bird'
          ? "Bird's-eye website view active. Choose an island section or return to the garden."
          : 'Garden exploration view active.'}
      </div>
      {phase === 'playing' && viewMode === 'explore' && (
        <>
          <ProgressHUD
            restoredIds={restoredIds}
            playerPosition={playerPosition}
            onPause={pauseGame}
            onOpenLog={openFieldLog}
            onOpenProjects={() => openDrawer('projects')}
            onOpenMenu={() => openDrawer('profile')}
            onToggleOverview={enterBirdView}
          />
          <InteractionPrompt notice={notice} nearbyTitle={nearbyDefinition?.name.toUpperCase()} />
          <MobileHud
            restoredIds={restoredIds}
            onDrawer={openDrawer}
            onOpenLog={openFieldLog}
            onPause={pauseGame}
            onToggleOverview={enterBirdView}
          />
          {!localOverlayOpen && (
            <TouchControls
              setInput={setInput}
              onInteract={interact}
              onWave={() => setNotice('You wave. A helper robot chirps back from the garden.')}
            />
          )}
        </>
      )}

      {phase === 'playing' && viewMode === 'bird' && (
        <BirdViewHUD
          sectionsOpen={showSections}
          onOpenSections={() => setShowSections(true)}
          onPause={pauseGame}
          onReturn={exitBirdView}
        />
      )}

      {phase === 'project' && activeSystemId && (
        <ProjectDialog
          key={activeSystemId}
          projectId={activeSystemId as ProjectId}
          restored={restoredIds.includes(activeSystemId)}
          nearby={viewMode === 'bird' || activeNearby}
          unlocked={activeUnlocked}
          onClose={closeSystem}
          onRestore={submitChallenge}
        />
      )}
      {phase === 'paused' && !drawer && !showSettings && !showReset && !showFieldLog && (
        <PauseMenu
          restoredCount={restoredIds.length}
          onResume={resumeGame}
          onSettings={() => setShowSettings(true)}
          onFieldLog={() => {
            setResumeAfterOverlay(false);
            setShowFieldLog(true);
          }}
          onReset={() => setShowReset(true)}
        />
      )}
      {drawer && (
        <Drawer
          drawer={drawer}
          restoredIds={restoredIds}
          onClose={closeDrawer}
          onOpenProject={openProject}
          onSetDrawer={setDrawer}
        />
      )}
      {showFieldLog && <FieldLog restoredIds={restoredIds} onClose={closeFieldLog} onOpenProject={openProject} />}
      {showSections && viewMode === 'bird' && (
        <BirdSectionsMenu
          onClose={() => setShowSections(false)}
          onSelect={requestWebsiteSection}
        />
      )}
      {showSettings && <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
      {showReset && <ResetConfirm onConfirm={doReset} onCancel={() => setShowReset(false)} />}
    </div>
  );
}

export default GameUI;
