// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RecruiterRouter } from "../src/recruiter/RecruiterRouter";

afterEach(cleanup);

describe("recruiter portfolio UI", () => {
  it("renders the evidence-first English recruiter flow with live destinations", () => {
    render(createElement(RecruiterRouter, { route: "/" }));

    expect(screen.getByRole("heading", {
      level: 1,
      name: "Full-stack Product Engineer for AI systems and developer tools."
    })).toBeTruthy();
    expect(screen.getByText(/Ph\.D\. in software engineering with 10\+ years/)).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("100+ nodes")).toBeTruthy();
    expect(screen.getByText("98k")).toBeTruthy();

    expect(screen.getAllByRole("link", { name: "Read case study" })).toHaveLength(3);
    const caseLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="/work/"]');
    expect([...caseLinks].map((link) => link.getAttribute("href"))).toEqual([
      "/work/agentdiet",
      "/work/whispbook",
      "/work/wattch"
    ]);

    expect(document.querySelector<HTMLAnchorElement>('a[download][href$="-en.pdf"]')).toBeTruthy();
    expect(document.querySelector('a[href="mailto:chakib.belgaid@gmail.com"]')).toBeTruthy();
    expect(document.querySelector('a[href="https://github.com/chakib-belgaid"][rel="noopener noreferrer"]')).toBeTruthy();
    expect(document.querySelector('a[href="https://www.linkedin.com/in/chakib-belgaid"][rel="noopener noreferrer"]')).toBeTruthy();
  });

  it("keeps the language switch on the matching French case study", () => {
    render(createElement(RecruiterRouter, { route: "/fr/work/whispbook" }));

    expect(screen.getByRole("heading", { level: 1, name: "Whispbook" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "English" }).getAttribute("href")).toBe("/work/whispbook");
    expect(screen.getByRole("link", { name: "Projets" }).getAttribute("href")).toBe("/fr#work");
    expect(document.querySelector<HTMLAnchorElement>('a[download][href$="-fr.pdf"]')).toBeTruthy();
  });

  it("renders every case-study section in the shared typed order", () => {
    render(createElement(RecruiterRouter, { route: "/work/agentdiet" }));

    expect([...document.querySelectorAll(".portfolio-case-section")].map((section) => section.id)).toEqual([
      "context",
      "ownership",
      "architecture",
      "decisions",
      "reliability",
      "outcome",
      "proof"
    ]);
    expect(screen.getByText("Allowed result or explicit denial")).toBeTruthy();
    expect(document.querySelector('a[href="#work"]')).toBeNull();
    expect(document.querySelector('a[href="/#work"]')).toBeTruthy();
  });

  it("localizes unknown routes without pulling in the game surface", () => {
    render(createElement(RecruiterRouter, { route: "/fr/introuvable" }));

    expect(screen.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeTruthy();
    expect(document.querySelector("canvas")).toBeNull();
    expect(document.querySelector(".game-ui")).toBeNull();
  });
});
