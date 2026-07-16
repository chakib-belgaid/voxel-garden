import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CANONICAL_ORIGIN,
  PUBLIC_SITEMAP_PATHS,
  RECRUITER_ROUTES
} from "../src/server/routes";

interface RenderedRoute {
  readonly appHtml: string;
  readonly head: string;
  readonly htmlAttributes: Readonly<{ lang: "en" | "fr" }>;
}

interface ServerRenderer {
  renderRoute(options: {
    route: string;
    canonicalBaseUrl?: string;
  }): RenderedRoute;
}

interface ManifestChunk {
  readonly file: string;
  readonly isEntry?: boolean;
  readonly src?: string;
}

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = resolve(workspaceRoot, "dist");
const serverDirectory = resolve(workspaceRoot, ".prerender");

function stripManagedHead(html: string): string {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/gi, "")
    .replace(/\s*<meta\b[^>]*\bname=["'](?:description|robots|twitter:[^"']+)["'][^>]*>/gi, "")
    .replace(/\s*<meta\b[^>]*\bproperty=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/\s*<link\b[^>]*\brel=["'](?:canonical|alternate)["'][^>]*>/gi, "")
    .replace(/\s*<script\b[^>]*\bdata-prerender-jsonld\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

function renderDocument(
  template: string,
  route: string,
  rendered: RenderedRoute
): string {
  const rootPattern = /(<div\b[^>]*\bid=["']root["'][^>]*>)[\s\S]*?(<\/div>)/i;
  if (!rootPattern.test(template)) {
    throw new Error("The Vite template must contain a #root element for prerendering.");
  }

  const withoutManagedHead = stripManagedHead(template);
  const withHead = withoutManagedHead.replace(
    /<\/head>/i,
    `    ${rendered.head}\n  </head>`
  );
  const withLanguage = withHead.replace(
    /<html\b([^>]*)\blang=["'][^"']*["']([^>]*)>/i,
    `<html$1lang="${rendered.htmlAttributes.lang}"$2>`
  );
  const withRouteMarker = withLanguage.replace(
    /<body\b([^>]*)>/i,
    `<body$1 data-prerendered-route="${route}">`
  );

  return withRouteMarker.replace(rootPattern, `$1${rendered.appHtml}$2`);
}

function gardenHead(): string {
  const canonical = `${CANONICAL_ORIGIN}/garden`;
  const socialImage = `${CANONICAL_ORIGIN}/assets/generated/voxel-garden-key-art.jpg`;
  const description = "Systems Garden — a playable voxel portfolio about intelligent, efficient, energy-aware systems.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Systems Garden",
    description,
    url: canonical,
    creator: {
      "@type": "Person",
      name: "Chakib Belgaid",
      url: `${CANONICAL_ORIGIN}/`
    }
  };

  return [
    "<title>Systems Garden · Chakib Belgaid</title>",
    `<meta name="description" content="${description}">`,
    '<meta name="robots" content="index, follow">',
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="en" href="${canonical}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Chakib Belgaid">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:title" content="Systems Garden · Chakib Belgaid">',
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${socialImage}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="Systems Garden · Chakib Belgaid">',
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${socialImage}">`,
    `<script type="application/ld+json" data-prerender-jsonld>${JSON.stringify(jsonLd)}</script>`
  ].join("\n    ");
}

function asciiHead(): string {
  const canonical = `${CANONICAL_ORIGIN}/ascii`;
  const description = "An ASCII-only green software portfolio with animated solar, wind and energy-aware systems.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "ASCII Systems Garden",
    description,
    url: canonical,
    creator: {
      "@type": "Person",
      name: "Chakib Belgaid",
      url: `${CANONICAL_ORIGIN}/`
    }
  };

  return [
    "<title>ASCII Systems Garden · Chakib Belgaid</title>",
    `<meta name="description" content="${description}">`,
    '<meta name="robots" content="index, follow">',
    `<link rel="canonical" href="${canonical}">`,
    '<link rel="icon" href="data:,">',
    `<link rel="alternate" hreflang="en" href="${canonical}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Chakib Belgaid">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:title" content="ASCII Systems Garden · Chakib Belgaid">',
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${canonical}">`,
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:title" content="ASCII Systems Garden · Chakib Belgaid">',
    `<meta name="twitter:description" content="${description}">`,
    `<script type="application/ld+json" data-prerender-jsonld>${JSON.stringify(jsonLd)}</script>`
  ].join("\n    ");
}

async function loadServerRenderer(): Promise<ServerRenderer> {
  const manifestPath = resolve(serverDirectory, ".vite/manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<
    string,
    ManifestChunk
  >;
  const entry = Object.values(manifest).find(
    (chunk) => chunk.isEntry && chunk.src === "src/server/render.tsx"
  );
  if (!entry) {
    throw new Error("The SSR build did not emit the src/server/render.tsx entry.");
  }

  return import(pathToFileURL(resolve(serverDirectory, entry.file)).href) as Promise<ServerRenderer>;
}

async function writeOutput(relativePath: string, html: string): Promise<void> {
  const destination = resolve(distDirectory, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html, "utf8");
}

function redirectDocument(destination: string): string {
  const canonical = `${CANONICAL_ORIGIN}${destination}`;
  const clientDestination = JSON.stringify(destination);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, follow">
    <meta http-equiv="refresh" content="0; url=${destination}">
    <link rel="canonical" href="${canonical}">
    <title>Redirecting…</title>
    <script>window.location.replace(${clientDestination} + window.location.search + window.location.hash);</script>
  </head>
  <body>
    <p><a href="${destination}">Continue to Systems Garden</a></p>
  </body>
</html>`;
}

async function verifySitemap(): Promise<void> {
  const sitemap = await readFile(resolve(distDirectory, "sitemap.xml"), "utf8");
  for (const route of PUBLIC_SITEMAP_PATHS) {
    const canonical = route === "/" ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${route}`;
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
      throw new Error(`Sitemap is missing ${canonical}.`);
    }
  }
}

async function prerender(): Promise<void> {
  const templatePath = resolve(distDirectory, "index.html");
  const template = await readFile(templatePath, "utf8");
  const renderer = await loadServerRenderer();

  const garden = renderDocument(template, "/garden", {
    appHtml: "",
    head: gardenHead(),
    htmlAttributes: { lang: "en" }
  });
  await writeOutput("garden/index.html", garden);
  await writeOutput("fr/garden/index.html", redirectDocument("/garden"));

  const asciiTemplate = template.replace(
    /\s*<link\b[^>]*\brel=["']icon["'][^>]*>/gi,
    ""
  );
  const ascii = renderDocument(asciiTemplate, "/ascii", {
    appHtml: "",
    head: asciiHead(),
    htmlAttributes: { lang: "en" }
  });
  await writeOutput("ascii/index.html", ascii);

  for (const route of RECRUITER_ROUTES) {
    const rendered = renderer.renderRoute({
      route: route.path,
      canonicalBaseUrl: CANONICAL_ORIGIN
    });
    const document = renderDocument(template, route.path, rendered);
    await writeOutput(route.output, document);
  }

  await verifySitemap();
  await rm(serverDirectory, { recursive: true, force: true });
  console.log(`Prerendered ${RECRUITER_ROUTES.length} recruiter documents, /garden and /ascii SPA shells, plus the /fr/garden redirect.`);
}

await prerender();
