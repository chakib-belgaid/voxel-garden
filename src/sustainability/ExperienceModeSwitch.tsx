import "./experience-mode-switch.css";

export type ExperienceMode = "ascii" | "live" | "game";

const modes = [
  { id: "ascii", label: "ASCII", href: "/ascii" },
  { id: "live", label: "LIVE", href: "/" },
  { id: "game", label: "LIVE 3D", href: "/garden" }
] as const;

export function ExperienceModeSwitch({
  activeMode,
  ariaLabel = "Experience mode",
  liveHref = "/",
  variant = "default"
}: {
  readonly activeMode: ExperienceMode;
  readonly ariaLabel?: string;
  readonly liveHref?: string;
  readonly variant?: "default" | "ascii";
}) {
  return (
    <nav
      className={`experience-mode-switch experience-mode-switch--${variant}`}
      aria-label={ariaLabel}
    >
      {modes.map((mode) => (
        <a
          href={mode.id === "live" ? liveHref : mode.href}
          data-mode={mode.id}
          aria-current={mode.id === activeMode ? "page" : undefined}
          key={mode.id}
        >
          {mode.label}
        </a>
      ))}
    </nav>
  );
}
