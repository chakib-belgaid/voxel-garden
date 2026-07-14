// @vitest-environment jsdom

import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAYER_START } from "../src/game/content";
import {
  DEFAULT_SETTINGS,
  EMPTY_INPUT,
  SAVE_KEY,
  cancelPendingSave,
  flushPendingSave,
  useGameStore,
  validateAndMigrateSave
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
  if (!window.localStorage) {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: new MemoryStorage()
    });
  }
  window.localStorage.clear();
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
  cancelPendingSave();
  window.localStorage.clear();
}

beforeEach(() => {
  vi.useRealTimers();
  resetStore();
});

afterEach(() => {
  cleanup();
  resetStore();
  vi.restoreAllMocks();
});

describe("bird-view store contract", () => {
  it("gates the view by phase, clears held input, and rejects movement while overhead", () => {
    const actions = useGameStore.getState();
    actions.enterBirdView();
    expect(useGameStore.getState().viewMode).toBe("explore");

    actions.startNewGame();
    actions.setInput("up", true);
    actions.enterBirdView();
    expect(useGameStore.getState()).toMatchObject({
      phase: "playing",
      viewMode: "bird",
      input: EMPTY_INPUT
    });

    actions.setInput("right", true);
    expect(useGameStore.getState().input).toEqual(EMPTY_INPUT);
    actions.requestWebsiteSection("about");
    expect(useGameStore.getState().requestedWebsiteSection).toBe("about");
    actions.consumeWebsiteSection();
    expect(useGameStore.getState().requestedWebsiteSection).toBeNull();

    actions.pauseGame();
    actions.toggleBirdView();
    expect(useGameStore.getState().viewMode).toBe("bird");
    actions.resumeGame();
    expect(useGameStore.getState().viewMode).toBe("bird");
    actions.exitBirdView();
    expect(useGameStore.getState().viewMode).toBe("explore");
  });

  it("keeps view requests ephemeral and migrates version-5 progress and settings", () => {
    const actions = useGameStore.getState();
    actions.startNewGame();
    actions.enterBirdView();
    actions.requestWebsiteSection("projects");
    flushPendingSave();

    const envelope = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? "{}");
    expect(envelope.state).not.toHaveProperty("viewMode");
    expect(envelope.state).not.toHaveProperty("requestedWebsiteSection");

    const migrated = validateAndMigrateSave(
      {
        restoredIds: ["wattch"],
        playerPosition: PLAYER_START,
        settings: { ...DEFAULT_SETTINGS, highContrast: true, volume: 0.35 },
        hasSave: true
      },
      5
    );
    expect(migrated).toMatchObject({
      restoredIds: ["wattch"],
      settings: { highContrast: true, volume: 0.35 },
      hasSave: true
    });
  });
});

describe("bird-view accessible UI", () => {
  it("replaces the saved-game title menu with the new-game confirmation", () => {
    act(() => useGameStore.setState({ hasSave: true }));
    render(createElement(GameUI));

    expect(screen.getByTestId("title-screen")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "New game" }));

    expect(screen.queryByTestId("title-screen")).toBeNull();
    expect(screen.getByRole("dialog", { name: "RESET PROGRESS?" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "KEEP GARDEN" }));
    expect(screen.getByTestId("title-screen")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    fireEvent.click(screen.getByRole("button", { name: "RESET PROGRESS" }));
    expect(screen.queryByTestId("title-screen")).toBeNull();
    expect(screen.queryByRole("dialog", { name: "RESET PROGRESS?" })).toBeNull();
    expect(useGameStore.getState().phase).toBe("playing");
  });

  it("supports the overview button and B shortcut while hiding exploration controls", () => {
    act(() => useGameStore.getState().startNewGame());
    render(createElement(GameUI));

    const overviewButtons = screen.getAllByRole("button", {
      name: "Open bird's-eye website view"
    });
    expect(overviewButtons[0].getAttribute("aria-keyshortcuts")).toBe("B");
    fireEvent.click(overviewButtons[0]);

    expect(
      screen.getByRole("button", { name: "Return to garden exploration" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.queryByRole("button", { name: "Jump" })).toBeNull();
    expect(screen.getByTestId("game-ui").getAttribute("data-view-mode")).toBe("bird");
    expect(screen.getByTestId("game-ui").getAttribute("data-world-input")).toBe("blocked");

    fireEvent.keyDown(window, { key: "B" });
    expect(screen.getByTestId("game-ui").getAttribute("data-view-mode")).toBe("explore");
    expect(screen.getByRole("button", { name: "Jump" })).toBeTruthy();
  });

  it("toggles with B from a focused non-text HUD button", () => {
    act(() => useGameStore.getState().startNewGame());
    render(createElement(GameUI));

    const pauseButton = screen.getAllByRole("button", { name: "Pause game" })[0];
    pauseButton.focus();
    expect(document.activeElement).toBe(pauseButton);
    fireEvent.keyDown(pauseButton, { key: "B" });

    expect(useGameStore.getState().viewMode).toBe("bird");
    const returnButton = screen.getByRole("button", { name: "Return to garden exploration" });
    returnButton.focus();
    fireEvent.keyDown(returnButton, { key: "b" });
    expect(useGameStore.getState().viewMode).toBe("explore");
  });

  it("gives content overlays Escape precedence and returns to bird view after closing", () => {
    act(() => {
      const actions = useGameStore.getState();
      actions.startNewGame();
      actions.enterBirdView();
    });
    render(createElement(GameUI));

    const sectionsButton = screen.getByRole("button", { name: /sections/i });
    sectionsButton.focus();
    fireEvent.click(sectionsButton);
    expect(screen.getByTestId("website-sections-menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("website-sections-menu")).toBeNull();
    expect(document.activeElement).toBe(sectionsButton);
    expect(useGameStore.getState().viewMode).toBe("bird");

    act(() => useGameStore.getState().requestWebsiteSection("about"));
    expect(screen.getByRole("dialog", { name: "Garden information" })).toBeTruthy();
    expect(useGameStore.getState()).toMatchObject({ phase: "paused", viewMode: "bird" });
    fireEvent.click(screen.getByRole("button", { name: "Close information menu" }));
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", viewMode: "bird" });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(useGameStore.getState().viewMode).toBe("explore");
  });

  it("routes physical project requests to the existing dialog without proximity gating", () => {
    act(() => {
      const actions = useGameStore.getState();
      actions.startNewGame();
      actions.enterBirdView();
    });
    render(createElement(GameUI));

    act(() => useGameStore.getState().requestWebsiteSection("wattch"));
    expect(screen.getByTestId("project-dialog")).toBeTruthy();
    expect(screen.queryByText(/locate this beacon/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close WATTCH" }));
    expect(useGameStore.getState()).toMatchObject({ phase: "playing", viewMode: "bird" });
  });
});
