import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../src/server/render";
import {
  CANONICAL_ORIGIN,
  getRecruiterRoute,
  PUBLIC_SITEMAP_PATHS,
  RECRUITER_ROUTES
} from "../src/server/routes";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("static recruiter route contract", () => {
  it("defines every requested recruiter document and localized 404", () => {
    expect(RECRUITER_ROUTES.map((route) => route.path)).toEqual([
      "/live",
      "/fr/live",
      "/work/whispbook",
      "/fr/work/whispbook",
      "/work/wattch",
      "/fr/work/wattch",
      "/404",
      "/fr/404"
    ]);
    expect(new Set(RECRUITER_ROUTES.map((route) => route.output)).size).toBe(
      RECRUITER_ROUTES.length
    );
  });

  it("keeps sitemap routes public while excluding not-found and the French garden redirect", () => {
    expect(PUBLIC_SITEMAP_PATHS).toEqual([
      "/live",
      "/fr/live",
      "/work/whispbook",
      "/fr/work/whispbook",
      "/work/wattch",
      "/fr/work/wattch",
      "/game",
      "/ascii"
    ]);
    expect(PUBLIC_SITEMAP_PATHS).not.toContain("/garden");
  });

  it("maps unknown paths to the matching localized not-found route", () => {
    expect(getRecruiterRoute("/unknown").path).toBe("/404");
    expect(getRecruiterRoute("/fr/introuvable").path).toBe("/fr/404");
    expect(getRecruiterRoute("/work/wattch/").path).toBe("/work/wattch");
    expect(getRecruiterRoute("/live/").path).toBe("/live");
  });
});

describe("React server renderer", () => {
  for (const route of RECRUITER_ROUTES) {
    it(`renders ${route.path} with localized metadata`, () => {
      const rendered = renderRoute({ route: route.path });

      expect(rendered.appHtml.length).toBeGreaterThan(40);
      expect(rendered.appHtml).not.toContain("<canvas");
      expect(rendered.htmlAttributes.lang).toBe(route.locale);
      expect(rendered.head).toContain(`<title>${route.title}</title>`);
      expect(rendered.head).toContain(
        `rel="canonical" href="${CANONICAL_ORIGIN}${route.path}"`
      );
      expect(rendered.head).toContain('hreflang="en"');
      expect(rendered.head).toContain('hreflang="fr"');
      expect(rendered.head).toContain('hreflang="x-default"');

      if (route.kind === "not-found") {
        expect(rendered.head).toContain('name="robots" content="noindex, follow"');
      } else {
        expect(rendered.head).toContain('type="application/ld+json"');
        expect("socialImage" in route).toBe(true);
        if ("socialImage" in route) {
          expect(rendered.head).toContain(`${CANONICAL_ORIGIN}${route.socialImage}`);
        }
      }
    });
  }

  it("uses the canonical base passed by preview and test environments", () => {
    const rendered = renderRoute({
      route: "/fr/work/whispbook",
      canonicalBaseUrl: "https://preview.example/"
    });
    expect(rendered.head).toContain(
      'rel="canonical" href="https://preview.example/fr/work/whispbook"'
    );
    expect(rendered.head).not.toContain(CANONICAL_ORIGIN);
  });
});

describe("static discovery and deployment files", () => {
  it("publishes every social card referenced by metadata", async () => {
    for (const route of RECRUITER_ROUTES) {
      if (!("socialImage" in route)) continue;
      const svg = await readFile(resolve(workspaceRoot, "public", route.socialImage.slice(1)), "utf8");
      expect(svg).toContain('width="1200"');
      expect(svg).toContain('height="630"');
      expect(svg).not.toContain("data:image");
    }
  });

  it("lists every indexable route in the sitemap", async () => {
    const sitemap = await readFile(resolve(workspaceRoot, "public/sitemap.xml"), "utf8");
    for (const path of PUBLIC_SITEMAP_PATHS) {
      const canonical = `${CANONICAL_ORIGIN}${path}`;
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
    }
  });

  it("uses modern Vercel routing and limits the SPA fallback to the game", async () => {
    const vercel = JSON.parse(
      await readFile(resolve(workspaceRoot, "vercel.json"), "utf8")
    ) as {
      redirects: readonly { source: string; destination: string; permanent: boolean }[];
      rewrites: readonly { source: string; destination: string }[];
      routes?: unknown;
    };

    expect(vercel.redirects).toContainEqual(
      expect.objectContaining({ source: "/", destination: "/live", permanent: true })
    );
    expect(vercel.redirects).toContainEqual(
      expect.objectContaining({ source: "/garden", destination: "/game", permanent: true })
    );
    expect(vercel.redirects).toContainEqual(
      expect.objectContaining({ destination: "https://chakib-belgaid.github.io/$1", permanent: true })
    );
    expect(vercel.routes).toBeUndefined();
    expect(vercel.rewrites).toEqual([
      { source: "/ascii", destination: "/ascii/index.html" },
      { source: "/game/:path*", destination: "/game/index.html" },
      { source: "/fr/:path*", destination: "/fr/404.html" }
    ]);
  });
});
