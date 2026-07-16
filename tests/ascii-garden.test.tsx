// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AsciiGardenApp } from "../src/ascii/AsciiGardenApp";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ASCII systems garden", () => {
  it("preserves the garden story without graphical renderers", () => {
    render(<AsciiGardenApp />);

    expect(screen.getByRole("heading", { name: /I GROW SYSTEMS THAT/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "USEFUL SOFTWARE, MEASURED IN THE REAL WORLD." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "MEASURE BEFORE YOU OPTIMIZE." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "READY TO BUILD A LOWER-IMPACT SYSTEM?" })).toBeTruthy();

    const container = document.querySelector(".ascii-site");
    expect(container?.querySelector("img, svg, canvas, video, picture")).toBeNull();
    expect(screen.getByText("DOM TEXT / NO WEBGL")).toBeTruthy();
    expect(screen.getByText("EST. CARBON FOOTPRINT")).toBeTruthy();
    expect(document.querySelector('.carbon-footprint-meter[data-mode="ascii"]')).toBeTruthy();

    const modes = screen.getByRole("navigation", { name: "Experience mode" });
    expect(within(modes).getByRole("link", { name: "ASCII" }).getAttribute("aria-current")).toBe("page");
    expect(within(modes).getByRole("link", { name: "LIVE" }).getAttribute("href")).toBe("/");
    expect(within(modes).getByRole("link", { name: "GAME" }).getAttribute("href")).toBe("/garden");
  });

  it("uses 7-bit ASCII for every animated and decorative text diagram", () => {
    render(<AsciiGardenApp />);

    const diagrams = [...document.querySelectorAll<HTMLElement>("[data-ascii-art]")];
    expect(diagrams.length).toBeGreaterThanOrEqual(6);
    for (const diagram of diagrams) {
      expect([...diagram.textContent ?? ""].every((character) => character.charCodeAt(0) <= 127)).toBe(true);
    }
  });

  it("lets the visitor pause and restart the ASCII energy flow", () => {
    render(<AsciiGardenApp />);

    const pause = screen.getByRole("button", { name: /PAUSE FLOW/ });
    expect(pause.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(pause);
    expect(screen.getByRole("button", { name: /START FLOW/ }).getAttribute("aria-pressed")).toBe("true");
  });
});
