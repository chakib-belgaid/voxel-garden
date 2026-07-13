export const JUMP_VELOCITY = 7.6;
export const JUMP_GRAVITY = 19.5;
export const MAX_FALL_SPEED = 18;

let jumpRequestSequence = 0;

export function queueJumpRequest(): number {
  jumpRequestSequence = (jumpRequestSequence + 1) % Number.MAX_SAFE_INTEGER;
  return jumpRequestSequence;
}

export function getJumpRequestSequence(): number {
  return jumpRequestSequence;
}

export interface JumpState {
  height: number;
  velocity: number;
  grounded: boolean;
}

export const GROUNDED_JUMP_STATE: Readonly<JumpState> = Object.freeze({
  height: 0,
  velocity: 0,
  grounded: true
});

export function createGroundedJumpState(): JumpState {
  return { ...GROUNDED_JUMP_STATE };
}

/** Fixed-step-friendly vertical simulation kept separate from React rendering. */
export function advanceJump(
  state: Readonly<JumpState>,
  rawDelta: number,
  jumpRequested: boolean
): JumpState {
  const delta = Number.isFinite(rawDelta) ? Math.max(0, Math.min(rawDelta, 0.05)) : 0;
  let height = Number.isFinite(state.height) ? Math.max(0, state.height) : 0;
  let velocity = Number.isFinite(state.velocity) ? state.velocity : 0;
  let grounded = state.grounded || height <= 0;

  if (jumpRequested && grounded) {
    grounded = false;
    velocity = JUMP_VELOCITY;
  }

  if (grounded || delta === 0) {
    return grounded
      ? { height: 0, velocity: 0, grounded: true }
      : { height, velocity, grounded: false };
  }

  velocity = Math.max(-MAX_FALL_SPEED, velocity - JUMP_GRAVITY * delta);
  height += velocity * delta;
  if (height <= 0 && velocity <= 0) return createGroundedJumpState();
  return { height, velocity, grounded: false };
}
