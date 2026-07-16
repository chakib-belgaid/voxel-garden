import { useEffect, useId, useState } from "react";
import { ChevronUp, Leaf } from "lucide-react";
import {
  formatCarbon,
  formatCarbonAscii,
  formatEnergy,
  formatTransferSize
} from "./footprint";
import {
  EXPERIENCE_MODES,
  ExperienceModeSwitch,
  type ExperienceMode
} from "./ExperienceModeSwitch";
import { usePageFootprint } from "./usePageFootprint";
import "./carbon-footprint.css";

type CarbonFootprintLocale = "en" | "fr";

const copy = {
  en: {
    compactLabel: "modelled energy",
    measuring: "Measuring…",
    title: "Energy by experience",
    carbon: "Carbon",
    energy: "Modelled energy",
    transfer: "Data transferred",
    method: "CO2.js · SWDM v4",
    comparison: "This session by mode",
    notMeasured: "Not measured",
    note: "Each route keeps its own transferred-data total for this browser session. These are modelled estimates, not hardware telemetry; cached and cross-origin resources may be under-reported.",
    link: "Read the methodology",
    expand: "Compare energy across the three experience modes",
    collapse: "Hide the energy comparison",
    mode: "Experience mode",
    modeNames: { ascii: "ASCII", live: "LIVE", game: "GAME" }
  },
  fr: {
    compactLabel: "énergie modélisée",
    measuring: "Mesure…",
    title: "Énergie par expérience",
    carbon: "Carbone",
    energy: "Énergie modélisée",
    transfer: "Données transférées",
    method: "CO2.js · SWDM v4",
    comparison: "Cette session par mode",
    notMeasured: "Non mesuré",
    note: "Chaque route conserve son propre total de données transférées pour cette session. Il s’agit d’estimations modélisées, et non de télémétrie matérielle ; le cache et les ressources externes peuvent être sous-comptés.",
    link: "Lire la méthodologie",
    expand: "Comparer l’énergie des trois modes d’expérience",
    collapse: "Masquer la comparaison énergétique",
    mode: "Mode d’expérience",
    modeNames: { ascii: "ASCII", live: "LIVE", game: "GAME" }
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
  const { current: footprint, byMode } = usePageFootprint(mode);
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
  const energyValue = footprint
    ? formatEnergy(footprint.energyKwh)
    : asciiMode
      ? "MEASURING..."
      : labels.measuring;
  const energyByMode = Object.fromEntries(
    EXPERIENCE_MODES.flatMap(({ id }) => {
      const modeFootprint = byMode[id];
      return modeFootprint ? [[id, formatEnergy(modeFootprint.energyKwh)]] : [];
    })
  );
  const maximumModeEnergy = Math.max(
    ...EXPERIENCE_MODES.map(({ id }) => byMode[id]?.energyKwh ?? 0),
    0
  );

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
          <section className="mode-energy-comparison" aria-labelledby={`${panelId}-comparison`}>
            <h3 id={`${panelId}-comparison`}>{labels.comparison}</h3>
            <ul>
              {EXPERIENCE_MODES.map(({ id, href }) => {
                const modeFootprint = byMode[id];
                return (
                  <li data-active={id === mode ? "true" : "false"} key={id}>
                    <span>
                      <b>{labels.modeNames[id]}</b>
                      <small>{id === "live" && locale === "fr" ? "/fr/live" : href}</small>
                    </span>
                    <progress
                      aria-label={`${labels.modeNames[id]} ${labels.energy}`}
                      max={maximumModeEnergy || 1}
                      value={modeFootprint?.energyKwh ?? 0}
                    />
                    <strong>{modeFootprint ? formatEnergy(modeFootprint.energyKwh) : labels.notMeasured}</strong>
                  </li>
                );
              })}
            </ul>
          </section>
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
          liveHref={locale === "fr" ? "/fr/live" : "/live"}
          energyByMode={energyByMode}
          unmeasuredLabel={labels.notMeasured}
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
            <small>{labels.modeNames[mode]} · {labels.compactLabel}</small>
            <strong aria-live="polite">{energyValue}</strong>
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
