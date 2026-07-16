import "./experience-mode-switch.css";

export type ExperienceMode = "ascii" | "live" | "game";

export const EXPERIENCE_MODES = [
  { id: "ascii", label: "ASCII", href: "/ascii" },
  { id: "live", label: "LIVE", href: "/live" },
  { id: "game", label: "GAME", href: "/game" }
] as const;

export function ExperienceModeSwitch({
  activeMode,
  ariaLabel = "Experience mode",
  liveHref = "/live",
  energyByMode = {},
  unmeasuredLabel = "Not measured",
  variant = "default"
}: {
  readonly activeMode: ExperienceMode;
  readonly ariaLabel?: string;
  readonly liveHref?: string;
  readonly energyByMode?: Readonly<Partial<Record<ExperienceMode, string>>>;
  readonly unmeasuredLabel?: string;
  readonly variant?: "default" | "ascii";
}) {
  return (
    <nav
      className={`experience-mode-switch experience-mode-switch--${variant}`}
      aria-label={ariaLabel}
    >
      {EXPERIENCE_MODES.map((mode) => (
        <a
          href={mode.id === "live" ? liveHref : mode.href}
          data-mode={mode.id}
          data-measured={energyByMode[mode.id] ? "true" : "false"}
          aria-current={mode.id === activeMode ? "page" : undefined}
          key={mode.id}
        >
          <span>{mode.label}</span>
          <small aria-hidden="true">{energyByMode[mode.id] ?? unmeasuredLabel}</small>
        </a>
      ))}
    </nav>
  );
}
