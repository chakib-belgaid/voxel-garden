import { Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { REFERENCE_QA_MODE, useGameStore } from "../store";
import type { ThirdPersonCameraState, ViewMode } from "../types";
import {
  BIRD_VIEW_FOV,
  BIRD_VIEW_TRANSITION_SECONDS,
  EMPTY_CAMERA_WHEEL_INTENT,
  calculateBirdViewCameraFit,
  processCameraWheelEvent,
  shouldUseImmediateCameraMotion,
  smoothCameraTransition,
  type CameraWheelIntentState
} from "./camera";
import { WEBSITE_MAP_BOUNDS } from "./generated/terminalDashboardMap";
import { getTerrainHeight } from "./procedural";
import { VoxelWorld } from "./VoxelWorld";

export interface GameCanvasProps {
  className?: string;
  onWebGLContextLost?: () => void;
  onWebGLContextRestored?: () => void;
}

interface CameraTransitionState {
  mode: ViewMode;
  elapsed: number;
  fromFov: number;
  fromFar: number;
}

const EXPLORE_BACKGROUND = new THREE.Color("#9ebda3");
const BIRD_BACKGROUND = new THREE.Color("#02080a");
const EXPLORE_UP = new THREE.Vector3(0, 1, 0);
// Looking straight down with -Z as camera-up makes the top of the map north.
const BIRD_UP = new THREE.Vector3(0, 0, -1);
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getSystemReducedMotionPreference(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    return false;
  }
}

function useSystemReducedMotionRef(): MutableRefObject<boolean> {
  const preferenceRef = useRef(getSystemReducedMotionPreference());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = (event: MediaQueryListEvent | MediaQueryList) => {
      preferenceRef.current = event.matches;
    };
    preferenceRef.current = mediaQuery.matches;
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }
    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return preferenceRef;
}

