import { useFrame } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { PLAYER_RADIUS, resolveMovement, resolveRobotOverlap } from "../collision";
import { getNearestSystem } from "../content";
import {
  advanceJump,
  createGroundedJumpState,
  getJumpRequestSequence,
  queueJumpRequest
} from "../jump";
import { useGameStore } from "../store";
import type { InputAction, InputDirection, ThirdPersonCameraState, WorldPosition } from "../types";
import { getTerrainHeight } from "../world/procedural";
import {
  PALETTE,
  SharedBox,
  VoxelInstances,
  type VoxelBlock
} from "../world/VoxelPrimitives";

export interface PlayerProps {
  cameraStateRef: MutableRefObject<ThirdPersonCameraState>;
}

const BODY_BLOCKS: readonly VoxelBlock[] = [
  { color: PALETTE.grassDark, position: [0, 1.08, 0], scale: [0.66, 0.74, 0.42] },
  { color: PALETTE.coat, position: [-0.34, 1.06, 0], scale: [0.23, 0.8, 0.45] },
  { color: PALETTE.coat, position: [0.34, 1.06, 0], scale: [0.23, 0.8, 0.45] },
  { color: PALETTE.skin, position: [0, 1.76, 0.03], scale: [0.56, 0.58, 0.5] },
  { color: PALETTE.hair, position: [0, 2.06, -0.02], scale: [0.72, 0.25, 0.58] },
  { color: PALETTE.hair, position: [-0.34, 1.82, 0], scale: [0.22, 0.5, 0.49] },
  { color: PALETTE.hair, position: [0.34, 1.82, 0], scale: [0.22, 0.5, 0.49] },
  { color: PALETTE.hair, position: [0, 1.56, 0.29], scale: [0.46, 0.2, 0.17] },
  { color: PALETTE.creamLight, position: [-0.13, 1.82, 0.3], scale: [0.08, 0.08, 0.08] },
  { color: PALETTE.creamLight, position: [0.13, 1.82, 0.3], scale: [0.08, 0.08, 0.08] },
  // A small field pack makes the behind-the-character silhouette unmistakable.
  { color: PALETTE.brassDark, position: [0, 1.17, -0.31], scale: [0.5, 0.65, 0.22] },
  { color: PALETTE.lime, position: [0, 1.22, -0.44], scale: [0.2, 0.2, 0.06] },
  { color: PALETTE.waterBright, position: [-0.7, 0.63, 0.08], scale: [0.42, 0.43, 0.4] },
  { color: PALETTE.pipeLight, position: [-0.7, 0.91, 0.08], scale: [0.28, 0.14, 0.28] }
];

const KEY_DIRECTIONS: Readonly<Record<string, InputDirection>> = {
  w: "up", W: "up", ArrowUp: "up",
  s: "down", S: "down", ArrowDown: "down",
  a: "left", A: "left", ArrowLeft: "left",
  d: "right", D: "right", ArrowRight: "right"
};

function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function interactNear(position: WorldPosition) {
  const state = useGameStore.getState();
  if (state.phase !== "playing" || state.viewMode !== "explore") return;
  const nearest = getNearestSystem(position, { maxDistance: 4.8 });
  if (nearest) state.openSystem(nearest.id);
  else state.setNotice("Follow the compass and move closer to the active outpost.");
}

function dampAngle(current: number, target: number, smoothing: number, delta: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-smoothing * delta));
}

