import { useEffect, useMemo, useState } from "react";
import { portfolioContacts } from "../content/contacts";
import {
  formatCarbonAscii,
  formatEnergy,
  formatTransferSize
} from "../sustainability/footprint";
import { usePageFootprint } from "../sustainability/usePageFootprint";
import { CarbonFootprint } from "../sustainability/CarbonFootprint";
import "./ascii-garden.css";

const FRAME_COUNT = 4;

const projects = [
  {
    index: "01",
    name: "WATTCH",
    command: "$ wattch profile --live",
    description: "Energy profiling for AI workloads. Measure, analyze, then optimize.",
    href: "/work/wattch",
    linkLabel: "OPEN CASE STUDY",
    preview: [
      "watts",
      " 90 |      /\\",
      " 70 |  /\\_/  \\__",
      " 50 |_/          \\_",
      "    +------------- time",
    ].join("\n"),
  },
  {
    index: "02",
    name: "WHISPBOOK",
    command: "$ whispbook voice --local",
    description: "A local-first voice system for turning spoken ideas into structured books.",
    href: "/work/whispbook",
    linkLabel: "OPEN CASE STUDY",
    preview: [
      "voice",
      "     .  .     .",
      "  .  |..| . .| .",
      "..|..||||.|.|||..",
      "--+-------------> text",
    ].join("\n"),
  },
  {
    index: "03",
    name: "AGENT COMMERCE",
    command: "$ agent loop --verify",
    description: "Agentic commerce research built around observable, reversible workflows.",
    href: "#contact",
    linkLabel: "DISCUSS THE WORK",
    preview: [
      "+------+     +-----+",
      "| PLAN | --> | ACT |",
      "+---+--+     +--+--+",
      "    ^           |",
      "    +-- VERIFY <-+",
    ].join("\n"),
  },
  {
    index: "04",
    name: "DEV TOOLS",
    command: "$ tools ship --small",
    description: "CLIs and local tools that shorten the path from inspection to delivery.",
    href: portfolioContacts.github,
    linkLabel: "VIEW GITHUB",
    external: true,
    preview: [
      "+------------------+",
      "| $ inspect source |",
      "| $ compose change |",
      "| $ verify && ship |",
      "+------------------+",
    ].join("\n"),
  },
] as const;

function buildEnergyFrame(frame: number): string {
  const solarPackets = ["o---->", "-o--->", "--o-->", "---o->"];
  const windPackets = ["<----o", "<---o-", "<--o--", "<-o---"];
  const rotors = ["\\|/", "-O-", "/|\\", "-O-"];
  const battery = ["[########-.]", "[#########.]", "[########-.]", "[#######-..]"];

  return [
    "          \\  |  /                         WIND",
    "        --  SUN  --                        " + rotors[frame],
    "          /  |  \\                          |",
    "             |                              v",
    "       +-----v-----+                  +-----+-----+",
    "       |   SOLAR   |                  |  TURBINE  |",
    "       |   ARRAY   |                  |  24 RPM   |",
    "       +-----+-----+                  +-----+-----+",
    "             |                              |",
    "             +--" + solarPackets[frame] + " GRID " + windPackets[frame] + "--+",
    "                            |",
    "                     +------v------+",
    "                     | BATTERY 87% |",
    "                     | " + battery[frame] + " |",
    "                     +-------------+",
    "                            |",
    "                 +----------+----------+",
    "                 |                     |",
    "          +------v------+       +------v------+",
    "          | AI SYSTEMS |       | GARDEN LAB  |",
    "          |  MEASURE   |       |  CULTIVATE  |",
    "          +-------------+       +-------------+",
  ].join("\n");
}

function useAsciiAnimation() {
  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const followPreference = () => {
      if (media.matches) setRunning(false);
    };
    followPreference();
    media.addEventListener?.("change", followPreference);
    return () => media.removeEventListener?.("change", followPreference);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % FRAME_COUNT);
    }, 500);
    return () => window.clearInterval(timer);
  }, [running]);

  return { frame, running, setRunning };
}

function AsciiRule({ label }: { readonly label: string }) {
  return (
    <div className="ascii-rule" aria-hidden="true">
      <span>+--------------------</span>
      <b>{label}</b>
      <span>--------------------+</span>
    </div>
  );
}