function CameraRig({
  cameraStateRef,
  exploreFov,
  prefersReducedMotionRef
}: {
  cameraStateRef: MutableRefObject<ThirdPersonCameraState>;
  exploreFov: number;
  prefersReducedMotionRef: MutableRefObject<boolean>;
}) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const currentTargetRef = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const desiredPosition = useRef(new THREE.Vector3());
  const fromPosition = useRef(new THREE.Vector3());
  const fromTarget = useRef(new THREE.Vector3());
  const fromUp = useRef(new THREE.Vector3(0, 1, 0));
  const desiredUp = useRef(new THREE.Vector3(0, 1, 0));
  const fromQuaternion = useRef(new THREE.Quaternion());
  const desiredQuaternion = useRef(new THREE.Quaternion());
  const lookAtMatrix = useRef(new THREE.Matrix4());
  const wheelIntentRef = useRef<CameraWheelIntentState>(EMPTY_CAMERA_WHEEL_INTENT);
  const transitionRef = useRef<CameraTransitionState>({
    mode: useGameStore.getState().viewMode,
    elapsed: BIRD_VIEW_TRANSITION_SECONDS,
    fromFov: exploreFov,
    fromFar: 210
  });

  useEffect(() => {
    const canvas = gl.domElement;
    let activePointer: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const canControlCamera = () => {
      const state = useGameStore.getState();
      return state.phase === "playing" && state.viewMode === "explore";
    };
    const syncCursor = () => {
      canvas.style.cursor = canControlCamera() ? "grab" : "default";
    };
    const releaseActivePointer = () => {
      if (activePointer !== null && canvas.hasPointerCapture?.(activePointer)) {
        canvas.releasePointerCapture?.(activePointer);
      }
      activePointer = null;
      syncCursor();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!canControlCamera()) return;
      activePointer = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointer || !canControlCamera()) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      cameraStateRef.current.yaw -= dx * 0.006;
      cameraStateRef.current.pitch = THREE.MathUtils.clamp(
        cameraStateRef.current.pitch + dy * 0.004,
        0.24,
        0.92
      );
    };
    const releasePointer = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      releaseActivePointer();
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const state = useGameStore.getState();
      if (state.phase !== "playing") return;
      const result = processCameraWheelEvent(
        event,
        state.viewMode,
        cameraStateRef.current.distance,
        wheelIntentRef.current,
        canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 0)
      );
      if (!result) return;
      cameraStateRef.current.distance = result.distance;
      wheelIntentRef.current = result.intent;
      if (result.action === "enter-bird") state.enterBirdView();
      if (result.action === "exit-bird") state.exitBirdView();
    };
    const preventMenu = (event: MouseEvent) => event.preventDefault();
    const unsubscribe = useGameStore.subscribe((state, previousState) => {
      if (state.viewMode !== previousState.viewMode || state.phase !== previousState.phase) {
        wheelIntentRef.current = EMPTY_CAMERA_WHEEL_INTENT;
        if (state.viewMode === "bird" || state.phase !== "playing") releaseActivePointer();
        else syncCursor();
      }
    });

    syncCursor();
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointercancel", releasePointer);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", preventMenu);
    return () => {
      unsubscribe();
      releaseActivePointer();
      canvas.style.cursor = "";
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", releasePointer);
      canvas.removeEventListener("pointercancel", releasePointer);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", preventMenu);
    };
  }, [cameraStateRef, gl]);

  useFrame((_, rawDelta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const delta = Math.min(rawDelta, 0.05);
    const state = useGameStore.getState();
    const controls = cameraStateRef.current;
    const canControlCamera = state.phase === "playing" && state.viewMode === "explore";
    const gamepad = typeof navigator !== "undefined" ? navigator.getGamepads?.()[0] : null;
    if (canControlCamera && gamepad) {
      const lookX = Math.abs(gamepad.axes[2] ?? 0) > 0.18 ? gamepad.axes[2] ?? 0 : 0;
      const lookY = Math.abs(gamepad.axes[3] ?? 0) > 0.18 ? gamepad.axes[3] ?? 0 : 0;
      controls.yaw -= lookX * delta * 2.2;
      controls.pitch = THREE.MathUtils.clamp(controls.pitch + lookY * delta * 1.6, 0.24, 0.92);
    }

    const followTargetY = getTerrainHeight(state.playerPosition.x, state.playerPosition.z) + 1.25;
    const horizontal = Math.cos(controls.pitch) * controls.distance;
    const followPositionX = state.playerPosition.x + Math.sin(controls.yaw) * horizontal;
    const followPositionZ = state.playerPosition.z + Math.cos(controls.yaw) * horizontal;
    const followPositionY = Math.max(
      followTargetY + Math.sin(controls.pitch) * controls.distance,
      getTerrainHeight(followPositionX, followPositionZ) + 1.25
    );
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const birdFit = calculateBirdViewCameraFit(WEBSITE_MAP_BOUNDS, aspect);

    if (state.viewMode === "bird") {
      desiredTarget.current.set(birdFit.centerX, birdFit.targetY, birdFit.centerZ);
      desiredPosition.current.set(birdFit.centerX, birdFit.positionY, birdFit.centerZ);
      desiredUp.current.copy(BIRD_UP);
    } else {
      desiredTarget.current.set(state.playerPosition.x, followTargetY, state.playerPosition.z);
      desiredPosition.current.set(followPositionX, followPositionY, followPositionZ);
      desiredUp.current.copy(EXPLORE_UP);
    }

    const transition = transitionRef.current;
    if (transition.mode !== state.viewMode) {
      transition.mode = state.viewMode;
      transition.elapsed = 0;
      transition.fromFov = camera.fov;
      transition.fromFar = camera.far;
      fromPosition.current.copy(camera.position);
      fromTarget.current.copy(currentTargetRef.current);
      fromUp.current.copy(camera.up);
      fromQuaternion.current.copy(camera.quaternion);
    }

    const immediate = shouldUseImmediateCameraMotion(
      state.settings.reducedMotion,
      prefersReducedMotionRef.current,
      REFERENCE_QA_MODE
    );
    const targetFov = state.viewMode === "bird" ? BIRD_VIEW_FOV : exploreFov;
    const targetFar = state.viewMode === "bird" ? birdFit.far : 210;
    const previousFov = camera.fov;
    const previousFar = camera.far;
    let shouldLookAt = true;

    if (transition.elapsed < BIRD_VIEW_TRANSITION_SECONDS) {
      transition.elapsed = immediate
        ? BIRD_VIEW_TRANSITION_SECONDS
        : Math.min(BIRD_VIEW_TRANSITION_SECONDS, transition.elapsed + rawDelta);
      const progress = smoothCameraTransition(
        transition.elapsed / BIRD_VIEW_TRANSITION_SECONDS
      );
      camera.position.lerpVectors(fromPosition.current, desiredPosition.current, progress);
      currentTargetRef.current.lerpVectors(fromTarget.current, desiredTarget.current, progress);
      camera.up.lerpVectors(fromUp.current, desiredUp.current, progress).normalize();
      lookAtMatrix.current.lookAt(
        desiredPosition.current,
        desiredTarget.current,
        desiredUp.current
      );
      desiredQuaternion.current.setFromRotationMatrix(lookAtMatrix.current);
      camera.quaternion.slerpQuaternions(
        fromQuaternion.current,
        desiredQuaternion.current,
        progress
      );
      camera.fov = THREE.MathUtils.lerp(transition.fromFov, targetFov, progress);
      camera.far = THREE.MathUtils.lerp(transition.fromFar, targetFar, progress);
      shouldLookAt = false;
    } else if (state.viewMode === "bird" || immediate) {
      camera.position.copy(desiredPosition.current);
      currentTargetRef.current.copy(desiredTarget.current);
      camera.up.copy(desiredUp.current);
      camera.fov = targetFov;
      camera.far = targetFar;
    } else {
      currentTargetRef.current.lerp(desiredTarget.current, 1 - Math.exp(-delta * 10));
      camera.position.lerp(desiredPosition.current, 1 - Math.exp(-delta * 8));
      camera.up.copy(EXPLORE_UP);
      camera.fov = exploreFov;
      camera.far = 210;
    }

    if (camera.fov !== previousFov || camera.far !== previousFar) {
      camera.updateProjectionMatrix();
    }
    if (shouldLookAt) camera.lookAt(currentTargetRef.current);
  });
  return null;
}

