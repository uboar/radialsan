// Geometry utilities for pie menu calculations.
// Coordinate system: 0 radians = top (12 o'clock), increasing clockwise.

export function angleFromCenter(cx: number, cy: number, x: number, y: number): number {
  // Standard atan2 has 0=right, CCW positive.
  // Convert to our system: 0=top, CW positive.
  return (Math.atan2(x - cx, -(y - cy)) + 2 * Math.PI) % (2 * Math.PI);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getSliceIndex(angle: number, numSlices: number): number {
  const sliceWidth = (2 * Math.PI) / numSlices;
  // Slice 0 is centered at 0 (top), spanning [-halfWidth, +halfWidth].
  // Shift angle by half a slice width so that 0 maps to slice 0.
  const shifted = (angle + sliceWidth / 2 + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(shifted / sliceWidth) % numSlices;
}

export function isInRing(dist: number, innerRadius: number, outerRadius: number): boolean {
  return dist >= innerRadius && dist <= outerRadius;
}

export function isInDeadZone(dist: number, deadZoneRadius: number): boolean {
  return dist <= deadZoneRadius;
}

export function getSliceAtPoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  numSlices: number,
  innerRadius: number,
  outerRadius: number,
  deadZoneRadius: number,
): number | null {
  const dist = distance(x, y, cx, cy);

  if (isInDeadZone(dist, deadZoneRadius)) return null;
  if (!isInRing(dist, innerRadius, outerRadius)) return null;

  const angle = angleFromCenter(cx, cy, x, y);
  return getSliceIndex(angle, numSlices);
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  // angle is in our coordinate system (0=top, CW).
  // canvas_x = cx + radius * sin(angle)
  // canvas_y = cy - radius * cos(angle)
  return {
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  };
}

export function getSliceCenterAngle(sliceIndex: number, numSlices: number): number {
  return ((2 * Math.PI) / numSlices) * sliceIndex;
}