export function Player({ cameraStateRef }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const positionRef = useRef<WorldPosition>({ ...useGameStore.getState().playerPosition });
  const publishElapsedRef = useRef(0);
  const waveUntilRef = useRef(0);
  const sprintRef = useRef(false);
  const previousGamepadInteractRef = useRef(false);
  const previousJumpInputRef = useRef(false);
  const consumedJumpRequestRef = useRef(getJumpRequestSequence());
  const jumpStateRef = useRef(createGroundedJumpState());
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);

  useEffect(() => {
    const initial = useGameStore.getState().playerPosition;
    positionRef.current = { ...initial };
    jumpStateRef.current = createGroundedJumpState();
    groupRef.current?.position.set(initial.x, getTerrainHeight(initial.x, initial.z) + 0.06, initial.z);
    if (groupRef.current) groupRef.current.rotation.y = Math.PI;

    return useGameStore.subscribe((state, previousState) => {
      if (state.viewMode !== previousState.viewMode && state.viewMode === "bird") {
        sprintRef.current = false;
        previousGamepadInteractRef.current = false;
        previousJumpInputRef.current = false;
      }
      if (state.playerPosition.x === previousState.playerPosition.x &&
          state.playerPosition.z === previousState.playerPosition.z) return;
      const local = positionRef.current;
      const externalDistance = Math.hypot(state.playerPosition.x - local.x, state.playerPosition.z - local.z);
      if (externalDistance > 0.3 || state.phase !== previousState.phase) {
        positionRef.current = { ...state.playerPosition };
        jumpStateRef.current = createGroundedJumpState();
        groupRef.current?.position.set(
          state.playerPosition.x,
          getTerrainHeight(state.playerPosition.x, state.playerPosition.z) + 0.06,
          state.playerPosition.z
        );
      }
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(event) || event.target instanceof HTMLButtonElement) return;
      const state = useGameStore.getState();
      const canControl = state.phase === "playing" && state.viewMode === "explore";
      if (event.key === "Shift") sprintRef.current = canControl;
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) {
        event.preventDefault();
        if (canControl) state.setInput(direction, true);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        if (!event.repeat && canControl) {
          queueJumpRequest();
        }
        if (canControl) state.setInput("jump", true);
        return;
      }
      if (!event.repeat && ["e", "E", "Enter"].includes(event.key)) {
        event.preventDefault();
        interactNear(positionRef.current);
      } else if (canControl && !event.repeat && ["f", "F"].includes(event.key)) {
        waveUntilRef.current = performance.now() + 1050;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") sprintRef.current = false;
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) useGameStore.getState().setInput(direction, false);
      if (event.key === " ") useGameStore.getState().setInput("jump", false);
    };
    const clearInput = () => {
      sprintRef.current = false;
      const store = useGameStore.getState();
      (["up", "down", "left", "right", "jump"] as const satisfies readonly InputAction[])
        .forEach((input) => store.setInput(input, false));
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearInput);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearInput);
      clearInput();
    };
  }, []);

  useFrame(({ clock }, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = useGameStore.getState();
    const canControl = state.phase === "playing" && state.viewMode === "explore";
    const delta = Math.min(rawDelta, 0.05);
    let localRight = 0;
    let localForward = 0;
    let gamepadInteract = false;
    let gamepadSprint = false;
    let gamepadJump = false;

    if (canControl) {
      localRight = Number(state.input.right) - Number(state.input.left);
      localForward = Number(state.input.up) - Number(state.input.down);
      const gamepad = typeof navigator !== "undefined" ? navigator.getGamepads?.()[0] : null;
      if (gamepad) {
        const deadzone = 0.22;
        const axisX = Math.abs(gamepad.axes[0] ?? 0) > deadzone ? gamepad.axes[0] ?? 0 : 0;
        const axisY = Math.abs(gamepad.axes[1] ?? 0) > deadzone ? -(gamepad.axes[1] ?? 0) : 0;
        localRight += axisX + Number(gamepad.buttons[15]?.pressed) - Number(gamepad.buttons[14]?.pressed);
        localForward += axisY + Number(gamepad.buttons[12]?.pressed) - Number(gamepad.buttons[13]?.pressed);
        gamepadJump = Boolean(gamepad.buttons[0]?.pressed);
        gamepadInteract = Boolean(gamepad.buttons[2]?.pressed);
        gamepadSprint = Boolean(gamepad.buttons[10]?.pressed);
      }
      if (gamepadInteract && !previousGamepadInteractRef.current) interactNear(positionRef.current);
      previousGamepadInteractRef.current = gamepadInteract;
    } else {
      previousGamepadInteractRef.current = false;
    }

    const movementTime = reducedMotion ? 0 : clock.elapsedTime;
    const jumpPressed = canControl && (state.input.jump || gamepadJump);
    const jumpRequestSequence = getJumpRequestSequence();
    const queuedJump = jumpRequestSequence !== consumedJumpRequestRef.current;
    consumedJumpRequestRef.current = jumpRequestSequence;
    const jumpRequested = canControl && (
      queuedJump || (jumpPressed && !previousJumpInputRef.current)
    );
    previousJumpInputRef.current = jumpPressed;

    let current = positionRef.current;
    let positionChanged = false;
    if (canControl) {
      const separated = resolveRobotOverlap(current, movementTime);
      positionChanged = separated.x !== current.x || separated.z !== current.z;
      current = separated;
    }

    const inputLength = Math.hypot(localRight, localForward);
    const moving = inputLength > 0.04 && canControl;
    if (moving) {
      localRight /= Math.max(1, inputLength);
      localForward /= Math.max(1, inputLength);
      const yaw = cameraStateRef.current.yaw;
      const moveX = localRight * Math.cos(yaw) - localForward * Math.sin(yaw);
      const moveZ = -localRight * Math.sin(yaw) - localForward * Math.cos(yaw);
      const sprinting = sprintRef.current || gamepadSprint;
      const speed = sprinting ? 10.2 : 6.35;
      const next = resolveMovement(current, {
        x: current.x + moveX * speed * delta,
        z: current.z + moveZ * speed * delta
      }, PLAYER_RADIUS, { robotElapsed: movementTime });
      positionChanged = positionChanged || next.x !== current.x || next.z !== current.z;
      current = next;
      group.rotation.y = dampAngle(group.rotation.y, Math.atan2(moveX, moveZ), 14, delta);
    }

    positionRef.current = current;
    group.position.x = current.x;
    group.position.z = current.z;

    if (positionChanged) {
      publishElapsedRef.current += delta;
      if (publishElapsedRef.current >= 0.075) {
        useGameStore.getState().setPlayerPosition(current);
        publishElapsedRef.current = 0;
      }
    } else if (publishElapsedRef.current > 0) {
      useGameStore.getState().setPlayerPosition(current);
      publishElapsedRef.current = 0;
    }

    if (state.phase === "playing") {
      jumpStateRef.current = advanceJump(jumpStateRef.current, delta, jumpRequested);
      const groundY = getTerrainHeight(current.x, current.z) + 0.06;
      group.position.y = jumpStateRef.current.grounded
        ? (reducedMotion ? groundY : THREE.MathUtils.damp(group.position.y, groundY, 18, delta))
        : groundY + jumpStateRef.current.height;
    }

    const airborne = !jumpStateRef.current.grounded;
    const runSpeed = sprintRef.current || gamepadSprint ? 14 : 10;
    const stride = moving && !airborne && !reducedMotion ? Math.sin(clock.elapsedTime * runSpeed) * 0.62 : 0;
    const leftLegTarget = airborne ? -0.48 : stride;
    const rightLegTarget = airborne ? -0.3 : -stride;
    if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.damp(leftLegRef.current.rotation.x, leftLegTarget, 12, delta);
    if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.damp(rightLegRef.current.rotation.x, rightLegTarget, 12, delta);
    if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, airborne ? 0.42 : -stride * 0.65, 12, delta);
    if (rightArmRef.current) {
      const waving = performance.now() < waveUntilRef.current;
      rightArmRef.current.rotation.x = THREE.MathUtils.damp(
        rightArmRef.current.rotation.x,
        waving ? 0 : airborne ? 0.42 : stride * 0.65,
        12,
        delta
      );
      rightArmRef.current.rotation.z = waving
        ? -1.55 + Math.sin(clock.elapsedTime * 12) * 0.3
        : THREE.MathUtils.damp(rightArmRef.current.rotation.z, -0.08, 9, delta);
    }
  });

  const initial = positionRef.current;
  return (
    <group ref={groupRef} position={[initial.x, getTerrainHeight(initial.x, initial.z) + 0.06, initial.z]} rotation={[0, Math.PI, 0]} dispose={null}>
      <VoxelInstances blocks={BODY_BLOCKS} />
      <group ref={leftLegRef} position={[-0.2, 0.78, 0]}>
        <SharedBox color={PALETTE.trouser} position={[0, -0.32, 0]} scale={[0.29, 0.62, 0.34]} />
        <SharedBox color={PALETTE.charcoal} position={[0, -0.67, 0.08]} scale={[0.34, 0.2, 0.48]} />
      </group>
      <group ref={rightLegRef} position={[0.2, 0.78, 0]}>
        <SharedBox color={PALETTE.trouser} position={[0, -0.32, 0]} scale={[0.29, 0.62, 0.34]} />
        <SharedBox color={PALETTE.charcoal} position={[0, -0.67, 0.08]} scale={[0.34, 0.2, 0.48]} />
      </group>
      <group ref={leftArmRef} position={[-0.47, 1.36, 0]} rotation={[0, 0, 0.08]}>
        <SharedBox color={PALETTE.coat} position={[0, -0.33, 0]} scale={[0.24, 0.7, 0.28]} />
        <SharedBox color={PALETTE.skin} position={[0, -0.73, 0]} scale={[0.22, 0.22, 0.22]} />
      </group>
      <group ref={rightArmRef} position={[0.47, 1.36, 0]} rotation={[0, 0, -0.08]}>
        <SharedBox color={PALETTE.coat} position={[0, -0.33, 0]} scale={[0.24, 0.7, 0.28]} />
        <SharedBox color={PALETTE.skin} position={[0, -0.73, 0]} scale={[0.22, 0.22, 0.22]} />
      </group>
      <pointLight color={PALETTE.lime} intensity={0.7} distance={4} position={[0, 1.22, -0.62]} />
    </group>
  );
}
