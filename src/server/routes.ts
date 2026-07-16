import { projects, siteContent } from "../content/portfolio";

export const CANONICAL_ORIGIN = "https://chakib-belgaid.github.io";

export type RecruiterLocale = "en" | "fr";
export type RecruiterRouteKind = "home" | "case-study" | "not-found";

export interface RecruiterRouteRecord {
  readonly path: string;
  readonly output: string;
  readonly locale: RecruiterLocale;
  readonly kind: RecruiterRouteKind;
  readonly title: string;
  readonly description: string;
  readonly alternate: Readonly<Record<RecruiterLocale, string>>;
  readonly socialImage?: string;
}

const HOME_ALTERNATES = { en: "/", fr: "/fr" } as const;
const WHISPBOOK_ALTERNATES = {
  en: "/work/whispbook",
  fr: "/fr/work/whispbook"
} as const;
const WATTCH_ALTERNATES = {
  en: "/work/wattch",
  fr: "/fr/work/wattch"
} as const;
const NOT_FOUND_ALTERNATES = { en: "/404", fr: "/fr/404" } as const;

export const RECRUITER_ROUTES = [
  {
    path: "/",
    output: "index.html",
    locale: "en",
    kind: "home",
    title: siteContent.en.metadata.title,
    description: siteContent.en.metadata.description,
    alternate: HOME_ALTERNATES,
    socialImage: "/social/home-en.svg"
  },
  {
    path: "/fr",
    output: "fr/index.html",
    locale: "fr",
    kind: "home",
    title: siteContent.fr.metadata.title,
    description: siteContent.fr.metadata.description,
    alternate: HOME_ALTERNATES,
    socialImage: "/social/home-fr.svg"
  },
  {
    path: "/work/whispbook",
    output: "work/whispbook/index.html",
    locale: "en",
    kind: "case-study",
    title: projects.en.whispbook.metadata.title,
    description: projects.en.whispbook.metadata.description,
    alternate: WHISPBOOK_ALTERNATES,
    socialImage: "/social/whispbook-en.svg"
  },
  {
    path: "/fr/work/whispbook",
    output: "fr/work/whispbook/index.html",
    locale: "fr",
    kind: "case-study",
    title: projects.fr.whispbook.metadata.title,
    description: projects.fr.whispbook.metadata.description,
    alternate: WHISPBOOK_ALTERNATES,
    socialImage: "/social/whispbook-fr.svg"
  },
  {
    path: "/work/wattch",
    output: "work/wattch/index.html",
    locale: "en",
    kind: "case-study",
    title: projects.en.wattch.metadata.title,
    description: projects.en.wattch.metadata.description,
    alternate: WATTCH_ALTERNATES,
    socialImage: "/social/wattch-en.svg"
  },
  {
    path: "/fr/work/wattch",
    output: "fr/work/wattch/index.html",
    locale: "fr",
    kind: "case-study",
    title: projects.fr.wattch.metadata.title,
    description: projects.fr.wattch.metadata.description,
    alternate: WATTCH_ALTERNATES,
    socialImage: "/social/wattch-fr.svg"
  },
  {
    path: "/404",
    output: "404.html",
    locale: "en",
    kind: "not-found",
    title: "Page not found · Chakib Belgaid",
    description: "The requested portfolio page could not be found.",
    alternate: NOT_FOUND_ALTERNATES
  },
  {
    path: "/fr/404",
    output: "fr/404.html",
    locale: "fr",
    kind: "not-found",
    title: "Page introuvable · Chakib Belgaid",
    description: "La page demandée est introuvable.",
    alternate: NOT_FOUND_ALTERNATES
  }
] as const satisfies readonly RecruiterRouteRecord[];

export type RecruiterRoutePath = (typeof RECRUITER_ROUTES)[number]["path"];

export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/fr",
  "/work/whispbook",
  "/fr/work/whispbook",
  "/work/wattch",
  "/fr/work/wattch",
  "/garden",
  "/ascii"
] as const;

export function getRecruiterRoute(path: string): RecruiterRouteRecord {
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const exact = RECRUITER_ROUTES.find((route) => route.path === normalized);
  if (exact) return exact;
  const locale = normalized.startsWith("/fr") ? "fr" : "en";
  const fallback = RECRUITER_ROUTES.find(
    (route) => route.kind === "not-found" && route.locale === locale
  );
  if (!fallback) throw new Error(`Missing ${locale} not-found route.`);
  return fallback;
}

export function absoluteUrl(path: string, origin = CANONICAL_ORIGIN): string {
  const base = origin.replace(/\/+$/, "");
  return path === "/" ? `${base}/` : `${base}${path}`;
}
