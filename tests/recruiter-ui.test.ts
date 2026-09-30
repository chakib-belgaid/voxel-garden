// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RecruiterRouter } from "../src/recruiter/RecruiterRouter";

afterEach(cleanup);

describe("recruiter portfolio UI", () => {
  it("renders the evidence-first English recruiter flow with live destinations", () => {
    render(createElement(RecruiterRouter, { route: "/live" }));

    expect(screen.getByRole("heading", {
      level: 1,
      name: "Applied AI Engineer building production LLM systems and developer tools."
    })).toBeTruthy();
    expect(screen.getByText(/Ph\.D\. in software engineering, with 10\+ years/)).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("100+ nodes")).toBeTruthy();
    expect(screen.getByText("98k")).toBeTruthy();

    expect(screen.getAllByRole("link", { name: "Read case study" })).toHaveLength(3);
    const caseLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="/work/"]');
    expect([...caseLinks].map((link) => link.getAttribute("href"))).toEqual([
      "/work/mcq-scan",
      "/work/whispbook",
      "/work/wattch"
    ]);

    expect(document.querySelector<HTMLAnchorElement>('a[download][href$="-en.pdf"]')).toBeTruthy();
    expect(document.querySelector('a[href="mailto:chakib.belgaid@gmail.com"]')).toBeTruthy();
    expect(document.querySelector('a[href="https://github.com/chakib-belgaid"][rel="noopener noreferrer"]')).toBeTruthy();
    expect(document.querySelector('a[href="https://www.linkedin.com/in/chakib-belgaid"][rel="noopener noreferrer"]')).toBeTruthy();
    expect(document.querySelector('.carbon-footprint-meter[data-mode="live"]')).toBeTruthy();

    const modes = screen.getByRole("navigation", { name: "Experience mode" });
    expect(within(modes).getByRole("link", { name: "ASCII" }).getAttribute("href")).toBe("/ascii");
    expect(within(modes).getByRole("link", { name: "LIVE" }).getAttribute("aria-current")).toBe("page");
    expect(within(modes).getByRole("link", { name: "LIVE" }).getAttribute("href")).toBe("/live");
    expect(within(modes).getByRole("link", { name: "GAME" }).getAttribute("href")).toBe("/game");
  });

  it("keeps the language switch on the matching French case study", () => {
    render(createElement(RecruiterRouter, { route: "/fr/work/whispbook" }));

    expect(screen.getByRole("heading", { level: 1, name: "Whisperbook" })).toBeTruthy();
    expect(screen.getByAltText(/lecture Android Whisperbook/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "English" }).getAttribute("href")).toBe("/work/whispbook");
    expect(screen.getByRole("link", { name: "Projets" }).getAttribute("href")).toBe("/fr/live#work");
    expect(document.querySelector<HTMLAnchorElement>('a[download][href$="-fr.pdf"]')).toBeTruthy();
    expect(screen.getByRole("link", { name: "LIVE" }).getAttribute("href")).toBe("/fr/live");
  });

  it("renders every case-study section in the shared typed order", () => {
    render(createElement(RecruiterRouter, { route: "/work/wattch" }));

    expect([...document.querySelectorAll(".portfolio-case-section")].map((section) => section.id)).toEqual([
      "context",
      "ownership",
      "architecture",
      "decisions",
      "reliability",
      "outcome",
      "proof"
    ]);
    expect(screen.getByText("Linux RAPL powercap or synthetic source")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Wattch Core" })).toBeTruthy();
    expect(screen.getByAltText(/deterministic test daemon/i)).toBeTruthy();
    expect(document.querySelector('a[href="#work"]')).toBeNull();
    expect(document.querySelector('a[href="/live#work"]')).toBeTruthy();
  });

  it("localizes unknown routes without pulling in the game surface", () => {
    render(createElement(RecruiterRouter, { route: "/fr/introuvable" }));

    expect(screen.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeTruthy();
    expect(document.querySelector("canvas")).toBeNull();
    expect(document.querySelector(".game-ui")).toBeNull();
  });
});
