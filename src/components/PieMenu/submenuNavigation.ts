export interface ParentPopState {
  shouldPop: boolean;
  armed: boolean;
}

export type SubmenuOpenMode = "onHover" | "onThreshold" | "onClick";

export interface SubmenuActivation {
  submenuOpenMode: SubmenuOpenMode;
  submenuHoverDelayMs: number;
  maxSubmenuDepth: number;
}

const SUBMENU_OPEN_MODES: SubmenuOpenMode[] = [
  "onHover",
  "onThreshold",
  "onClick",
];

export const DEFAULT_SUBMENU_ACTIVATION: SubmenuActivation = {
  submenuOpenMode: "onHover",
  submenuHoverDelayMs: 400,
  maxSubmenuDepth: 3,
};

export function getParentPopState(
  distanceFromCenter: number,
  deadZoneRadius: number,
  stackDepth: number,
  armed: boolean,
): ParentPopState {
  if (stackDepth <= 0) {
    return { shouldPop: false, armed: false };
  }

  if (distanceFromCenter > deadZoneRadius) {
    return { shouldPop: false, armed: true };
  }

  return { shouldPop: armed, armed };
}

export function canEnterSubmenu(
  pending: boolean,
  stackDepth: number,
  maxDepth: number,
): boolean {
  return !pending && stackDepth < maxDepth;
}

function toNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

export function normalizeSubmenuActivation(
  activation: Partial<SubmenuActivation> | undefined,
): SubmenuActivation {
  const submenuOpenMode = SUBMENU_OPEN_MODES.includes(
    activation?.submenuOpenMode as SubmenuOpenMode,
  )
    ? (activation?.submenuOpenMode as SubmenuOpenMode)
    : DEFAULT_SUBMENU_ACTIVATION.submenuOpenMode;

  return {
    submenuOpenMode,
    submenuHoverDelayMs: toNonNegativeInteger(
      activation?.submenuHoverDelayMs,
      DEFAULT_SUBMENU_ACTIVATION.submenuHoverDelayMs,
    ),
    maxSubmenuDepth: toNonNegativeInteger(
      activation?.maxSubmenuDepth,
      DEFAULT_SUBMENU_ACTIVATION.maxSubmenuDepth,
    ),
  };
}

export function shouldOpenSubmenuOnThreshold(
  mode: SubmenuOpenMode,
  distanceFromCenter: number,
  outerRadius: number,
): boolean {
  return mode === "onThreshold" && distanceFromCenter > outerRadius;
}

export function shouldOpenSubmenuOnHover(mode: SubmenuOpenMode): boolean {
  return mode === "onHover";
}

export function shouldOpenSubmenuOnClick(mode: SubmenuOpenMode): boolean {
  return mode === "onClick";
}