function EnergyDiagram() {
  const { frame, running, setRunning } = useAsciiAnimation();
  const footprint = usePageFootprint();
  const diagram = useMemo(() => buildEnergyFrame(frame), [frame]);

  return (
    <section className="ascii-energy" aria-labelledby="energy-title">
      <div className="ascii-window-bar">
        <span id="energy-title">renewable-energy-router.sh</span>
        <span>{running ? "LIVE / 2 FPS" : "PAUSED / 0 FPS"}</span>
      </div>
      <p className="ascii-sr-only">
        Animated text diagram routing solar and wind power through a grid and battery to AI systems
        and a garden lab.
      </p>
      <pre className="ascii-energy__art" data-ascii-art="energy" aria-hidden="true">{diagram}</pre>
      <div className="ascii-energy__status">
        <dl>
          <div>
            <dt>RENDERER</dt>
            <dd>DOM TEXT / NO WEBGL</dd>
          </div>
          <div>
            <dt>PAGE TRANSFER</dt>
            <dd data-testid="ascii-transfer">
              {footprint ? formatTransferSize(footprint.bytes) : "MEASURING..."}
            </dd>
          </div>
          <div>
            <dt>EST. TRANSFER ENERGY</dt>
            <dd>{footprint ? formatEnergy(footprint.energyKwh) : "MEASURING..."}</dd>
          </div>
          <div>
            <dt>EST. CARBON FOOTPRINT</dt>
            <dd data-testid="ascii-carbon">
              {footprint ? formatCarbonAscii(footprint.co2Grams) : "MEASURING..."}
            </dd>
          </div>
        </dl>
        <button
          className="ascii-button ascii-button--compact"
          type="button"
          aria-pressed={!running}
          onClick={() => setRunning((current) => !current)}
        >
          [ {running ? "PAUSE FLOW" : "START FLOW"} ]
        </button>
      </div>
      <p className="ascii-energy__note">
        * Transfer footprint uses browser-reported bytes, CO2.js and SWDM v4. It is not hardware telemetry.
      </p>
    </section>
  );
}

function Header() {
  return (
    <header className="ascii-header">
      <div className="ascii-shell ascii-header__inner">
        <a className="ascii-brand" href="#home" aria-label="Chakib Belgaid, back to top">
          <strong>CHAKIB BELGAID</strong>
          <span>AI SYSTEMS GARDENER</span>
        </a>
        <nav className="ascii-nav" aria-label="ASCII garden sections">
          <a href="#home">[HOME]</a>
          <a href="#systems">[SYSTEMS]</a>
          <a href="#method">[METHOD]</a>
          <a href="#contact">[CONTACT]</a>
        </nav>
        <span className="ascii-mode">ASCII MODE / 0 IMG / 0 CANVAS</span>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="ascii-hero ascii-shell" id="home" aria-labelledby="ascii-hero-title">
      <div className="ascii-hero__copy">
        <p className="ascii-command">$ ./grow-systems --energy-aware</p>
        <h1
          id="ascii-hero-title"
          aria-label="I grow systems that think, measure, and save energy."
        >
          <span aria-hidden="true">I GROW SYSTEMS</span>
          <span className="ascii-hero__accent" aria-hidden="true">THAT THINK,</span>
          <span className="ascii-hero__accent" aria-hidden="true">MEASURE</span>
          <span aria-hidden="true">AND SAVE ENERGY.</span>
        </h1>
        <p className="ascii-hero__intro">
          I build AI systems, developer tools and infrastructure that are intelligent, efficient
          and useful in the real world.
        </p>
        <ul className="ascii-feature-list">
          <li><span>[01]</span> AI AGENTS + AUTOMATION</li>
          <li><span>[02]</span> DEVELOPER TOOLS</li>
          <li><span>[03]</span> ENERGY-AWARE SYSTEMS</li>
          <li><span>[04]</span> RESEARCH + PROTOTYPING</li>
        </ul>
        <blockquote>
          &gt; Measure before you optimize.
          <br />
          &gt; Understand before you build.
        </blockquote>
        <div className="ascii-actions">
          <a className="ascii-button ascii-button--primary" href="#systems">[ VIEW SYSTEMS ]</a>
          <a className="ascii-button" href="/garden">[ OPEN 3D GARDEN ]</a>
        </div>
      </div>
      <EnergyDiagram />
    </section>
  );
}

