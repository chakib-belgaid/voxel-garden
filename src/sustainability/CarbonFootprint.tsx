import { useEffect, useId, useState } from "react";
import { ChevronUp, Leaf } from "lucide-react";
import {
  formatCarbon,
  formatCarbonAscii,
  formatEnergy,
  formatTransferSize
} from "./footprint";
import {
  ExperienceModeSwitch,
  type ExperienceMode
} from "./ExperienceModeSwitch";
import { usePageFootprint } from "./usePageFootprint";
import "./carbon-footprint.css";

type CarbonFootprintLocale = "en" | "fr";

const copy = {
  en: {
    compactLabel: "Visit footprint",
    measuring: "Measuring…",
    title: "Estimated visit footprint",
    carbon: "Carbon",
    energy: "Modelled energy",
    transfer: "Data transferred",
    method: "CO2.js · SWDM v4",
    note: "Estimate based on bytes reported by this browser, not hardware telemetry. Cached and cross-origin resources may be under-reported.",
    link: "Read the methodology",
    expand: "Show this visit's energy and carbon estimate",
    collapse: "Hide this visit's energy and carbon estimate",
    mode: "Experience mode"
  },
  fr: {
    compactLabel: "Empreinte de la visite",
    measuring: "Mesure…",
    title: "Empreinte estimée de la visite",
    carbon: "Carbone",
    energy: "Énergie modélisée",
    transfer: "Données transférées",
    method: "CO2.js · SWDM v4",
    note: "Estimation fondée sur les octets rapportés par ce navigateur, et non sur une télémétrie matérielle. Le cache et les ressources externes peuvent être sous-comptés.",
    link: "Lire la méthodologie",
    expand: "Afficher l’estimation énergétique et carbone de cette visite",
    collapse: "Masquer l’estimation énergétique et carbone de cette visite",
    mode: "Mode d’expérience"
  }
} as const;

export function CarbonFootprint({
  locale = "en",
  mode = "live"
}: {
  readonly locale?: CarbonFootprintLocale;
  readonly mode?: ExperienceMode;
}) {
  const [expanded, setExpanded] = useState(false);
  const footprint = usePageFootprint();
  const panelId = useId();
  const labels = copy[locale];

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const asciiMode = mode === "ascii";
  const carbonValue = footprint
    ? asciiMode
      ? formatCarbonAscii(footprint.co2Grams)
      : formatCarbon(footprint.co2Grams)
    : asciiMode
      ? "MEASURING..."
      : labels.measuring;

  return (
    <aside
      className="carbon-footprint-meter"
      data-expanded={expanded ? "true" : "false"}
      data-mode={mode}
    >
      {expanded ? (
        <section className="carbon-footprint-panel" id={panelId} aria-labelledby={`${panelId}-title`}>
          <div className="carbon-footprint-panel__heading">
            {asciiMode ? (
              <span className="carbon-footprint-panel__ascii-mark" aria-hidden="true">+</span>
            ) : (
              <Leaf aria-hidden="true" />
            )}
            <div>
              <span>{labels.method}</span>
              <h2 id={`${panelId}-title`}>{labels.title}</h2>
            </div>
          </div>
          <dl className="carbon-footprint-stats">
            <div>
              <dt>{labels.carbon}</dt>
              <dd>{carbonValue}</dd>
            </div>
            <div>
              <dt>{labels.energy}</dt>
              <dd>{footprint ? formatEnergy(footprint.energyKwh) : asciiMode ? "-" : "—"}</dd>
            </div>
            <div>
              <dt>{labels.transfer}</dt>
              <dd>{footprint ? formatTransferSize(footprint.bytes) : asciiMode ? "-" : "—"}</dd>
            </div>
          </dl>
          <p>{labels.note}</p>
          <a
            href="https://developers.thegreenwebfoundation.org/co2js/models/overview/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {labels.link}
          </a>
        </section>
      ) : null}
      <div className="carbon-footprint-controls">
        <ExperienceModeSwitch
          activeMode={mode}
          ariaLabel={labels.mode}
          liveHref={locale === "fr" ? "/fr" : "/"}
          variant={asciiMode ? "ascii" : "default"}
        />
        <button
          className="carbon-footprint-toggle"
          type="button"
          aria-controls={panelId}
          aria-expanded={expanded}
          aria-label={expanded ? labels.collapse : labels.expand}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="carbon-footprint-toggle__signal" aria-hidden="true" />
          <span>
            <small>{labels.compactLabel}</small>
            <strong aria-live="polite">{carbonValue}</strong>
          </span>
          {asciiMode ? (
            <span className="carbon-footprint-toggle__ascii-chevron" aria-hidden="true">^</span>
          ) : (
            <ChevronUp aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}
