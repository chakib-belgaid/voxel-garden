import { getSystemById } from "./content";
import type {
  AgentCommerceAnswer,
  ChallengeValidation,
  DevToolsAnswer,
  SystemId,
  WattchAnswer,
  WhispbookAnswer
} from "./types";

export const WATTCH_TARGET = Object.freeze({ min: 84, max: 90 });
export const WHISPBOOK_SEQUENCE = Object.freeze(["speak", "structure", "refine"] as const);
export const AGENT_COMMERCE_STAGES = Object.freeze(["plan", "act", "verify"] as const);
export const AGENT_COMMERCE_ROUTES = Object.freeze({
  "energy-audit": AGENT_COMMERCE_STAGES,
  "seed-order": AGENT_COMMERCE_STAGES,
  "helper-deploy": AGENT_COMMERCE_STAGES
} as const);
export const DEV_TOOLS_PIPELINE = Object.freeze([
  "source",
  "inspect",
  "compose",
  "test",
  "ship"
] as const);

function result(
  success: boolean,
  progress: number,
  message: string,
  fieldErrors?: Readonly<Record<string, string>>
): ChallengeValidation {
  return {
    success,
    progress: Math.max(0, Math.min(1, progress)),
    message,
    ...(fieldErrors && Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {})
  };
}

function answerValue(answer: unknown): unknown {
  if (typeof answer === "object" && answer !== null && "value" in answer) {
    return (answer as Partial<WattchAnswer>).value;
  }
  return answer;
}

export function validateWattch(answer: unknown): ChallengeValidation {
  const value = answerValue(answer);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return result(false, 0, "Set a finite meter value before calibrating.");
  }

  if (value >= WATTCH_TARGET.min && value <= WATTCH_TARGET.max) {
    return result(true, 1, "Efficiency locked. The monitor is stable.");
  }

  const nearestEdge = Math.min(
    Math.abs(value - WATTCH_TARGET.min),
    Math.abs(value - WATTCH_TARGET.max)
  );
  const progress = 1 - Math.min(1, nearestEdge / 84);
  return result(
    false,
    progress,
    value < WATTCH_TARGET.min
      ? "The reading is under the efficient band. Increase the calibration."
      : "The reading exceeds the efficient band. Reduce the calibration."
  );
}

function stepsValue(answer: unknown): readonly unknown[] | null {
  if (Array.isArray(answer)) return answer;
  if (typeof answer === "object" && answer !== null && "steps" in answer) {
    const steps = (answer as Partial<WhispbookAnswer>).steps;
    return Array.isArray(steps) ? steps : null;
  }
  return null;
}

export function validateWhispbook(answer: unknown): ChallengeValidation {
  const steps = stepsValue(answer);
  if (!steps) return result(false, 0, "Choose the voice stages in order.");

  let prefixLength = 0;
  while (
    prefixLength < steps.length &&
    prefixLength < WHISPBOOK_SEQUENCE.length &&
    steps[prefixLength] === WHISPBOOK_SEQUENCE[prefixLength]
  ) {
    prefixLength += 1;
  }

  const success =
    steps.length === WHISPBOOK_SEQUENCE.length && prefixLength === WHISPBOOK_SEQUENCE.length;
  if (success) return result(true, 1, "Voice pipeline restored: speak, structure, refine.");

  return result(
    false,
    prefixLength / WHISPBOOK_SEQUENCE.length,
    prefixLength < steps.length
      ? "That stage breaks the flow. Start with the spoken idea and refine last."
      : "The flow is correct so far. Add the remaining stage."
  );
}

function routesValue(answer: unknown): Readonly<Record<string, unknown>> | null {
  if (typeof answer !== "object" || answer === null || Array.isArray(answer)) return null;
  if ("routes" in answer) {
    const routes = (answer as Partial<AgentCommerceAnswer>).routes;
    return typeof routes === "object" && routes !== null && !Array.isArray(routes)
      ? routes
      : null;
  }
  // v1 challenge submissions called the route map `assignments`.
  if ("assignments" in answer) {
    const assignments = (answer as { assignments?: unknown }).assignments;
    return typeof assignments === "object" && assignments !== null && !Array.isArray(assignments)
      ? assignments as Readonly<Record<string, unknown>>
      : null;
  }
  return answer as Readonly<Record<string, unknown>>;
}