function Systems() {
  return (
    <section className="ascii-section ascii-shell" id="systems" aria-labelledby="systems-title">
      <AsciiRule label="01 / SELECTED SYSTEMS" />
      <div className="ascii-section__heading">
        <h2 id="systems-title">USEFUL SOFTWARE, MEASURED IN THE REAL WORLD.</h2>
        <p>Four systems. One operating principle: observe the cost before changing the code.</p>
      </div>
      <div className="ascii-projects">
        {projects.map((project) => (
          <article className="ascii-project" key={project.name}>
            <span className="ascii-project__index">[{project.index}]</span>
            <div className="ascii-project__copy">
              <p>{project.command}</p>
              <h3>{project.name}</h3>
              <span>{project.description}</span>
            </div>
            <pre data-ascii-art={`project-${project.index}`} aria-hidden="true">{project.preview}</pre>
            <a
              href={project.href}
              target={"external" in project && project.external ? "_blank" : undefined}
              rel={"external" in project && project.external ? "noopener noreferrer" : undefined}
            >
              [ {project.linkLabel} ]
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function Method() {
  const loop = [
    "+-----------+      +-----------+",
    "|  MEASURE  | ---> |   LEARN   |",
    "+-----+-----+      +-----+-----+",
    "      ^                  |",
    "      |                  v",
    "+-----+------------------+-----+",
    "|          IMPROVE             |",
    "+------------------------------+",
  ].join("\n");

  return (
    <section className="ascii-section ascii-section--method ascii-shell" id="method" aria-labelledby="method-title">
      <AsciiRule label="02 / METHOD" />
      <div className="ascii-method__lead">
        <div>
          <h2 id="method-title">MEASURE BEFORE YOU OPTIMIZE.</h2>
          <p>
            Green software starts with evidence. Instrument the system, find the expensive path,
            then improve only what matters.
          </p>
        </div>
        <pre data-ascii-art="method" aria-hidden="true">{loop}</pre>
      </div>
      <ol className="ascii-steps">
        <li>
          <span>01</span>
          <h3>MEASURE</h3>
          <p>Capture energy, latency and transfer cost at the boundary where work happens.</p>
        </li>
        <li>
          <span>02</span>
          <h3>LEARN</h3>
          <p>Compare traces, remove assumptions and make the actual bottleneck visible.</p>
        </li>
        <li>
          <span>03</span>
          <h3>IMPROVE</h3>
          <p>Ship the smallest effective change, verify the result and keep the evidence.</p>
        </li>
      </ol>
    </section>
  );
}

function Contact() {
  return (
    <section className="ascii-contact" id="contact" aria-labelledby="contact-title">
      <div className="ascii-shell">
        <AsciiRule label="03 / CONTACT" />
        <p className="ascii-command">$ ./start-conversation --useful --measurable</p>
        <h2 id="contact-title">READY TO BUILD A LOWER-IMPACT SYSTEM?</h2>
        <p>For product engineering, applied AI or energy-aware developer tooling, write directly.</p>
        <div className="ascii-contact__links">
          <a href={portfolioContacts.email}>[ EMAIL ]</a>
          <a href={portfolioContacts.github} target="_blank" rel="noopener noreferrer">[ GITHUB ]</a>
          <a href={portfolioContacts.linkedin} target="_blank" rel="noopener noreferrer">[ LINKEDIN ]</a>
          <a href="/">[ STANDARD SITE ]</a>
        </div>
      </div>
    </section>
  );
}

export function AsciiGardenApp() {
  return (
    <div className="ascii-site">
      <a className="ascii-skip-link" href="#main-content">Skip to content</a>
      <Header />
      <main id="main-content">
        <Hero />
        <Systems />
        <Method />
        <Contact />
      </main>
      <footer className="ascii-footer">
        <div className="ascii-shell">
          <span>(c) 2026 CHAKIB BELGAID</span>
          <span>BUILT WITH TEXT, REACT, AND MEASURED BYTES.</span>
          <a href="#home">[ BACK TO TOP ]</a>
        </div>
      </footer>
      <CarbonFootprint locale="en" mode="ascii" />
    </div>
  );
}

export default AsciiGardenApp;
