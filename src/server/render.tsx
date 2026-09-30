import { renderToString } from "react-dom/server";
import { RecruiterRouter } from "../recruiter/RecruiterRouter";
import {
  absoluteUrl,
  CANONICAL_ORIGIN,
  getRecruiterRoute,
  type RecruiterRouteRecord
} from "./routes";

export interface RenderRouteOptions {
  readonly route: string;
  readonly canonicalBaseUrl?: string;
}

export interface RenderedRecruiterRoute {
  readonly appHtml: string;
  readonly head: string;
  readonly htmlAttributes: Readonly<{ lang: "en" | "fr" }>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonLdFor(
  route: RecruiterRouteRecord,
  canonicalUrl: string,
  origin: string
): object | undefined {
  if (route.kind === "not-found") return undefined;

  const person = {
    "@type": "Person",
    name: "Chakib Belgaid",
    url: absoluteUrl("/live", origin),
    jobTitle: route.locale === "fr" ? "Ingénieur en IA appliquée" : "Applied AI Engineer",
    sameAs: [
      "https://github.com/chakib-belgaid",
      "https://www.linkedin.com/in/chakib-belgaid"
    ]
  };

  if (route.kind === "home") {
    return { "@context": "https://schema.org", ...person };
  }

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: route.title.replace(" · Chakib Belgaid", ""),
    description: route.description,
    inLanguage: route.locale,
    url: canonicalUrl,
    author: person
  };
}

function renderHead(route: RecruiterRouteRecord, origin: string): string {
  const canonicalUrl = absoluteUrl(route.path, origin);
  const englishUrl = absoluteUrl(route.alternate.en, origin);
  const frenchUrl = absoluteUrl(route.alternate.fr, origin);
  const defaultUrl = englishUrl;
  const robots = route.kind === "not-found" ? "noindex, follow" : "index, follow";
  const socialImage = route.socialImage ? absoluteUrl(route.socialImage, origin) : undefined;
  const jsonLd = jsonLdFor(route, canonicalUrl, origin);

  return [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
    `<link rel="alternate" hreflang="en" href="${escapeHtml(englishUrl)}">`,
    `<link rel="alternate" hreflang="fr" href="${escapeHtml(frenchUrl)}">`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(defaultUrl)}">`,
    `<meta property="og:type" content="${route.kind === "case-study" ? "article" : "website"}">`,
    `<meta property="og:site_name" content="Chakib Belgaid">`,
    `<meta property="og:locale" content="${route.locale === "fr" ? "fr_FR" : "en_US"}">`,
    `<meta property="og:title" content="${escapeHtml(route.title)}">`,
    `<meta property="og:description" content="${escapeHtml(route.description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
    socialImage ? `<meta property="og:image" content="${escapeHtml(socialImage)}">` : "",
    socialImage ? `<meta property="og:image:type" content="image/svg+xml">` : "",
    socialImage ? `<meta property="og:image:width" content="1200">` : "",
    socialImage ? `<meta property="og:image:height" content="630">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}">`,
    socialImage ? `<meta name="twitter:image" content="${escapeHtml(socialImage)}">` : "",
    jsonLd
      ? `<script type="application/ld+json" data-prerender-jsonld>${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>`
      : ""
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function renderRoute({
  route,
  canonicalBaseUrl = CANONICAL_ORIGIN
}: RenderRouteOptions): RenderedRecruiterRoute {
  const routeRecord = getRecruiterRoute(route);

  return {
    appHtml: renderToString(
      <RecruiterRouter route={routeRecord.path} canonicalBaseUrl={canonicalBaseUrl} />
    ),
    head: renderHead(routeRecord, canonicalBaseUrl),
    htmlAttributes: { lang: routeRecord.locale }
  };
}
