import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { audioManager } from "../audio/AudioManager";
import { GameCanvas } from "../game/world/GameCanvas";
import {
  REFERENCE_QA_MODE,
  flushPendingSave,
  installSaveFlushLifecycle,
  useGameStore
} from "../game/store";
import { GameUI } from "../ui";
import "../styles/app.css";

interface BoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

class SceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error("Voxel scene failed", error, info);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function canUseWebGL(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function WebGLFallback({ contextLost = false }: { contextLost?: boolean }) {
  return (
    <section className="webgl-fallback metal-panel" role="alert" data-testid="webgl-fallback">
      <AlertTriangle aria-hidden="true" />
      <span>{contextLost ? "RENDERER INTERRUPTED" : "WEBGL REQUIRED"}</span>
      <h1>{contextLost ? "The garden renderer lost its connection." : "This browser cannot render the voxel garden."}</h1>
      <p>
        {contextLost
          ? "Your progress is safe. Reload to rebuild the scene."
          : "Enable hardware acceleration or open the game in a current browser. All portfolio text remains available in the interface."}
      </p>
      <button className="pixel-button pixel-button--primary" type="button" onClick={() => window.location.reload()}>
        <RefreshCcw aria-hidden="true" /> RELOAD GARDEN
      </button>
    </section>
  );
}

export function GardenApp() {
  const [contextLost, setContextLost] = useState(false);
  const webglAvailable = useMemo(canUseWebGL, []);

  useEffect(() => {
    document.body.classList.toggle("qa-reference", REFERENCE_QA_MODE);
    return () => document.body.classList.remove("qa-reference");
  }, []);

  useEffect(() => {
    const initial = useGameStore.getState();
    audioManager.setSettings({ enabled: initial.settings.sound, volume: initial.settings.volume });

    const unsubscribe = useGameStore.subscribe((state, previous) => {
      if (
        state.settings.sound !== previous.settings.sound ||
        state.settings.volume !== previous.settings.volume
      ) {
        audioManager.setSettings({ enabled: state.settings.sound, volume: state.settings.volume });
      }

      if (state.phase === "playing" && previous.phase !== "playing") audioManager.startAmbience();
      if (state.phase !== "playing" && previous.phase === "playing") audioManager.stopAmbience();
      if (state.restoredIds.length > previous.restoredIds.length) audioManager.play("restore");
      if (state.phase === "complete" && previous.phase !== "complete") audioManager.play("complete");
    });

    const removeSaveLifecycle = installSaveFlushLifecycle();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        useGameStore.getState().pauseGame();
      }
    };
    const onBlur = () => useGameStore.getState().pauseGame();

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      flushPendingSave();
      removeSaveLifecycle();
      audioManager.dispose();
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const fallback = <WebGLFallback contextLost={contextLost} />;

  return (
    <main className="app-shell" id="game-ui" data-reference-mode={REFERENCE_QA_MODE ? "true" : "false"}>
      <h1 className="sr-only">Systems Garden — playable voxel portfolio</h1>
      <section className="world-layer" aria-label="Playable voxel systems garden">
        {webglAvailable && !contextLost ? (
          <SceneErrorBoundary fallback={fallback}>
            <GameCanvas
              className="world-canvas"
              onWebGLContextLost={() => setContextLost(true)}
              onWebGLContextRestored={() => setContextLost(false)}
            />
          </SceneErrorBoundary>
        ) : fallback}
      </section>
      <GameUI />
    </main>
  );
}

export default GardenApp;
