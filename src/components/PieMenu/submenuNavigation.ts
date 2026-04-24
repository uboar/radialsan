export interface ParentPopState {
  shouldPop: boolean;
  armed: boolean;
}

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