export function validateAgentCommerce(answer: unknown): ChallengeValidation {
  const routes = routesValue(answer);
  if (!routes) return result(false, 0, "Route each job through Plan, Act, and Verify.");

  const entries = Object.entries(AGENT_COMMERCE_ROUTES);
  const errors: Record<string, string> = {};
  let correct = 0;

  for (const [job, expectedRoute] of entries) {
    const route = routes[job];
    if (
      Array.isArray(route) &&
      route.length === expectedRoute.length &&
      route.every((stage, index) => stage === expectedRoute[index])
    ) {
      correct += 1;
    } else if (route === undefined) {
      errors[job] = "Complete this job's route.";
    } else {
      errors[job] = "Use Plan, then Act, then Verify.";
    }
  }

  if (correct === entries.length) {
    return result(true, 1, "All jobs are routed through accountable stages.");
  }

  return result(
    false,
    correct / entries.length,
    correct === 0 ? "The routes need another pass." : `${correct} of ${entries.length} routes are safe.`,
    errors
  );
}

/** @deprecated Use AGENT_COMMERCE_ROUTES. */
export const AGENT_COMMERCE_ASSIGNMENTS = AGENT_COMMERCE_ROUTES;

function pipelineValue(answer: unknown): DevToolsAnswer | null {
  if (typeof answer !== "object" || answer === null || Array.isArray(answer)) return null;
  const candidate = answer as Partial<DevToolsAnswer>;
  if (!Array.isArray(candidate.activated) || typeof candidate.testsPassed !== "boolean") return null;
  return { activated: candidate.activated, testsPassed: candidate.testsPassed };
}

export function validateDevTools(answer: unknown): ChallengeValidation {
  const pipeline = pipelineValue(answer);
  if (!pipeline) {
    return result(false, 0, "Activate the pipeline nodes and report the local checks.");
  }

  let prefixLength = 0;
  while (
    prefixLength < pipeline.activated.length &&
    prefixLength < DEV_TOOLS_PIPELINE.length &&
    pipeline.activated[prefixLength] === DEV_TOOLS_PIPELINE[prefixLength]
  ) {
    prefixLength += 1;
  }

  const nodesComplete =
    pipeline.activated.length === DEV_TOOLS_PIPELINE.length &&
    prefixLength === DEV_TOOLS_PIPELINE.length;
  const progress = (prefixLength + (pipeline.testsPassed ? 1 : 0)) / (DEV_TOOLS_PIPELINE.length + 1);

  if (!nodesComplete) {
    return result(
      false,
      progress,
      prefixLength < pipeline.activated.length
        ? "A pipeline node was activated out of order. Inspect source before shipping."
        : "Activate the remaining delivery node."
    );
  }

  if (!pipeline.testsPassed) {
    return result(false, progress, "The pipeline is connected; run its local checks before shipping.");
  }

  return result(true, 1, "Checks green. The local-first release is ready.");
}

export function validateChallenge(systemId: SystemId | string, answer: unknown): ChallengeValidation {
  if (!getSystemById(systemId)) return result(false, 0, "Unknown garden system.");

  switch (systemId) {
    case "wattch":
      return validateWattch(answer);
    case "whispbook":
      return validateWhispbook(answer);
    case "agent-commerce":
      return validateAgentCommerce(answer);
    case "dev-tools":
      return validateDevTools(answer);
    default:
      return result(false, 0, "Unknown garden system.");
  }
}

export const validateWattchChallenge = validateWattch;
export const validateWhispbookChallenge = validateWhispbook;
export const validateAgentCommerceChallenge = validateAgentCommerce;
export const validateDevToolsChallenge = validateDevTools;
