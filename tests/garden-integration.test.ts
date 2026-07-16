// @vitest-environment jsdom

import { createElement } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { GardenApp } from "../src/App";
import GardenAppModule from "../src/garden/GardenApp";
import { getGardenCaseStudyPath } from "../src/garden/caseStudyLinks";
import { PLAYER_START } from "../src/game/content";
import {
  DEFAULT_SETTINGS,
  EMPTY_INPUT,
  cancelPendingSave,
  useGameStore
} from "../src/game/store";
import { GameUI } from "../src/ui";

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number { return this.items.size; }
  clear(): void { this.items.clear(); }
  getItem(key: string): string | null { return this.items.get(String(key)) ?? null; }
  key(index: number): string | null { return [...this.items.keys()][index] ?? null; }
  removeItem(key: string): void { this.items.delete(String(key)); }
  setItem(key: string, value: string): void { this.items.set(String(key), String(value)); }
}

function resetStore(): void {
  cancelPendingSave();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: new MemoryStorage()
  });
  useGameStore.setState({
    phase: "title",
    viewMode: "explore",
    requestedWebsiteSection: null,
    restoredIds: [],
    activeSystemId: null,
    playerPosition: { ...PLAYER_START },
    endingSeen: false,
    input: { ...EMPTY_INPUT },
    settings: { ...DEFAULT_SETTINGS },
    hasSave: false,
    notice: null
  });
}

beforeEach(resetStore);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetStore();
});

describe("garden portfolio boundary", () => {
  it("keeps the current app entry as a compatibility export of the lazy-loadable garden root", () => {
    expect(App).toBe(GardenApp);
    expect(GardenAppModule).toBe(GardenApp);
  });

  it("exposes the three presentation modes from the game power widget", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(createElement(GardenApp));

    expect(document.querySelector('.carbon-footprint-meter[data-mode="game"]')).toBeTruthy();
    const modes = screen.getByRole("navigation", { name: "Experience mode" });
    expect(modes.querySelector('a[href="/ascii"]')).toBeTruthy();
    expect(modes.querySelector('a[href="/"]')).toBeTruthy();
    expect(modes.querySelector('a[href="/garden"][aria-current="page"]')).toBeTruthy();
    expect(screen.getByRole("link", { name: "LIVE 3D" })).toBeTruthy();
  });

  it("links the title and live garden HUD back to the recruiter portfolio", () => {
    const view = render(createElement(GameUI));
    expect(screen.getByRole("link", { name: "Portfolio" }).getAttribute("href")).toBe("/");

    view.unmount();
    act(() => useGameStore.getState().startNewGame());
    render(createElement(GameUI));

    const portfolioLinks = screen.getAllByRole("link", { name: "Portfolio" });
    expect(portfolioLinks.length).toBeGreaterThan(0);
    expect(portfolioLinks.every((link) => link.getAttribute("href") === "/")).toBe(true);
  });

  it("keeps gameplay actions separate from recruiter case-study links", () => {
    act(() => {
      const game = useGameStore.getState();
      game.startNewGame();
      game.enterBirdView();
    });
    render(createElement(GameUI));

    act(() => useGameStore.getState().requestWebsiteSection("projects"));

    expect(screen.getByRole("button", { name: "PLAY CHALLENGE: WATTCH" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "PLAY CHALLENGE: AGENT COMMERCE" })).toBeTruthy();
    const recruiterLinks = screen.getAllByRole("link", { name: "READ FULL CASE STUDY" });
    expect(recruiterLinks.map((link) => link.getAttribute("href")).sort()).toEqual([
      "/work/wattch",
      "/work/whispbook"
    ]);
  });

  it("publishes recruiter destinations only for the two matching garden systems", () => {
    expect(getGardenCaseStudyPath("wattch")).toBe("/work/wattch");
    expect(getGardenCaseStudyPath("whispbook")).toBe("/work/whispbook");
    expect(getGardenCaseStudyPath("agent-commerce")).toBeUndefined();
    expect(getGardenCaseStudyPath("dev-tools")).toBeUndefined();
  });
});
