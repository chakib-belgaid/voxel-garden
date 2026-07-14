import { useEffect, useId, useState } from "react";
import { ChevronUp, Leaf } from "lucide-react";
import { formatCarbon, formatEnergy, formatTransferSize } from "./footprint";
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
    collapse: "Hide this visit's energy and carbon estimate"
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
    collapse: "Masquer l’estimation énergétique et carbone de cette visite"
  }
} as const;

export function CarbonFootprint({ locale = "en" }: { readonly locale?: CarbonFootprintLocale }) {
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

  const carbonValue = footprint ? formatCarbon(footprint.co2Grams) : labels.measuring;

  return (
    <aside className="carbon-footprint-meter" data-expanded={expanded ? "true" : "false"}>
      {expanded ? (
        <section className="carbon-footprint-panel" id={panelId} aria-labelledby={`${panelId}-title`}>
          <div className="carbon-footprint-panel__heading">
            <Leaf aria-hidden="true" />
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
              <dd>{footprint ? formatEnergy(footprint.energyKwh) : "—"}</dd>
            </div>
            <div>
              <dt>{labels.transfer}</dt>
              <dd>{footprint ? formatTransferSize(footprint.bytes) : "—"}</dd>
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
        <ChevronUp aria-hidden="true" />
      </button>
    </aside>
  );
}
