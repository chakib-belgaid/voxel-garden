import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evidenceReferences,
  locales,
  portfolioContacts,
  projectSectionOrder,
  projectSlugs,
  projects,
  resumeLinks,
  siteContent,
  type EvidenceId,
  type EvidenceMetric,
} from "../src/content/portfolio";

function expectEvidence(metric: EvidenceMetric) {
  expect(metric.evidenceIds.length, `${metric.id} has no evidence`).toBeGreaterThan(0);
  for (const evidenceId of metric.evidenceIds) {
    expect(evidenceReferences[evidenceId], `${evidenceId} is not registered`).toBeDefined();
  }
}

describe("portfolio content contract", () => {
  it("keeps the same project and section contract in English and French", () => {
    expect(Object.keys(projects.en).sort()).toEqual([...projectSlugs].sort());
    expect(Object.keys(projects.fr).sort()).toEqual([...projectSlugs].sort());

    for (const slug of projectSlugs) {
      const english = projects.en[slug];
      const french = projects.fr[slug];
      expect(english.slug).toBe(slug);
      expect(french.slug).toBe(slug);
      expect(english.sectionOrder).toEqual(projectSectionOrder);
      expect(french.sectionOrder).toEqual(projectSectionOrder);
      expect(french.media.map(({ id, kind, src }) => ({ id, kind, src }))).toEqual(
        english.media.map(({ id, kind, src }) => ({ id, kind, src })),
      );
      expect(french.proofLinks.map(({ id, url, kind }) => ({ id, url, kind }))).toEqual(
        english.proofLinks.map(({ id, url, kind }) => ({ id, url, kind })),
      );
    }
  });

  it("never publishes an unsupported metric", () => {
    for (const locale of locales) {
      siteContent[locale].impact.forEach(expectEvidence);
      for (const project of Object.values(projects[locale])) {
        project.outcomes.forEach(expectEvidence);
        const referencedEvidence: EvidenceId[] = project.media.flatMap((item) => item.evidenceIds);
        referencedEvidence.forEach((id) => expect(evidenceReferences[id]).toBeDefined());
      }
    }
  });

  it("uses stable contact and proof destinations", () => {
    expect(portfolioContacts).toEqual({
      email: "mailto:chakib.belgaid@gmail.com",
      github: "https://github.com/chakib-belgaid",
      linkedin: "https://www.linkedin.com/in/chakib-belgaid",
    });
    for (const locale of locales) {
      for (const project of Object.values(projects[locale])) {
        project.proofLinks.forEach((link) => expect(link.url).toMatch(/^https:\/\//));
      }
    }
  });

  it("ships both phone-free HTML and PDF resume editions", () => {
    for (const locale of locales) {
      const links = resumeLinks[locale];
      const htmlPath = join(process.cwd(), "public", links.html);
      const pdfPath = join(process.cwd(), "public", links.pdf);
      expect(existsSync(htmlPath), links.html).toBe(true);
      expect(existsSync(pdfPath), links.pdf).toBe(true);
      expect(statSync(pdfPath).size).toBeGreaterThan(1_000);
      const html = readFileSync(htmlPath, "utf8");
      expect(html).not.toMatch(/(?:\+33|0[1-9])(?:[ .-]?\d{2}){4}/);
      expect(html).toContain("chakib.belgaid@gmail.com");
      expect(html).toContain("github.com/chakib-belgaid");
      expect(html).toContain("linkedin.com/in/chakib-belgaid");
    }
  });

  it("only references media assets that are shipped", () => {
    for (const locale of locales) {
      for (const project of Object.values(projects[locale])) {
        project.media.forEach((item) => {
          expect(existsSync(join(process.cwd(), "public", item.src)), item.src).toBe(true);
        });
      }
    }
  });
});