function SceneAtmosphere({
  prefersReducedMotionRef
}: {
  prefersReducedMotionRef: MutableRefObject<boolean>;
}) {
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const backgroundRef = useRef(EXPLORE_BACKGROUND.clone());
  const fogRef = useRef(new THREE.Fog(EXPLORE_BACKGROUND, 58, 126));
  const blendRef = useRef(useGameStore.getState().viewMode === "bird" ? 1 : 0);

  useEffect(() => {
    scene.background = backgroundRef.current;
    scene.fog = fogRef.current;
    gl.setClearColor(backgroundRef.current, 1);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [gl, scene]);

  useFrame((_, rawDelta) => {
    const state = useGameStore.getState();
    const target = state.viewMode === "bird" ? 1 : 0;
    if (shouldUseImmediateCameraMotion(
      state.settings.reducedMotion,
      prefersReducedMotionRef.current,
      REFERENCE_QA_MODE
    )) {
      blendRef.current = target;
    } else {
      const step = rawDelta / BIRD_VIEW_TRANSITION_SECONDS;
      blendRef.current = THREE.MathUtils.clamp(
        blendRef.current + Math.sign(target - blendRef.current) * Math.min(step, Math.abs(target - blendRef.current)),
        0,
        1
      );
    }
    const blend = smoothCameraTransition(blendRef.current);
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const fit = calculateBirdViewCameraFit(WEBSITE_MAP_BOUNDS, aspect);
    backgroundRef.current.copy(EXPLORE_BACKGROUND).lerp(BIRD_BACKGROUND, blend);
    fogRef.current.color.copy(backgroundRef.current);
    fogRef.current.near = THREE.MathUtils.lerp(58, fit.fogNear, blend);
    fogRef.current.far = THREE.MathUtils.lerp(126, fit.fogFar, blend);
    gl.setClearColor(backgroundRef.current, 1);
  });
  return null;
}

function SceneLighting({
  highQuality,
  prefersReducedMotionRef
}: {
  highQuality: boolean;
  prefersReducedMotionRef: MutableRefObject<boolean>;
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const hemisphereRef = useRef<THREE.HemisphereLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const blendRef = useRef(useGameStore.getState().viewMode === "bird" ? 1 : 0);

  useFrame((_, rawDelta) => {
    const light = lightRef.current;
    if (!light) return;
    const state = useGameStore.getState();
    const targetBlend = state.viewMode === "bird" ? 1 : 0;
    if (shouldUseImmediateCameraMotion(
      state.settings.reducedMotion,
      prefersReducedMotionRef.current,
      REFERENCE_QA_MODE
    )) {
      blendRef.current = targetBlend;
    } else {
      const step = rawDelta / BIRD_VIEW_TRANSITION_SECONDS;
      blendRef.current += Math.sign(targetBlend - blendRef.current) * Math.min(step, Math.abs(targetBlend - blendRef.current));
    }
    const blend = smoothCameraTransition(blendRef.current);
    const position = state.playerPosition;
    light.position.set(
      THREE.MathUtils.lerp(position.x - 28, WEBSITE_MAP_BOUNDS.center.x - 90, blend),
      THREE.MathUtils.lerp(42, WEBSITE_MAP_BOUNDS.maxY + 180, blend),
      THREE.MathUtils.lerp(position.z + 24, WEBSITE_MAP_BOUNDS.center.z + 70, blend)
    );
    light.target.position.set(
      THREE.MathUtils.lerp(position.x, WEBSITE_MAP_BOUNDS.center.x, blend),
      0,
      THREE.MathUtils.lerp(position.z, WEBSITE_MAP_BOUNDS.center.z, blend)
    );
    light.target.updateMatrixWorld();
    light.intensity = THREE.MathUtils.lerp(2.2, 2.65, blend);
    if (hemisphereRef.current) hemisphereRef.current.intensity = THREE.MathUtils.lerp(1.55, 0.8, blend);
    if (ambientRef.current) ambientRef.current.intensity = THREE.MathUtils.lerp(0.48, 0.72, blend);
    if (rimRef.current) rimRef.current.intensity = THREE.MathUtils.lerp(0.35, 0.62, blend);

    const shadowCamera = light.shadow.camera as THREE.OrthographicCamera;
    const islandExtent = Math.max(
      WEBSITE_MAP_BOUNDS.maxX - WEBSITE_MAP_BOUNDS.minX,
      WEBSITE_MAP_BOUNDS.maxZ - WEBSITE_MAP_BOUNDS.minZ
    ) * 0.54;
    const shadowExtent = THREE.MathUtils.lerp(34, islandExtent, blend);
    shadowCamera.left = -shadowExtent;
    shadowCamera.right = shadowExtent;
    shadowCamera.top = shadowExtent;
    shadowCamera.bottom = -shadowExtent;
    shadowCamera.far = THREE.MathUtils.lerp(100, 500, blend);
    shadowCamera.updateProjectionMatrix();
  });
  return (
    <>
      <hemisphereLight ref={hemisphereRef} args={["#d8efbc", "#16331f", 1.55]} />
      <ambientLight ref={ambientRef} intensity={0.48} color="#c5dcae" />
      <directionalLight
        ref={lightRef}
        intensity={2.2}
        color="#fff0c9"
        castShadow={highQuality}
        shadow-mapSize-width={highQuality ? 2048 : 512}
        shadow-mapSize-height={highQuality ? 2048 : 512}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-bias={-0.00045}
      />
      <directionalLight ref={rimRef} position={[18, 12, -20]} intensity={0.35} color="#58cbd0" />
    </>
  );
}

export function GameCanvas({ className, onWebGLContextLost, onWebGLContextRestored }: GameCanvasProps) {
  const quality = useGameStore((state) => state.settings.quality);
  const viewMode = useGameStore((state) => state.viewMode);
  const highQuality = quality === "high";
  const cameraStateRef = useRef<ThirdPersonCameraState>({ yaw: 0, pitch: 0.48, distance: 10.5 });
  const prefersReducedMotionRef = useSystemReducedMotionRef();
  const deviceDpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const compact = typeof window !== "undefined" && window.innerWidth < 768;
  const exploreFov = compact ? 62 : 55;
  const dpr = highQuality ? Math.min(deviceDpr, compact ? 1.4 : 1.8) : 1;

  return (
    <Canvas
      className={className}
      camera={{ position: [0, 8, 14], fov: exploreFov, near: 0.1, far: 210 }}
      dpr={dpr}
      shadows={highQuality ? "soft" : false}
      gl={{ alpha: false, antialias: highQuality, powerPreference: "high-performance", preserveDrawingBuffer: REFERENCE_QA_MODE }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.setClearColor(EXPLORE_BACKGROUND, 1);
        const canvas = gl.domElement;
        if (onWebGLContextLost) canvas.addEventListener("webglcontextlost", onWebGLContextLost);
        if (onWebGLContextRestored) canvas.addEventListener("webglcontextrestored", onWebGLContextRestored);
      }}
    >
      <SceneAtmosphere prefersReducedMotionRef={prefersReducedMotionRef} />
      {viewMode === "explore" ? (
        <Sky distance={450000} sunPosition={[-5, 7, 4]} inclination={0.52} azimuth={0.22} turbidity={7} rayleigh={1.35} />
      ) : null}
      <SceneLighting
        highQuality={highQuality}
        prefersReducedMotionRef={prefersReducedMotionRef}
      />
      <CameraRig
        cameraStateRef={cameraStateRef}
        exploreFov={exploreFov}
        prefersReducedMotionRef={prefersReducedMotionRef}
      />
      <VoxelWorld cameraStateRef={cameraStateRef} />
    </Canvas>
  );
}

export default GameCanvas;
